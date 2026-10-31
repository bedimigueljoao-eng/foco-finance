import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatKwanza,
  formatMonthYear,
  addMonths,
} from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const EmergencyFundView: React.FC = () => {
  const {
    state,
    selectedMonth,
    essentialExpenses,
    updateEmergencyFundConfig,
    addEmergencyTransaction,
  } = useFinance();

  const ef = state.emergencyFund;

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txAmount, setTxAmount] = useState<number>(20000);
  const [txReason, setTxReason] = useState('');

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [targetMonths, setTargetMonths] = useState<number>(ef.targetMonths);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(ef.monthlyContribution);
  const [startMonth, setStartMonth] = useState<string>(ef.startMonth);

  // Calculations
  const targetAmount = ef.customTargetAmount ?? (essentialExpenses * targetMonths);
  const remainingToTarget = Math.max(0, targetAmount - ef.currentBalance);
  const monthsCoveredCurrently =
    essentialExpenses > 0 ? (ef.currentBalance / essentialExpenses).toFixed(1) : '0';
  const progressPercent =
    targetAmount > 0 ? Math.min(100, Math.round((ef.currentBalance / targetAmount) * 100)) : 0;

  // Month to complete emergency fund
  let projectedCompletionMonth = 'Em dia';
  if (remainingToTarget > 0) {
    if (monthlyContribution > 0) {
      const monthsNeeded = Math.ceil(remainingToTarget / monthlyContribution);
      projectedCompletionMonth = formatMonthYear(addMonths(selectedMonth, monthsNeeded - 1));
    } else {
      projectedCompletionMonth = 'Aporte mensal não definido';
    }
  } else {
    projectedCompletionMonth = 'Objectivo alcançado!';
  }

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0 || !txReason.trim()) return;
    addEmergencyTransaction(txType, txAmount, txReason.trim());
    setIsTxModalOpen(false);
    setTxReason('');
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencyFundConfig({
      targetMonths,
      monthlyContribution,
      startMonth,
    });
    setIsConfigModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Fundo de Emergência</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reserva de segurança para cobrir de 3 a 6 meses de despesas essenciais em imprevistos
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            Ajustar Parâmetros
          </button>
          <button
            onClick={() => {
              setTxType('deposit');
              setTxAmount(ef.monthlyContribution || 20000);
              setIsTxModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Fazer Depósito</span>
          </button>
          <button
            onClick={() => {
              setTxType('withdrawal');
              setTxAmount(10000);
              setIsTxModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Registar Levantamento</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Actual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Saldo Actual Guardado</span>
          <p className="text-2xl font-black text-teal-800 tracking-tight mt-1">
            {formatKwanza(ef.currentBalance)}
          </p>
          <span className="text-[11px] text-teal-600 font-semibold mt-1 block">
            {progressPercent}% do objectivo total
          </span>
        </div>

        {/* Meses Cobertos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Cobertura Actual</span>
          <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {monthsCoveredCurrently} <span className="text-sm font-semibold text-slate-500">meses</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Objectivo definido: {ef.targetMonths} meses ({formatKwanza(targetAmount)})
          </span>
        </div>

        {/* Falta Poupar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Falta para Atingir a Meta</span>
          <p className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {formatKwanza(remainingToTarget)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Aporte: {formatKwanza(ef.monthlyContribution)}/mês
          </span>
        </div>

        {/* Mês Previsto de Conclusão */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Previsão de Meta Plena</span>
          <p className="text-lg font-black text-emerald-700 tracking-tight mt-1">
            {projectedCompletionMonth}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Despesas essenciais: {formatKwanza(essentialExpenses)}/mês
          </span>
        </div>
      </div>

      {/* Visual Progress Bar Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Progresso do Fundo de Emergência</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
              {ef.targetMonths} Meses de Despesas Essenciais
            </span>
          </div>
          <span className="font-extrabold text-teal-700">{progressPercent}%</span>
        </div>

        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Actual: {formatKwanza(ef.currentBalance)}</span>
          <span>Meta: {formatKwanza(targetAmount)}</span>
        </div>
      </div>

      {/* Histórico de Movimentos (Depósitos e Levantamentos com Motivos) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Histórico de Movimentações</h3>
            <p className="text-xs text-slate-500">
              Depósitos regulares e levantamentos justificados
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {ef.transactions.length} transacção(ões)
          </span>
        </div>

        {ef.transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Ainda não há transacções registadas no fundo de emergência.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ef.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition text-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      tx.type === 'deposit'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {tx.type === 'deposit' ? (
                      <ArrowUpCircle className="w-5 h-5" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.reason}</p>
                    <span className="text-xs text-slate-400">
                      {new Date(tx.date).toLocaleDateString('pt-AO')} • Mês: {tx.month}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black text-base ${
                      tx.type === 'deposit' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'deposit' ? '+' : '-'}
                    {formatKwanza(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Transaction (Deposit/Withdrawal) */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={txType === 'deposit' ? 'Depósito no Fundo de Emergência' : 'Registar Levantamento'}
        subtitle="Mantenha o registo detalhado para proteger a sua reserva financeira"
      >
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTxType('deposit')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                txType === 'deposit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Depósito
            </button>
            <button
              type="button"
              onClick={() => setTxType('withdrawal')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                txType === 'withdrawal' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Levantamento
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valor em Kwanzas (Kz) *
            </label>
            <input
              type="number"
              min="500"
              step="500"
              required
              value={txAmount}
              onChange={(e) => setTxAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {formatKwanza(txAmount)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Justificação *
            </label>
            <input
              type="text"
              required
              value={txReason}
              onChange={(e) => setTxReason(e.target.value)}
              placeholder={
                txType === 'deposit'
                  ? 'Ex: Aporte mensal de poupança, sobra de salário...'
                  : 'Ex: Reparação mecânica urgente, medicamento...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTxModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-white font-semibold rounded-xl text-sm shadow-xs ${
                txType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirmar {txType === 'deposit' ? 'Depósito' : 'Levantamento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Settings */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configurar Parâmetros do Fundo de Emergência"
        subtitle="Defina o horizonte de protecção e o valor do aporte mensal"
      >
        <form onSubmit={handleConfigSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meta de Cobertura (Meses de Despesas Essenciais) *
            </label>
            <select
              value={targetMonths}
              onChange={(e) => setTargetMonths(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="3">3 Meses (Recomendado para início)</option>
              <option value="6">6 Meses (Excelente segurança financeira)</option>
              <option value="9">9 Meses</option>
              <option value="12">12 Meses (Protecção máxima)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Com as despesas essenciais actuais ({formatKwanza(essentialExpenses)}/mês), a meta será de{' '}
              {formatKwanza(essentialExpenses * targetMonths)}.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contribuição Mensal Prevista (Kz) *
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {formatKwanza(monthlyContribution)} alocado mensalmente
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mês de Início *
            </label>
            <input
              type="month"
              required
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs"
            >
              Guardar Configuração
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
