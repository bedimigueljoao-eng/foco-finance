import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  ShieldCheck,
  CreditCard,
  Wallet,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import {
  formatKwanza,
  formatMonthShort,
  formatMonthYear,
  formatPercent,
  EXPENSE_CATEGORY_LABELS,
} from '../../utils/formatters';
import { AlertBanner } from '../common/AlertBanner';
import { UnspentFundsModal } from '../common/UnspentFundsModal';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigateTab: (tab: NavTab) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  family: '#3b82f6',
  transport: '#0284c7',
  education: '#6366f1',
  food: '#10b981',
  personal: '#8b5cf6',
  communication: '#06b6d4',
  housing: '#f59e0b',
  debt: '#ef4444',
  investments: '#14b8a6',
  leisure: '#ec4899',
  health: '#f43f5e',
  other: '#64748b',
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { currentMonthBreakdown, simulatedYear, state } = useFinance();
  const [isUnspentModalOpen, setIsUnspentModalOpen] = useState(false);

  // 1. Category Breakdown data for Pie chart
  const categoryMap = new Map<string, number>();
  currentMonthBreakdown.expenses.forEach((e) => {
    const cat = e.item.category;
    const current = categoryMap.get(cat) || 0;
    categoryMap.set(cat, current + e.realizedAmount);
  });

  const categoryPieData = Array.from(categoryMap.entries()).map(([cat, amount]) => ({
    name: EXPENSE_CATEGORY_LABELS[cat as keyof typeof EXPENSE_CATEGORY_LABELS] || cat,
    categoryKey: cat,
    value: amount,
  }));

  if (currentMonthBreakdown.totalRealizedGoalsContribution > 0) {
    categoryPieData.push({
      name: 'Metas (Poupança)',
      categoryKey: 'investments',
      value: currentMonthBreakdown.totalRealizedGoalsContribution,
    });
  }
  if (currentMonthBreakdown.totalRealizedDebtPayments > 0) {
    categoryPieData.push({
      name: 'Pagamento de Dívidas',
      categoryKey: 'debt',
      value: currentMonthBreakdown.totalRealizedDebtPayments,
    });
  }
  if (currentMonthBreakdown.emergencyFundContribution > 0) {
    categoryPieData.push({
      name: 'Fundo de Emergência',
      categoryKey: 'food',
      value: currentMonthBreakdown.emergencyFundContribution,
    });
  }

  // 2. Timeline chart data (Next 12 months)
  const timelineData = simulatedYear.map((m) => ({
    name: formatMonthShort(m.month),
    monthKey: m.month,
    rendimento: m.totalIncome,
    despesasRealizadas: m.totalRealizedExpenses,
    poupanca: m.totalRealizedGoalsContribution + m.emergencyFundContribution,
    saldoAcumulado: m.finalBalance,
    fundoEmergencia: m.emergencyFundBalanceAfter,
    saldoNaoUtilizado: m.netMonthUnspentAvailable,
  }));

  // 3. Totals for summary cards
  const totalGoalsAccumulated = state.goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalDebtsRemaining = state.debts.reduce((acc, d) => acc + d.remainingAmount, 0);

  // 4. Planned vs Realized comparison
  const expensesWithRealized = currentMonthBreakdown.expenses.map((e) => ({
    name: e.item.name.length > 14 ? e.item.name.slice(0, 14) + '...' : e.item.name,
    previsto: e.plannedAmount,
    realizado: e.realizedAmount,
  }));

  return (
    <div className="space-y-6">
      {/* Alert Banner for any budget deficit or delay */}
      <AlertBanner />

      {/* Hero Financial Summary Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visão Geral • {formatMonthYear(state.selectedMonth)}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {currentMonthBreakdown.isDeficit ? 'Atenção ao Saldo Mensal' : 'Orçamento Equilibrado'}
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Rendimento de <strong>{formatKwanza(currentMonthBreakdown.totalIncome)}</strong>. Saldo inicial transportado de{' '}
              <strong>{formatKwanza(currentMonthBreakdown.initialBalance)}</strong>. Saldo final acumulado previsto de{' '}
              <strong className={currentMonthBreakdown.finalBalance < 0 ? 'text-red-400' : 'text-emerald-400'}>
                {formatKwanza(currentMonthBreakdown.finalBalance)}
              </strong>.
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-xs text-slate-300 uppercase tracking-wider font-medium">Saldo Final Acumulado</span>
            <span
              className={`text-2xl md:text-3xl font-black tracking-tight ${
                currentMonthBreakdown.finalBalance < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {formatKwanza(currentMonthBreakdown.finalBalance)}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentMonthBreakdown.finalBalance >= 0 ? 'Disponível em caixa' : 'Défice previsto'}
            </span>
          </div>
        </div>
      </div>

      {/* 8 Cards Oficiais Solicitados (Secção 7 do Documento de Actualização) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        {/* Card 1: Rendimento Mensal */}
        <div
          onClick={() => onNavigateTab('incomes')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">1. Rendimento Mensal</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 tracking-tight">
            {formatKwanza(currentMonthBreakdown.totalIncome)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Previsto em {formatMonthShort(state.selectedMonth)}
          </span>
        </div>

        {/* Card 2: Despesas Previstas */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">2. Despesas Previstas</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight">
            {formatKwanza(currentMonthBreakdown.totalPlannedOutflows)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Despesas + Metas + Dívidas orçamentadas
          </span>
        </div>

        {/* Card 3: Despesas Realizadas */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">3. Despesas Realizadas</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-indigo-900 tracking-tight">
            {formatKwanza(currentMonthBreakdown.totalRealizedExpenses)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Efectivamente gasta em consumo
          </span>
        </div>

        {/* Card 4: Saldo Não Utilizado do Mês */}
        <div
          onClick={() => setIsUnspentModalOpen(true)}
          className="bg-white p-4.5 rounded-2xl border border-emerald-200/90 shadow-xs hover:border-emerald-400 transition cursor-pointer bg-emerald-50/20"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold">4. Saldo Não Utilizado</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-700 tracking-tight">
            {formatKwanza(currentMonthBreakdown.netMonthUnspentAvailable)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center justify-between">
            <span>Poupança em despesas</span>
            <span className="underline">Alocar &rarr;</span>
          </span>
        </div>

        {/* Card 5: Saldo Acumulado Disponível */}
        <div
          onClick={() => onNavigateTab('planning')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">5. Saldo Acumulado Disponível</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-xl font-black tracking-tight ${
              currentMonthBreakdown.finalBalance < 0 ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {formatKwanza(currentMonthBreakdown.finalBalance)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Saldo anterior + sobra líquida
          </span>
        </div>

        {/* Card 6: Fundo de Emergência */}
        <div
          onClick={() => onNavigateTab('emergency')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">6. Fundo de Emergência</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-teal-800 tracking-tight">
            {formatKwanza(state.emergencyFund.currentBalance)}
          </p>
          <span className="text-[11px] text-teal-600 font-medium mt-1 block">
            Reserva acumulada
          </span>
        </div>

        {/* Card 7: Metas Financeiras */}
        <div
          onClick={() => onNavigateTab('goals')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">7. Metas Financeiras</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-800 tracking-tight">
            {formatKwanza(totalGoalsAccumulated)}
          </p>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">
            {state.goals.length} meta(s) activas
          </span>
        </div>

        {/* Card 8: Dívidas */}
        <div
          onClick={() => onNavigateTab('debts')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-red-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">8. Saldo Dívidas</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-red-600 tracking-tight">
            {formatKwanza(totalDebtsRemaining)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {state.debts.length} dívida(s) pendente(s)
          </span>
        </div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Distribuição do Rendimento por Categoria */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Distribuição do Dinheiro</h3>
              <p className="text-xs text-slate-500">Divisão do dinheiro realizado em {formatMonthYear(state.selectedMonth)}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CATEGORY_COLORS[entry.categoryKey] ||
                        `hsl(${(index * 45) % 360}, 70%, 50%)`
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatKwanza(Number(value)), 'Valor']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Evolução Mensal do Saldo Disponível */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Evolução do Saldo Acumulado</h3>
              <p className="text-xs text-slate-500">Saldo transportado mês a mês nos próximos 12 meses</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatKwanza(Number(value)), 'Saldo Acumulado']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="saldoAcumulado"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Poupança & Reserva de Emergência */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Poupanças & Fundo de Emergência</h3>
              <p className="text-xs text-slate-500">Crescimento da reserva de segurança vs alocação em metas</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorEF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMetas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatKwanza(Number(value)), '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  name="Fundo de Emergência"
                  dataKey="fundoEmergencia"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fill="url(#colorEF)"
                />
                <Area
                  type="monotone"
                  name="Aporte Mensal para Metas"
                  dataKey="poupanca"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorMetas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 4: Previsto vs Realizado */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Previsto vs Realizado de Despesas</h3>
              <p className="text-xs text-slate-500">Controlo de desvios e valores não utilizados</p>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gerir Despesas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesWithRealized.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatKwanza(Number(value)), '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar name="Previsto" dataKey="previsto" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar name="Realizado" dataKey="realizado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Unspent Funds Modal */}
      <UnspentFundsModal
        isOpen={isUnspentModalOpen}
        onClose={() => setIsUnspentModalOpen(false)}
      />
    </div>
  );
};
