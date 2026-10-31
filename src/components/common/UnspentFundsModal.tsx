import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Target,
  ShieldCheck,
  CreditCard,
  Wallet,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatKwanza } from '../../utils/formatters';
import { Modal } from './Modal';

interface UnspentFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnspentFundsModal: React.FC<UnspentFundsModalProps> = ({ isOpen, onClose }) => {
  const { currentMonthBreakdown, state, allocateUnspentFunds } = useFinance();

  const [allocationAmount, setAllocationAmount] = useState<number>(
    currentMonthBreakdown.netMonthUnspentAvailable
  );
  const [targetType, setTargetType] = useState<
    'goal' | 'emergency' | 'debt' | 'future_expense' | 'available_buffer'
  >('goal');
  const [targetId, setTargetId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const availableToAllocate = currentMonthBreakdown.netMonthUnspentAvailable;

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (allocationAmount <= 0 || allocationAmount > availableToAllocate) return;

    let targetName = 'Saldo Disponível';
    if (targetType === 'goal') {
      const g = state.goals.find((goal) => goal.id === targetId);
      targetName = g ? `Meta: ${g.name}` : 'Meta Financeira';
    } else if (targetType === 'emergency') {
      targetName = 'Fundo de Emergência';
    } else if (targetType === 'debt') {
      const d = state.debts.find((debt) => debt.id === targetId);
      targetName = d ? `Dívida: ${d.name}` : 'Pagamento de Dívida';
    } else if (targetType === 'future_expense') {
      targetName = 'Reserva para Despesa Futura';
    }

    allocateUnspentFunds({
      fromMonth: currentMonthBreakdown.month,
      amount: allocationAmount,
      targetType,
      targetId: targetId || undefined,
      targetName,
      notes: notes.trim() || undefined,
    });

    setSuccessMsg(`Alocação de ${formatKwanza(allocationAmount)} para ${targetName} realizada com sucesso!`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saldo de Despesas Não Realizadas"
      subtitle={`Dinheiro que estava orçamentado em ${currentMonthBreakdown.month} mas não foi gasto`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Balance Card */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              Saldo Não Utilizado Disponível
            </span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {formatKwanza(availableToAllocate)}
            </p>
            <span className="text-[11px] text-emerald-600">
              Gerado: {formatKwanza(currentMonthBreakdown.totalMonthUnspentGenerated)} | Alocado:{' '}
              {formatKwanza(currentMonthBreakdown.totalAllocationsFromUnspent)}
            </span>
          </div>
          <Sparkles className="w-8 h-8 text-emerald-600 opacity-80" />
        </div>

        {/* Breakdown of Origin */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Origem dos Valores Não Gastos
          </h4>
          {currentMonthBreakdown.unspentOrigins.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
              Nenhuma despesa ou meta foi marcada como «Não realizada» ou «Realizada parcialmente» neste mês.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {currentMonthBreakdown.unspentOrigins.map((origin) => (
                <div key={origin.id} className="p-3 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-bold text-slate-800">{origin.name}</span>
                    <span className="text-slate-400 ml-2">
                      (Previsto: {formatKwanza(origin.plannedAmount)} | Gasto:{' '}
                      {formatKwanza(origin.realizedAmount)})
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-600">
                    +{formatKwanza(origin.unspentAmount)} libertados
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Allocation Form */}
        {availableToAllocate > 0 ? (
          <form onSubmit={handleAllocate} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Destinar / Alocar este Dinheiro
            </h4>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor a Alocar (Kz) *
                </label>
                <input
                  type="number"
                  min="500"
                  max={availableToAllocate}
                  step="500"
                  required
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Finalidade da Alocação *
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="goal">Meta Financeira (Aporte extra)</option>
                  <option value="emergency">Fundo de Emergência</option>
                  <option value="debt">Amortização de Dívida</option>
                  <option value="future_expense">Despesa Futura</option>
                  <option value="available_buffer">Manter como Saldo Disponível</option>
                </select>
              </div>
            </div>

            {targetType === 'goal' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Meta *
                </label>
                <select
                  required
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Escolha a meta...</option>
                  {state.goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Acumulado: {formatKwanza(g.currentAmount)} de {formatKwanza(g.targetAmount)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'debt' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Dívida a Amortizar *
                </label>
                <select
                  required
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Escolha a dívida...</option>
                  {state.debts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — Credor: {d.creditor} (Saldo Restante: {formatKwanza(d.remainingAmount)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nota ou Justificação (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Poupança por corte no lazer, sobra de táxi..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-xs transition"
              >
                Confirmar Alocação do Saldo
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-500">
            Quando marcar despesas como «Não realizada» ou «Realizada parcialmente», o dinheiro poupado ficará disponível aqui para ser transferido.
          </p>
        )}
      </div>
    </Modal>
  );
};
