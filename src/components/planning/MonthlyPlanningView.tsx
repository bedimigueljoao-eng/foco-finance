import React, { useState } from 'react';
import {
  CalendarCheck2,
  TrendingUp,
  Receipt,
  PiggyBank,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ExecutionStatus } from '../../types/finance';
import {
  formatKwanza,
  formatMonthShort,
  formatMonthYear,
  generateMonthList,
  EXECUTION_STATUS_LABELS,
} from '../../utils/formatters';
import { UnspentFundsModal } from '../common/UnspentFundsModal';
import { PartialPaymentModal } from '../common/PartialPaymentModal';

export const MonthlyPlanningView: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    currentMonthBreakdown,
    setExpenseExecution,
    setGoalExecution,
    setDebtExecution,
  } = useFinance();

  const [isUnspentModalOpen, setIsUnspentModalOpen] = useState(false);
  const [partialItem, setPartialItem] = useState<{
    id: string;
    type: 'expense' | 'debt' | 'goal';
    name: string;
    plannedAmount: number;
    currentRealized?: number;
  } | null>(null);

  const next12Months = generateMonthList('2026-11', 12);
  const mb = currentMonthBreakdown;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Month Selector Ribbon */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Planeamento Mensal Detalhado</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Extrato orçamental projectado com todas as entradas (+), despesas (-) e alocações de capital
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Mês em Análise</span>
            <span className="text-xl font-black text-slate-900">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>
        </div>

        {/* Quick Month Switcher Pill Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {next12Months.map((m) => {
            const isSelected = selectedMonth === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {formatMonthShort(m)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rendimento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Rendimento Previsto</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">
            {formatKwanza(mb.totalIncome)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {mb.incomes.length} entrada(s) activa(s)
          </span>
        </div>

        {/* Despesas Realizadas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Despesas Realizadas</span>
            <Receipt className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {formatKwanza(mb.totalRealizedExpenses)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Previsto: {formatKwanza(mb.totalPlannedExpenses)}
          </span>
        </div>

        {/* Capital Poupado Realizado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Capital Poupado (Real)</span>
            <PiggyBank className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-800">
            {formatKwanza(mb.totalRealizedGoalsContribution + mb.emergencyFundContribution)}
          </p>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">
            Metas ({formatKwanza(mb.totalRealizedGoalsContribution)}) + Fundo ({formatKwanza(mb.emergencyFundContribution)})
          </span>
        </div>

        {/* Saldo Não Utilizado & Botão */}
        <div
          onClick={() => setIsUnspentModalOpen(true)}
          className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-300 transition"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold">Saldo Não Utilizado</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700">
            {formatKwanza(mb.netMonthUnspentAvailable)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block underline">
            Ver origem e alocar &rarr;
          </span>
        </div>
      </div>

      {/* Metas Iniciadas e Concluídas Neste Mês */}
      {(mb.goalsStarted.length > 0 || mb.goalsCompleted.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mb.goalsStarted.length > 0 && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Metas que Iniciam em {formatMonthShort(selectedMonth)}
                </h4>
                <div className="mt-1 space-y-1">
                  {mb.goalsStarted.map((g) => (
                    <p key={g.id} className="text-sm font-semibold text-slate-900">
                      • {g.name} (Aporte previsto: {formatKwanza(g.monthlyContribution)}/mês)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mb.goalsCompleted.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Objectivos Concluídos em {formatMonthShort(selectedMonth)}!
                </h4>
                <div className="mt-1 space-y-1">
                  {mb.goalsCompleted.map((g) => (
                    <p key={g.id} className="text-sm font-semibold text-emerald-800">
                      🎉 {g.name} (Meta de {formatKwanza(g.targetAmount)} concluída com êxito!)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extrato Detalhado do Mês */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {formatMonthYear(selectedMonth)} — Extrato de Execução
            </h3>
            <p className="text-xs text-slate-500">
              Altere o estado de execução directamente para actualizar os valores efectivamente gastos
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200/80 text-slate-700">
            Saldo Inicial Transportado: {formatKwanza(mb.initialBalance)}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {/* 1. Rendimentos */}
          {mb.incomes.map((inc) => (
            <div
              key={inc.item.id}
              className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/60 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div>
                  <span className="font-bold text-slate-900">{inc.item.name}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({inc.item.frequency === 'monthly' ? 'Recorrente mensal' : 'Pontual'})
                  </span>
                </div>
              </div>
              <span className="font-black text-emerald-600">
                +{formatKwanza(inc.amount)}
              </span>
            </div>
          ))}

          {/* 2. Despesas */}
          {mb.expenses.map(({ item: exp, plannedAmount, realizedAmount, status, unspentAmount }) => (
            <div
              key={exp.id}
              className={`px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm transition ${
                status === 'nao_realizada'
                  ? 'bg-rose-50/20'
                  : status === 'parcial'
                  ? 'bg-amber-50/20'
                  : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <div>
                  <span className="font-semibold text-slate-800">{exp.name}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({exp.recurrence === 'fixa' ? 'Fixa' : 'Variável'})
                  </span>
                  {unspentAmount > 0 && (
                    <span className="text-xs font-bold text-emerald-600 ml-2">
                      (+{formatKwanza(unspentAmount)} não gasto)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end">
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as ExecutionStatus;
                    if (newStatus === 'parcial') {
                      setPartialItem({
                        id: exp.id,
                        type: 'expense',
                        name: exp.name,
                        plannedAmount,
                        currentRealized: realizedAmount,
                      });
                      return;
                    }
                    setExpenseExecution(exp.id, selectedMonth, newStatus);
                  }}
                  className="px-2 py-1 rounded-lg border text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="prevista">Prevista</option>
                  <option value="realizada">Realizada</option>
                  <option value="parcial">Realizada parcialmente</option>
                  <option value="nao_realizada">Não realizada</option>
                </select>

                <div className="text-right min-w-[100px]">
                  <span className="font-bold text-slate-900 block">
                    -{formatKwanza(realizedAmount)}
                  </span>
                  {status !== 'realizada' && (
                    <span className="text-[10px] text-slate-400">
                      previsto: {formatKwanza(plannedAmount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 3. Pagamento de Dívidas */}
          {mb.debtsPayments.map(({ debt, plannedPayment, realizedPayment, status, unspentAmount }) => (
            <div
              key={debt.id}
              className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm bg-red-50/20 hover:bg-red-50/40 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div>
                  <span className="font-bold text-red-950">Amortização Dívida: {debt.name}</span>
                  <span className="text-xs text-red-700 ml-2">(Credor: {debt.creditor})</span>
                  {unspentAmount > 0 && (
                    <span className="text-xs font-bold text-emerald-600 ml-2">
                      (+{formatKwanza(unspentAmount)} não utilizado)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end">
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as ExecutionStatus;
                    if (newStatus === 'parcial') {
                      setPartialItem({
                        id: debt.id,
                        type: 'debt',
                        name: `Dívida: ${debt.name}`,
                        plannedAmount: plannedPayment,
                        currentRealized: realizedPayment,
                      });
                      return;
                    }
                    setDebtExecution(debt.id, selectedMonth, newStatus);
                  }}
                  className="px-2 py-1 rounded-lg border text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="prevista">Prevista</option>
                  <option value="realizada">Realizada</option>
                  <option value="parcial">Realizada parcialmente</option>
                  <option value="nao_realizada">Não realizada</option>
                </select>

                <div className="text-right min-w-[100px]">
                  <span className="font-bold text-red-700 block">
                    -{formatKwanza(realizedPayment)}
                  </span>
                  {status !== 'realizada' && (
                    <span className="text-[10px] text-slate-400">
                      previsto: {formatKwanza(plannedPayment)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 4. Metas Financeiras (Poupança) */}
          {mb.goalsContributions.map(({ goal, plannedContribution, realizedContribution, status, unspentAmount, accumulatedAfter }) => (
            <div
              key={goal.id}
              className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm bg-purple-50/20 hover:bg-purple-50/40 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <div>
                  <span className="font-bold text-purple-900">
                    Alocação Meta: {goal.name}
                  </span>
                  <span className="text-xs text-purple-600 ml-2">
                    (Acumulado após aporte: {formatKwanza(accumulatedAfter)} de {formatKwanza(goal.targetAmount)})
                  </span>
                  {unspentAmount > 0 && (
                    <span className="text-xs font-bold text-emerald-600 ml-2">
                      (+{formatKwanza(unspentAmount)} libertados)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end">
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as ExecutionStatus;
                    if (newStatus === 'parcial') {
                      setPartialItem({
                        id: goal.id,
                        type: 'goal',
                        name: `Meta: ${goal.name}`,
                        plannedAmount: plannedContribution,
                        currentRealized: realizedContribution,
                      });
                      return;
                    }
                    setGoalExecution(goal.id, selectedMonth, newStatus);
                  }}
                  className="px-2 py-1 rounded-lg border text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="prevista">Prevista</option>
                  <option value="realizada">Realizada</option>
                  <option value="parcial">Realizada parcialmente</option>
                  <option value="nao_realizada">Não realizada</option>
                </select>

                <div className="text-right min-w-[100px]">
                  <span className="font-bold text-purple-800 block">
                    -{formatKwanza(realizedContribution)}
                  </span>
                  {status !== 'realizada' && (
                    <span className="text-[10px] text-slate-400">
                      previsto: {formatKwanza(plannedContribution)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 5. Fundo de Emergência */}
          {mb.emergencyFundContribution > 0 && (
            <div className="px-6 py-3.5 flex items-center justify-between text-sm bg-teal-50/30 hover:bg-teal-50/60 transition">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <div>
                  <span className="font-bold text-teal-900">Fundo de Emergência</span>
                  <span className="text-xs text-teal-600 ml-2">
                    (Saldo reserva: {formatKwanza(mb.emergencyFundBalanceAfter)})
                  </span>
                </div>
              </div>
              <span className="font-bold text-teal-800">
                -{formatKwanza(mb.emergencyFundContribution)}
              </span>
            </div>
          )}

          {/* Totais Finais da Linha de Saldo */}
          <div className="px-6 py-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base">
            <div>
              <span className="font-bold block text-sm sm:text-base">Saldo Final Acumulado</span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Saldo Inicial ({formatKwanza(mb.initialBalance)}) + Rendimentos ({formatKwanza(mb.totalIncome)}) - Saídas Realizadas ({formatKwanza(mb.totalRealizedOutflows)})
              </span>
            </div>
            <span
              className={`text-2xl font-black ${
                mb.finalBalance < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {formatKwanza(mb.finalBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Unspent Funds Modal */}
      <UnspentFundsModal
        isOpen={isUnspentModalOpen}
        onClose={() => setIsUnspentModalOpen(false)}
      />

      {/* Partial Payment Modal */}
      {partialItem && (
        <PartialPaymentModal
          isOpen={!!partialItem}
          onClose={() => setPartialItem(null)}
          itemName={partialItem.name}
          itemTypeLabel={
            partialItem.type === 'expense'
              ? 'Despesa'
              : partialItem.type === 'debt'
              ? 'Dívida'
              : 'Meta Financeira'
          }
          plannedAmount={partialItem.plannedAmount}
          initialRealizedAmount={partialItem.currentRealized}
          onConfirm={(realizedAmount) => {
            if (partialItem.type === 'expense') {
              setExpenseExecution(partialItem.id, selectedMonth, 'parcial', realizedAmount);
            } else if (partialItem.type === 'debt') {
              setDebtExecution(partialItem.id, selectedMonth, 'parcial', realizedAmount);
            } else if (partialItem.type === 'goal') {
              setGoalExecution(partialItem.id, selectedMonth, 'parcial', realizedAmount);
            }
            setPartialItem(null);
          }}
        />
      )}
    </div>
  );
};
