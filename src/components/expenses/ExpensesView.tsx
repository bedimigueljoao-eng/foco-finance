import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  Edit2,
  Trash2,
  Pause,
  Play,
  Filter,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Target,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Expense, ExpenseCategory, ExpenseRecurrence, ExecutionStatus, Priority } from '../../types/finance';
import {
  formatKwanza,
  formatMonthYear,
  EXPENSE_CATEGORY_LABELS,
  PRIORITY_LABELS,
  EXECUTION_STATUS_LABELS,
  EXPENSE_RECURRENCE_LABELS,
} from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { UnspentFundsModal } from '../common/UnspentFundsModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PartialPaymentModal } from '../common/PartialPaymentModal';

export const ExpensesView: React.FC = () => {
  const {
    state,
    selectedMonth,
    currentMonthBreakdown,
    addExpense,
    updateExpense,
    deleteExpense,
    togglePauseExpense,
    setExpenseExecution,
    setGoalExecution,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnspentModalOpen, setIsUnspentModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [partialPaymentItem, setPartialPaymentItem] = useState<{
    id: string;
    type: 'expense' | 'goal';
    name: string;
    plannedAmount: number;
    currentRealized?: number;
  } | null>(null);
  const [filterRecurrence, setFilterRecurrence] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('family');
  const [recurrence, setRecurrence] = useState<ExpenseRecurrence>('fixa');
  const [amount, setAmount] = useState<number>(10000);
  const [startMonth, setStartMonth] = useState(selectedMonth);
  const [endMonth, setEndMonth] = useState('');
  const [paymentDay, setPaymentDay] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<Priority>('high');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingExpense(null);
    setName('');
    setCategory('family');
    setRecurrence('fixa');
    setAmount(10000);
    setStartMonth(selectedMonth);
    setEndMonth('');
    setPaymentDay(undefined);
    setPriority('high');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setName(exp.name);
    setCategory(exp.category);
    setRecurrence(exp.recurrence || 'fixa');
    setAmount(exp.amount);
    setStartMonth(exp.startMonth);
    setEndMonth(exp.endMonth || '');
    setPaymentDay(exp.paymentDay);
    setPriority(exp.priority);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) return;

    const payload = {
      name: name.trim(),
      category,
      recurrence,
      amount,
      startMonth,
      endMonth: recurrence === 'fixa' && endMonth.trim() ? endMonth.trim() : undefined,
      paymentDay: paymentDay ? Number(paymentDay) : undefined,
      priority,
      isPaused: false,
      notes: notes.trim() || undefined,
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, payload);
    } else {
      addExpense(payload);
    }

    setIsModalOpen(false);
  };

  // Active in current month from central breakdown
  const currentMonthExpenses = currentMonthBreakdown.expenses;
  const currentMonthGoals = currentMonthBreakdown.goalsContributions;

  const totalPlannedThisMonth = currentMonthBreakdown.totalPlannedExpenses;
  const totalPlannedGoalsThisMonth = currentMonthBreakdown.totalPlannedGoalsContribution;
  const totalAllPlannedOutflows = totalPlannedThisMonth + totalPlannedGoalsThisMonth;

  const totalRealizedThisMonth = currentMonthBreakdown.totalRealizedExpenses;
  const totalRealizedGoalsThisMonth = currentMonthBreakdown.totalRealizedGoalsContribution;
  const totalAllRealizedOutflows = totalRealizedThisMonth + totalRealizedGoalsThisMonth;

  const unspentFromExpensesThisMonth = currentMonthBreakdown.unspentFromExpenses;
  const unspentFromGoalsThisMonth = currentMonthBreakdown.unspentFromGoals;
  const totalAllUnspentThisMonth = unspentFromExpensesThisMonth + unspentFromGoalsThisMonth;

  // Filter regular expenses
  const displayedExpenses = currentMonthExpenses.filter((item) => {
    if (filterRecurrence === 'goals') return false;
    if (filterRecurrence === 'fixa' && item.item.recurrence !== 'fixa') return false;
    if (filterRecurrence === 'variavel' && item.item.recurrence !== 'variavel') return false;
    if (filterCategory !== 'all' && item.item.category !== filterCategory) return false;
    return true;
  });

  // Filter goal deposits
  const shouldShowGoals =
    filterRecurrence === 'all' ||
    filterRecurrence === 'goals';

  const displayedGoals = shouldShowGoals ? currentMonthGoals : [];
  const totalItemsCount = displayedExpenses.length + displayedGoals.length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Gestão de Despesas & Saídas do Salário</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de despesas fixas, despesas variáveis e depósitos em metas que saem do salário mensal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right sm:border-r border-slate-200 sm:pr-4">
            <span className="text-[11px] text-slate-500 block">Total a Sair do Salário em {selectedMonth}</span>
            <span className="text-lg font-black text-slate-900">
              {formatKwanza(totalAllPlannedOutflows)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Despesas: {formatKwanza(totalPlannedThisMonth)} | Metas: {formatKwanza(totalPlannedGoalsThisMonth)}
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Despesa</span>
          </button>
        </div>
      </div>

      {/* Unspent Expenses Banner if any savings generated this month */}
      {totalAllUnspentThisMonth > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold">
                {formatKwanza(totalAllUnspentThisMonth)} libertados em despesas e metas não realizadas!
              </h4>
              <p className="text-xs text-emerald-100">
                O valor não gasto foi automaticamente adicionado ao seu saldo acumulado disponível.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUnspentModalOpen(true)}
            className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-xs cursor-pointer"
          >
            Gerir Saldo Não Utilizado
          </button>
        </div>
      )}

      {/* Filter Tabs & Month Summary Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 mr-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtros:</span>
          </div>

          <select
            value={filterRecurrence}
            onChange={(e) => setFilterRecurrence(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">Todas as Despesas & Saídas (Gerais + Depósitos de Metas)</option>
            <option value="expenses_only">Apenas Despesas Gerais (Fixas e Variáveis)</option>
            <option value="goals">Apenas Depósitos para Metas ({currentMonthGoals.length})</option>
            <option value="fixa">Apenas Despesas Fixas</option>
            <option value="variavel">Apenas Despesas Variáveis</option>
          </select>

          {filterRecurrence !== 'goals' && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium text-slate-700 cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500">
            Realizado: <strong className="text-slate-900">{formatKwanza(totalAllRealizedOutflows)}</strong>
          </span>
          <span className="text-slate-500">
            Economizado: <strong className="text-emerald-600">+{formatKwanza(totalAllUnspentThisMonth)}</strong>
          </span>
        </div>
      </div>

      {/* Expenses & Goals Table with Execution Statuses */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">
            Lista de Despesas & Saídas em {formatMonthYear(selectedMonth)} ({totalItemsCount})
          </h3>
          <span className="text-xs text-slate-400">
            Inclui despesas e depósitos destinados às metas financeiras
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {/* 1. Depósitos para Metas Financeiras (o utilizador solicitou que apareçam na lista das despesas) */}
          {displayedGoals.map(({ goal, plannedContribution, realizedContribution, status, unspentAmount, accumulatedAfter }) => {
            const statusConfig = EXECUTION_STATUS_LABELS[status];
            const priorityConfig = PRIORITY_LABELS[goal.priority];

            return (
              <div
                key={`goal-dep-${goal.id}`}
                className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition hover:bg-purple-50/40 ${
                  status === 'nao_realizada'
                    ? 'bg-rose-50/20'
                    : status === 'parcial'
                    ? 'bg-amber-50/20'
                    : 'bg-purple-50/15'
                }`}
              >
                {/* Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                      <Target className="w-4 h-4" />
                    </div>
                    <h4 className="text-base font-bold text-purple-950">
                      Depósito Meta: {goal.name}
                    </h4>

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-200">
                      Meta Financeira (Poupança)
                    </span>

                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Saída para Poupança
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-purple-700/80 flex-wrap">
                    <span>
                      Destino: <strong>Conta de poupança da meta</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Acumulado após depósito: <strong>{formatKwanza(accumulatedAfter)}</strong> de {formatKwanza(goal.targetAmount)}
                    </span>
                    {goal.notes && <span className="text-slate-500 italic">«{goal.notes}»</span>}
                  </div>
                </div>

                {/* Status Selector & Amounts */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4">
                  {/* Execution Status Dropdown */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Estado do Depósito
                    </label>
                    <select
                      value={status}
                      onChange={(e) => {
                        const newStatus = e.target.value as ExecutionStatus;
                        if (newStatus === 'parcial') {
                          setPartialPaymentItem({
                            id: goal.id,
                            type: 'goal',
                            name: `Aporte Meta: ${goal.name}`,
                            plannedAmount: plannedContribution,
                            currentRealized: realizedContribution,
                          });
                          return;
                        }
                        setGoalExecution(goal.id, selectedMonth, newStatus);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${statusConfig.color}`}
                    >
                      <option value="prevista">Prevista</option>
                      <option value="realizada">Realizada (Depositado)</option>
                      <option value="parcial">Realizada parcialmente</option>
                      <option value="nao_realizada">Não realizada</option>
                    </select>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="text-right min-w-[130px]">
                    <div className="text-base font-black text-purple-900">
                      {formatKwanza(realizedContribution)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Previsto: {formatKwanza(plannedContribution)}
                    </div>
                    {unspentAmount > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 block">
                        +{formatKwanza(unspentAmount)} libertados
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 2. Despesas Gerais Regulares (Fixas e Variáveis) */}
          {displayedExpenses.map(({ item: exp, plannedAmount, realizedAmount, status, unspentAmount }) => {
            const priorityConfig = PRIORITY_LABELS[exp.priority];
            const statusConfig = EXECUTION_STATUS_LABELS[status];

            return (
              <div
                key={exp.id}
                className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition hover:bg-slate-50/80 ${
                  status === 'nao_realizada'
                    ? 'bg-rose-50/20'
                    : status === 'parcial'
                    ? 'bg-amber-50/20'
                    : exp.isPaused
                    ? 'bg-slate-50/50 opacity-60'
                    : ''
                }`}
              >
                {/* Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-slate-900">{exp.name}</h4>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        exp.recurrence === 'fixa'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {exp.recurrence === 'fixa' ? 'Fixa' : 'Variável'}
                    </span>

                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {EXPENSE_CATEGORY_LABELS[exp.category]}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityConfig.color}`}
                    >
                      {priorityConfig.label}
                    </span>

                    {exp.isPaused && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Suspensa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>
                      {exp.recurrence === 'fixa' ? `Início: ${exp.startMonth}` : `Mês: ${exp.startMonth}`}
                    </span>
                    {exp.endMonth && <span>Término: {exp.endMonth}</span>}
                    {exp.paymentDay && (
                      <span className="text-blue-600 font-medium">Dia {exp.paymentDay}</span>
                    )}
                    {exp.notes && <span className="text-slate-600 italic">«{exp.notes}»</span>}
                  </div>
                </div>

                {/* Status Selector & Amounts */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4">
                  {/* Execution Status Dropdown */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Estado de Execução
                    </label>
                    <select
                      value={status}
                      onChange={(e) => {
                        const newStatus = e.target.value as ExecutionStatus;
                        if (newStatus === 'parcial') {
                          setPartialPaymentItem({
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
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${statusConfig.color}`}
                    >
                      <option value="prevista">Prevista</option>
                      <option value="realizada">Realizada (Integral)</option>
                      <option value="parcial">Realizada parcialmente</option>
                      <option value="nao_realizada">Não realizada</option>
                    </select>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="text-right min-w-[130px]">
                    <div className="text-base font-black text-slate-900">
                      {formatKwanza(realizedAmount)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Previsto: {formatKwanza(plannedAmount)}
                    </div>
                    {unspentAmount > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 block">
                        +{formatKwanza(unspentAmount)} libertados
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                    <button
                      onClick={() => togglePauseExpense(exp.id)}
                      className={`p-2 rounded-lg transition cursor-pointer ${
                        exp.isPaused
                          ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-amber-600 hover:bg-amber-50'
                      }`}
                      title={exp.isPaused ? 'Reactivar despesa' : 'Suspender temporariamente'}
                    >
                      {exp.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpenseToDelete(exp)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Add / Edit Expense with 1.1 Fixed vs Variable */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Editar Despesa' : 'Criar Nova Despesa'}
        subtitle="Escolha entre Despesa Fixa (recorrente) ou Despesa Variável (mês específico)"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Despesa *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Universidade da irmã, Comprar camisas, Táxi, Saldo..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Tipo de Despesa: Fixa vs Variável (Section 1.1) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Tipo de Recorrência da Despesa *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  recurrence === 'fixa'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="recurrence"
                  value="fixa"
                  checked={recurrence === 'fixa'}
                  onChange={() => setRecurrence('fixa')}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <span className="font-bold text-xs block">Despesa Fixa</span>
                  <span className="text-[11px] text-slate-500">
                    Recorrente. Incluída automaticamente em todos os meses seguintes a partir do mês de início.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  recurrence === 'variavel'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="recurrence"
                  value="variavel"
                  checked={recurrence === 'variavel'}
                  onChange={() => setRecurrence('variavel')}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <span className="font-bold text-xs block">Despesa Variável</span>
                  <span className="text-[11px] text-slate-500">
                    Prevista apenas para o mês indicado. Não é transportada para os meses seguintes.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Previsto em Kwanzas (Kz) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Visualização: {formatKwanza(amount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prioridade Orçamental *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="essential">Essencial (Sobrevivência & Família)</option>
                <option value="high">Alta prioridade</option>
                <option value="medium">Média prioridade</option>
                <option value="low">Baixa prioridade (Cortável)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {recurrence === 'fixa' ? 'Mês de Início *' : 'Mês Correspondente *'}
              </label>
              <input
                type="month"
                required
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {recurrence === 'fixa' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mês de Término (Opcional)
                </label>
                <input
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  placeholder="Sem fim definido"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dia de Pagamento (1-31, Opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={paymentDay || ''}
                  onChange={(e) => setPaymentDay(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ex: 5, 10, 25..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pagamento no início do mês, compra específica..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs transition"
            >
              {editingExpense ? 'Guardar Alterações' : 'Criar Despesa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unspent Funds Modal */}
      <UnspentFundsModal
        isOpen={isUnspentModalOpen}
        onClose={() => setIsUnspentModalOpen(false)}
      />

      {/* Confirm Deletion of Expense Modal */}
      {expenseToDelete && (
        <ConfirmDialog
          isOpen={!!expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={() => {
            if (expenseToDelete) {
              deleteExpense(expenseToDelete.id);
              setExpenseToDelete(null);
            }
          }}
          title="Eliminar Despesa"
          message={`Tem a certeza que deseja eliminar a despesa "${expenseToDelete.name}" (${formatKwanza(expenseToDelete.amount)})? O valor será removido do seu planeamento orçamental.`}
          confirmText="Eliminar Despesa"
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}

      {/* Partial Payment Modal for Expenses & Goal Deposits */}
      {partialPaymentItem && (
        <PartialPaymentModal
          isOpen={!!partialPaymentItem}
          onClose={() => setPartialPaymentItem(null)}
          itemName={partialPaymentItem.name}
          itemTypeLabel={partialPaymentItem.type === 'expense' ? 'Despesa' : 'Meta Financeira'}
          plannedAmount={partialPaymentItem.plannedAmount}
          initialRealizedAmount={partialPaymentItem.currentRealized}
          onConfirm={(realizedAmount) => {
            if (partialPaymentItem.type === 'expense') {
              setExpenseExecution(partialPaymentItem.id, selectedMonth, 'parcial', realizedAmount);
            } else {
              setGoalExecution(partialPaymentItem.id, selectedMonth, 'parcial', realizedAmount);
            }
            setPartialPaymentItem(null);
          }}
        />
      )}
    </div>
  );
};
