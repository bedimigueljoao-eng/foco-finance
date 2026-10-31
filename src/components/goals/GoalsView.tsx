import React, { useState } from 'react';
import {
  Plus,
  Target,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { FinancialGoal, GoalCategory, GoalStatus, Priority } from '../../types/finance';
import {
  formatKwanza,
  formatMonthShort,
  formatMonthYear,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
  PRIORITY_LABELS,
} from '../../utils/formatters';
import { calculateGoalProjection } from '../../utils/calculations';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PartialPaymentModal } from '../common/PartialPaymentModal';

export const GoalsView: React.FC = () => {
  const {
    state,
    selectedMonth,
    addGoal,
    updateGoal,
    deleteGoal,
    adjustGoalAccumulated,
    setGoalExecution,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<FinancialGoal | null>(null);
  const [depositModalGoal, setDepositModalGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(10000);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [partialModalGoal, setPartialModalGoal] = useState<FinancialGoal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('documents');
  const [targetAmount, setTargetAmount] = useState<number>(35000);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [priority, setPriority] = useState<Priority>('high');
  const [desiredCompletionDate, setDesiredCompletionDate] = useState('');
  const [startMonth, setStartMonth] = useState(selectedMonth);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);
  const [status, setStatus] = useState<GoalStatus>('in_progress');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setDescription('');
    setCategory('documents');
    setTargetAmount(35000);
    setCurrentAmount(0);
    setPriority('high');
    setDesiredCompletionDate('');
    setStartMonth(selectedMonth);
    setMonthlyContribution(10000);
    setStatus('in_progress');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setDescription(goal.description || '');
    setCategory(goal.category);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    setPriority(goal.priority);
    setDesiredCompletionDate(goal.desiredCompletionDate || '');
    setStartMonth(goal.startMonth);
    setMonthlyContribution(goal.monthlyContribution);
    setStatus(goal.status);
    setNotes(goal.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0) return;

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      targetAmount,
      currentAmount,
      priority,
      desiredCompletionDate: desiredCompletionDate.trim() || undefined,
      startMonth,
      monthlyContribution,
      frequency: 'monthly' as const,
      status: currentAmount >= targetAmount ? ('completed' as const) : status,
      notes: notes.trim() || undefined,
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
    } else {
      addGoal(payload);
    }

    setIsModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal || depositAmount <= 0) return;
    adjustGoalAccumulated(depositModalGoal.id, depositAmount);
    setDepositModalGoal(null);
  };

  const totalTargetAllGoals = state.goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalAccumulatedAllGoals = state.goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallGoalsProgress =
    totalTargetAllGoals > 0 ? Math.round((totalAccumulatedAllGoals / totalTargetAllGoals) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Metas Financeiras</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Planeie passaporte, escola de condução, casa própria, cursos e projectos de vida
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right sm:border-r border-slate-200 sm:pr-4">
            <span className="text-[11px] text-slate-500 block">Total Acumulado</span>
            <span className="text-lg font-extrabold text-purple-900">
              {formatKwanza(totalAccumulatedAllGoals)}
              <span className="text-xs text-slate-400 font-normal"> / {formatKwanza(totalTargetAllGoals)}</span>
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Overview Progress bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span className="font-semibold">Progresso Global de Todos os Objectivos</span>
          <span className="font-extrabold text-purple-700">{overallGoalsProgress}% Concluído</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${overallGoalsProgress}%` }}
          />
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.goals.map((goal) => {
          const projection = calculateGoalProjection(goal);
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const isCompleted = goal.currentAmount >= goal.targetAmount || goal.status === 'completed';
          const isFuture = goal.startMonth > selectedMonth;
          const statusConfig = GOAL_STATUS_LABELS[goal.status];
          const priorityConfig = PRIORITY_LABELS[goal.priority];

          return (
            <div
              key={goal.id}
              className={`rounded-3xl border bg-white p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/15'
                  : isFuture
                  ? 'border-slate-200 opacity-90'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      {GOAL_CATEGORY_LABELS[goal.category]}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                      {goal.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.color}`}
                  >
                    {isCompleted ? 'Concluída' : statusConfig.label}
                  </span>
                </div>

                {goal.description && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{goal.description}</p>
                )}

                {/* Progress Visual */}
                <div className="space-y-1.5 my-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">Valor Acumulado</span>
                    <span className="font-extrabold text-slate-900">
                      {formatKwanza(goal.currentAmount)}
                      <span className="text-slate-400 font-normal">
                        {' '}
                        / {formatKwanza(goal.targetAmount)}
                      </span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : pct > 50
                          ? 'bg-purple-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                    <span>{pct}% concluído</span>
                    <span>Falta: {formatKwanza(projection.remainingAmount)}</span>
                  </div>
                </div>

                {/* Key Financing Projection Metrics */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Início da Poupança:</span>
                    <span className="font-semibold text-slate-800">
                      {formatMonthShort(goal.startMonth)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Aporte Mensal:</span>
                    <span className="font-bold text-purple-700">
                      {formatKwanza(goal.monthlyContribution)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                    <span className="text-slate-600 font-medium">Previsão de Conclusão:</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        isCompleted
                          ? 'text-emerald-600'
                          : projection.isDelayed
                          ? 'text-amber-600'
                          : 'text-blue-700'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Alcançada!
                        </>
                      ) : (
                        formatMonthYear(projection.projectedEndMonth)
                      )}
                    </span>
                  </div>

                  {projection.isDelayed && !isCompleted && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-md flex items-center gap-1 mt-1 border border-amber-200">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Prazo pretendido ultrapassado com o aporte actual</span>
                    </div>
                  )}
                  {/* Execution status for current selected month */}
                  {goal.startMonth <= selectedMonth && !isCompleted && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Aporte em {selectedMonth}:</span>
                      <select
                        value={goal.monthExecutions?.[selectedMonth]?.status || 'prevista'}
                        onChange={(e) => {
                          const newStatus = e.target.value as any;
                          if (newStatus === 'parcial') {
                            setPartialModalGoal(goal);
                            return;
                          }
                          setGoalExecution(goal.id, selectedMonth, newStatus);
                        }}
                        className="px-2 py-0.5 rounded-md border text-[11px] font-semibold bg-white cursor-pointer"
                      >
                        <option value="prevista">Prevista</option>
                        <option value="realizada">Realizada (Integral)</option>
                        <option value="parcial">Realizada parcialmente</option>
                        <option value="nao_realizada">Não realizada</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedGoalDetail(goal)}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Ver Detalhes</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setDepositModalGoal(goal);
                      setDepositAmount(goal.monthlyContribution || 10000);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                    title="Registar aporte directo nesta meta"
                  >
                    + Aporte
                  </button>

                  <button
                    onClick={() => openEditModal(goal)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Editar meta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setGoalToDelete(goal)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Eliminar meta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Goal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Editar Meta Financeira' : 'Criar Nova Meta Financeira'}
        subtitle="Defina o valor alvo, quando pretende começar a poupar e o aporte mensal"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Meta *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Passaporte, Escola de condução, Sair de casa, Livros..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição / Propósito
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Emissão e taxas oficiais do passaporte angolano..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Total Necessário (Kz) *
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatKwanza(targetAmount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Já Acumulado (Kz)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatKwanza(currentAmount)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mês de Início da Poupança *
              </label>
              <input
                type="month"
                required
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Antes deste mês o valor destinado será 0 Kz
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aporte Mensal Destinado (Kz) *
              </label>
              <input
                type="number"
                min="500"
                step="500"
                required
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-purple-700"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatKwanza(monthlyContribution)} por mês
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {Object.entries(GOAL_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="essential">Essencial</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Desejada (Opcional)
              </label>
              <input
                type="month"
                value={desiredCompletionDate}
                onChange={(e) => setDesiredCompletionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
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
              placeholder="Notas adicionais sobre a meta..."
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
              {editingGoal ? 'Guardar Alterações' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detailed Goal View with Financing Timeline */}
      {selectedGoalDetail && (
        <Modal
          isOpen={!!selectedGoalDetail}
          onClose={() => setSelectedGoalDetail(null)}
          title={`Detalhes da Meta: ${selectedGoalDetail.name}`}
          subtitle="Plano de financiamento e cronograma de conclusão"
        >
          {(() => {
            const proj = calculateGoalProjection(selectedGoalDetail);
            const pct = Math.min(
              100,
              Math.round((selectedGoalDetail.currentAmount / selectedGoalDetail.targetAmount) * 100)
            );

            return (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Estado de Conclusão
                    </span>
                    <span className="text-sm font-extrabold text-purple-800">{pct}%</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-700 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-purple-900 mt-2 font-medium">
                    <span>Acumulado: {formatKwanza(selectedGoalDetail.currentAmount)}</span>
                    <span>Total Necessário: {formatKwanza(selectedGoalDetail.targetAmount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block">Mês de Arranque</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatMonthYear(selectedGoalDetail.startMonth)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block">Aporte Mensal</span>
                    <span className="text-sm font-bold text-purple-700">
                      {formatKwanza(selectedGoalDetail.monthlyContribution)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block">Meses Restantes</span>
                    <span className="text-sm font-bold text-slate-900">
                      {proj.monthsNeeded} meses
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block">Previsão Conclusão</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatMonthYear(proj.projectedEndMonth)}
                    </span>
                  </div>
                </div>

                {selectedGoalDetail.description && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <strong className="block text-slate-700 mb-1">Descrição:</strong>
                    {selectedGoalDetail.description}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setSelectedGoalDetail(null)}
                    className="px-5 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Modal Direct Deposit */}
      {depositModalGoal && (
        <Modal
          isOpen={!!depositModalGoal}
          onClose={() => setDepositModalGoal(null)}
          title={`Registar Aporte: ${depositModalGoal.name}`}
          subtitle="Adicione um valor poupado directamente para esta meta"
        >
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor do Aporte em Kwanzas (Kz) *
              </label>
              <input
                type="number"
                min="500"
                step="500"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Visualização: {formatKwanza(depositAmount)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDepositModalGoal(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-xs"
              >
                Confirmar Aporte
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Confirmação de Eliminação de Meta */}
      {goalToDelete && (
        <ConfirmDialog
          isOpen={!!goalToDelete}
          onClose={() => setGoalToDelete(null)}
          onConfirm={() => {
            if (goalToDelete) {
              deleteGoal(goalToDelete.id);
              setGoalToDelete(null);
            }
          }}
          title="Eliminar Meta Financeira"
          message={
            goalToDelete.currentAmount > 0
              ? `Tem a certeza que deseja eliminar a meta "${goalToDelete.name}"? Esta meta possui ${formatKwanza(goalToDelete.currentAmount)} acumulados que serão libertados para o seu saldo.`
              : `Tem a certeza que deseja eliminar a meta financeira "${goalToDelete.name}"? O planeamento mensal será actualizado automaticamente.`
          }
          confirmText="Eliminar Meta"
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}

      {/* Modal Pagamento Parcial de Meta */}
      {partialModalGoal && (
        <PartialPaymentModal
          isOpen={!!partialModalGoal}
          onClose={() => setPartialModalGoal(null)}
          itemName={`Aporte: ${partialModalGoal.name}`}
          itemTypeLabel="Meta Financeira"
          plannedAmount={partialModalGoal.monthlyContribution}
          initialRealizedAmount={
            partialModalGoal.monthExecutions?.[selectedMonth]?.status === 'parcial'
              ? partialModalGoal.monthExecutions?.[selectedMonth]?.realizedAmount
              : undefined
          }
          onConfirm={(realizedAmount) => {
            setGoalExecution(partialModalGoal.id, selectedMonth, 'parcial', realizedAmount);
            setPartialModalGoal(null);
          }}
        />
      )}
    </div>
  );
};
