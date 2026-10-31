import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, ExecutionStatus } from '../../types/finance';
import {
  formatKwanza,
  formatMonthShort,
  formatMonthYear,
  EXECUTION_STATUS_LABELS,
} from '../../utils/formatters';
import { calculateDebtProjection } from '../../utils/calculations';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PartialPaymentModal } from '../common/PartialPaymentModal';

export const DebtsView: React.FC = () => {
  const {
    state,
    selectedMonth,
    addDebt,
    updateDebt,
    deleteDebt,
    recordDebtPayment,
    setDebtExecution,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [partialModalDebt, setPartialModalDebt] = useState<Debt | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(60000);

  // Form states
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(190000);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(60000);
  const [startMonth, setStartMonth] = useState(selectedMonth);
  const [paymentPercentage, setPaymentPercentage] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'settled' | 'paused'>('active');

  const openAddModal = () => {
    setEditingDebt(null);
    setName('');
    setCreditor('');
    setTotalAmount(190000);
    setMonthlyPayment(60000);
    setStartMonth(selectedMonth);
    setPaymentPercentage(undefined);
    setNotes('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (d: Debt) => {
    setEditingDebt(d);
    setName(d.name);
    setCreditor(d.creditor);
    setTotalAmount(d.totalAmount);
    setMonthlyPayment(d.monthlyPayment);
    setStartMonth(d.startMonth);
    setPaymentPercentage(d.paymentPercentage);
    setNotes(d.notes || '');
    setStatus(d.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !creditor.trim() || totalAmount <= 0 || monthlyPayment <= 0) return;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        name: name.trim(),
        creditor: creditor.trim(),
        totalAmount,
        monthlyPayment,
        startMonth,
        paymentPercentage,
        notes: notes.trim() || undefined,
        status,
      });
    } else {
      addDebt({
        name: name.trim(),
        creditor: creditor.trim(),
        totalAmount,
        monthlyPayment,
        startMonth,
        paymentPercentage,
        notes: notes.trim() || undefined,
        status,
      });
    }
    setIsModalOpen(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt || paymentAmount <= 0) return;

    const safeAmount = Math.min(paymentAmount, payingDebt.remainingAmount);
    recordDebtPayment(payingDebt.id, safeAmount);
    setIsPayModalOpen(false);
  };

  const totalOriginalDebt = state.debts.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalPaidDebt = state.debts.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalRemainingDebt = state.debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const overallPaidPct =
    totalOriginalDebt > 0 ? Math.round((totalPaidDebt / totalOriginalDebt) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Gestão de Dívidas</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle os saldos devedores, credores, pagamentos mensais e previsão exacta de liquidação
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right sm:border-r border-slate-200 sm:pr-4">
            <span className="text-[11px] text-slate-500 block">Saldo Total em Dívida</span>
            <span className="text-lg font-black text-red-600">
              {formatKwanza(totalRemainingDebt)}
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Dívida</span>
          </button>
        </div>
      </div>

      {/* Progress Bar of Debt Settlement */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Progresso de Amortização das Dívidas</span>
          <span className="font-extrabold text-emerald-700">{overallPaidPct}% Amortizado</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${overallPaidPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Já pago: {formatKwanza(totalPaidDebt)}</span>
          <span>Dívida original: {formatKwanza(totalOriginalDebt)}</span>
        </div>
      </div>

      {/* List of Debts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.debts.map((debt) => {
          const proj = calculateDebtProjection(debt);
          const isSettled = debt.remainingAmount === 0 || debt.status === 'settled';
          const paidPct =
            debt.totalAmount > 0 ? Math.round((debt.paidAmount / debt.totalAmount) * 100) : 0;
          const currentExec = debt.monthExecutions?.[selectedMonth];
          const currentMonthStatus = currentExec?.status || 'prevista';

          return (
            <div
              key={debt.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between transition ${
                isSettled ? 'border-emerald-200 bg-emerald-50/15' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-600" />
                      Credor: {debt.creditor}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{debt.name}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isSettled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-red-50 text-red-700 border-red-300'
                    }`}
                  >
                    {isSettled ? 'Liquidada' : 'Em Pagamento'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 my-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-500 font-medium">Saldo Restante</span>
                    <span className="font-black text-red-600 text-sm">
                      {formatKwanza(debt.remainingAmount)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSettled ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>{paidPct}% liquidado</span>
                    <span>Total: {formatKwanza(debt.totalAmount)}</span>
                  </div>
                </div>

                {/* Key Financing Details */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pagamento Mensal Previsto:</span>
                    <span className="font-bold text-slate-900">
                      {formatKwanza(debt.monthlyPayment)}/mês
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Mês de Início:</span>
                    <span className="font-semibold text-slate-800">
                      {formatMonthShort(debt.startMonth)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                    <span className="text-slate-600 font-medium">Mês Previsto de Conclusão:</span>
                    <span className="font-bold text-emerald-700">
                      {isSettled ? 'Concluída!' : formatMonthYear(proj.projectedEndMonth)}
                    </span>
                  </div>

                  {/* Execution status in current month */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Estado em {selectedMonth}:</span>
                    <select
                      value={currentMonthStatus}
                      onChange={(e) => {
                        const newStatus = e.target.value as ExecutionStatus;
                        if (newStatus === 'parcial') {
                          setPartialModalDebt(debt);
                          return;
                        }
                        setDebtExecution(debt.id, selectedMonth, newStatus);
                      }}
                      className="px-2 py-0.5 rounded-md border text-[11px] font-semibold bg-white cursor-pointer"
                    >
                      <option value="prevista">Prevista</option>
                      <option value="realizada">Realizada</option>
                      <option value="parcial">Realizada parcialmente</option>
                      <option value="nao_realizada">Não realizada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setPayingDebt(debt);
                    setPaymentAmount(Math.min(debt.monthlyPayment, debt.remainingAmount));
                    setIsPayModalOpen(true);
                  }}
                  disabled={isSettled}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isSettled
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                  }`}
                >
                  Amortizar Valor
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(debt)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Editar dívida"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDebtToDelete(debt)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Eliminar dívida"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Debt */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? 'Editar Dívida' : 'Registar Nova Dívida'}
        subtitle="Registe o credor, o montante inicial e o plano de pagamento mensal"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Dívida *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dívida Inicial, Empréstimo Familiar, Cartão..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Credor ou Pessoa a quem deve *
            </label>
            <input
              type="text"
              required
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              placeholder="Ex: Tio António, Banco BAI, Loja de informática..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Total da Dívida (Kz) *
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatKwanza(totalAmount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pagamento Mensal Previsto (Kz) *
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-red-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatKwanza(monthlyPayment)} por mês
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mês de Início do Pagamento *
              </label>
              <input
                type="month"
                required
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado da Dívida
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="active">Activa (A pagar)</option>
                <option value="settled">Liquidada</option>
                <option value="paused">Suspensa temporariamente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Acordos, juros (se houver) ou termos do pagamento..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs"
            >
              {editingDebt ? 'Guardar Alterações' : 'Criar Dívida'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Amortize Payment */}
      {payingDebt && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Amortizar Dívida: ${payingDebt.name}`}
          subtitle={`Saldo actual restante: ${formatKwanza(payingDebt.remainingAmount)}`}
        >
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor a Pagar / Amortizar (Kz) *
              </label>
              <input
                type="number"
                min="500"
                step="500"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Visualização: {formatKwanza(paymentAmount)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-xs"
              >
                Confirmar Amortização
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Confirmação de Eliminação de Dívida */}
      {debtToDelete && (
        <ConfirmDialog
          isOpen={!!debtToDelete}
          onClose={() => setDebtToDelete(null)}
          onConfirm={() => {
            if (debtToDelete) {
              deleteDebt(debtToDelete.id);
              setDebtToDelete(null);
            }
          }}
          title="Eliminar Dívida"
          message={`Tem a certeza que deseja eliminar o registo da dívida "${debtToDelete.name}" (${debtToDelete.creditor})? O planeamento mensal e a estimativa de liquidação serão actualizados.`}
          confirmText="Eliminar Dívida"
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}

      {/* Modal Pagamento Parcial de Dívida */}
      {partialModalDebt && (
        <PartialPaymentModal
          isOpen={!!partialModalDebt}
          onClose={() => setPartialModalDebt(null)}
          itemName={`Amortização: ${partialModalDebt.name}`}
          itemTypeLabel="Dívida"
          plannedAmount={partialModalDebt.monthlyPayment}
          initialRealizedAmount={
            partialModalDebt.monthExecutions?.[selectedMonth]?.status === 'parcial'
              ? partialModalDebt.monthExecutions?.[selectedMonth]?.realizedAmount
              : undefined
          }
          onConfirm={(realizedAmount) => {
            setDebtExecution(partialModalDebt.id, selectedMonth, 'parcial', realizedAmount);
            setPartialModalDebt(null);
          }}
        />
      )}
    </div>
  );
};
