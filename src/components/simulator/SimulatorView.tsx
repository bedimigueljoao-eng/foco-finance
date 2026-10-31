import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  Sliders,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import {
  formatKwanza,
  formatMonthShort,
  formatMonthYear,
} from '../../utils/formatters';
import { exportSimulationToCSV } from '../../services/storage';

export const SimulatorView: React.FC = () => {
  const { state, selectedMonth, getSimulation } = useFinance();

  const [horizonMonths, setHorizonMonths] = useState<number>(12);
  const [extraIncomeBonus, setExtraIncomeBonus] = useState<number>(0);
  const [expenseReductionPercent, setExpenseReductionPercent] = useState<number>(0);
  const [extraMonthlySavings, setExtraMonthlySavings] = useState<number>(0);

  // Generate baseline simulation
  const baselineSimulation = getSimulation(horizonMonths, selectedMonth);

  // Apply scenario adjustments if sliders are moved
  const simulation = baselineSimulation.map((monthData) => {
    const baseExpenses =
      monthData.totalRealizedExpenses > 0
        ? monthData.totalRealizedExpenses
        : monthData.totalPlannedExpenses;
    const baseGoals =
      monthData.totalRealizedGoalsContribution > 0
        ? monthData.totalRealizedGoalsContribution
        : monthData.totalPlannedGoalsContribution;
    const baseDebts =
      monthData.totalRealizedDebtPayments > 0
        ? monthData.totalRealizedDebtPayments
        : monthData.totalPlannedDebtPayments;

    const adjustedIncome = monthData.totalIncome + extraIncomeBonus;
    const adjustedExpenses = baseExpenses * (1 - expenseReductionPercent / 100);
    const adjustedGoals = baseGoals + extraMonthlySavings;
    const netFlow =
      adjustedIncome - adjustedExpenses - adjustedGoals - baseDebts - monthData.emergencyFundContribution;

    return {
      ...monthData,
      totalIncome: adjustedIncome,
      totalExpenses: adjustedExpenses,
      totalPlannedExpenses: adjustedExpenses,
      totalRealizedExpenses: adjustedExpenses,
      totalGoalsContribution: adjustedGoals,
      totalPlannedGoalsContribution: adjustedGoals,
      totalRealizedGoalsContribution: adjustedGoals,
      netCashFlow: netFlow,
    };
  });

  // Re-chain balances for scenario
  let runningBal = state.initialBaselineBalance;
  const simulatedMonths = simulation.map((m) => {
    const finalBal = runningBal + m.netCashFlow;
    const item = {
      ...m,
      initialBalance: runningBal,
      finalBalance: finalBal,
      isDeficit: finalBal < 0,
    };
    runningBal = finalBal;
    return item;
  });

  // Chart data
  const chartData = simulatedMonths.map((m) => ({
    name: formatMonthShort(m.month),
    monthKey: m.month,
    saldoAcumulado: m.finalBalance,
    rendimentos: m.totalIncome,
    despesas: m.totalExpenses,
    poupanca: m.totalGoalsContribution + m.emergencyFundContribution,
    fundoEmergencia: m.emergencyFundBalanceAfter,
  }));

  const finalAccumulatedBalance = simulatedMonths[simulatedMonths.length - 1]?.finalBalance ?? 0;
  const totalSavedAcrossPeriod = simulatedMonths.reduce(
    (acc, m) => acc + m.totalGoalsContribution + m.emergencyFundContribution,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Simulador Financeiro de Futuro</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Projecte o seu património, metas e saldos a 3, 6, 12, 24 ou 36 meses
          </p>
        </div>

        {/* Horizon Picker */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          {[3, 6, 12, 24, 36].map((h) => (
            <button
              key={h}
              onClick={() => setHorizonMonths(h)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                horizonMonths === h
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {h} meses
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Scenario Tester Sliders */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold">Simular Cenários Alternativos («E se...?»)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Slider 1: Renda extra mensal */}
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Aumento de Rendimento Mensal:</span>
              <span className="font-extrabold text-emerald-400">
                +{formatKwanza(extraIncomeBonus)}/mês
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="10000"
              value={extraIncomeBonus}
              onChange={(e) => setExtraIncomeBonus(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Simule novo salário, promoções ou negócios extras.
            </span>
          </div>

          {/* Slider 2: Redução de Despesas */}
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Corte de Gastos Não Essenciais:</span>
              <span className="font-extrabold text-blue-400">
                {expenseReductionPercent}% de redução
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={expenseReductionPercent}
              onChange={(e) => setExpenseReductionPercent(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Simule a disciplina de cortar despesas de lazer e gastos pontuais.
            </span>
          </div>

          {/* Slider 3: Poupança Adicional */}
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Aporte Adicional em Metas:</span>
              <span className="font-extrabold text-purple-400">
                +{formatKwanza(extraMonthlySavings)}/mês
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={extraMonthlySavings}
              onChange={(e) => setExtraMonthlySavings(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Acelere a conclusão das suas metas de vida.
            </span>
          </div>
        </div>

        {(extraIncomeBonus > 0 || expenseReductionPercent > 0 || extraMonthlySavings > 0) && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-blue-300">
              Cenário personalizado activo — Os resultados abaixo estão a ser recalculados dinamicamente.
            </span>
            <button
              onClick={() => {
                setExtraIncomeBonus(0);
                setExpenseReductionPercent(0);
                setExtraMonthlySavings(0);
              }}
              className="text-xs text-white underline hover:text-blue-300"
            >
              Repor valores originais
            </button>
          </div>
        )}
      </div>

      {/* Resultados do Horizonte */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500">Saldo Final em {horizonMonths} Meses</span>
          <p
            className={`text-2xl font-black mt-1 ${
              finalAccumulatedBalance < 0 ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {formatKwanza(finalAccumulatedBalance)}
          </p>
          <span className="text-[11px] text-slate-400">Património líquido em conta</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500">Total Poupado no Período</span>
          <p className="text-2xl font-black text-purple-800 mt-1">
            {formatKwanza(totalSavedAcrossPeriod)}
          </p>
          <span className="text-[11px] text-slate-400">Metas + Reserva de emergência</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-500">Exportar Projecção</span>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              Guarde a simulação para folha de cálculo
            </p>
          </div>
          <button
            onClick={() => exportSimulationToCSV(simulatedMonths)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition mt-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Projecção CSV</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Chart: Evolução do Saldo Acumulado ao longo do tempo */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Evolução Temporal do Saldo e das Poupanças
            </h3>
            <p className="text-xs text-slate-500">
              Projecção contínua mês a mês para o horizonte de {horizonMonths} meses
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="simSaldoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="simEFGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
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
                formatter={(val: any) => [formatKwanza(Number(val)), '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                name="Saldo Final Previsto"
                dataKey="saldoAcumulado"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#simSaldoGrad)"
              />
              <Area
                type="monotone"
                name="Fundo de Emergência"
                dataKey="fundoEmergencia"
                stroke="#0284c7"
                strokeWidth={2}
                fill="url(#simEFGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Timeline Table (Section 10 Requirements: rendimento, despesas, metas que começam/terminam, saldo acumulado) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Quadro Mensal de Simulação ({horizonMonths} Meses)
          </h3>
          <span className="text-xs text-slate-500">
            De {formatMonthShort(selectedMonth)} até{' '}
            {formatMonthShort(simulatedMonths[simulatedMonths.length - 1]?.month || '')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-6">Mês</th>
                <th className="p-3.5">Rendimento</th>
                <th className="p-3.5">Despesas</th>
                <th className="p-3.5">Alocação Metas</th>
                <th className="p-3.5">Fundo Emergência</th>
                <th className="p-3.5">Saldo Acumulado</th>
                <th className="p-3.5 pr-6">Marcos das Metas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {simulatedMonths.map((m) => (
                <tr
                  key={m.month}
                  className={`hover:bg-slate-50/70 transition ${
                    m.isDeficit ? 'bg-red-50/40' : ''
                  }`}
                >
                  <td className="p-3.5 pl-6 font-bold text-slate-900 whitespace-nowrap">
                    {formatMonthYear(m.month)}
                  </td>
                  <td className="p-3.5 text-emerald-600 font-semibold whitespace-nowrap">
                    +{formatKwanza(m.totalIncome)}
                  </td>
                  <td className="p-3.5 text-slate-800 font-semibold whitespace-nowrap">
                    -{formatKwanza(m.totalExpenses)}
                  </td>
                  <td className="p-3.5 text-purple-700 font-semibold whitespace-nowrap">
                    {m.totalGoalsContribution > 0 ? `-${formatKwanza(m.totalGoalsContribution)}` : '0 Kz'}
                  </td>
                  <td className="p-3.5 text-teal-700 font-semibold whitespace-nowrap">
                    {m.emergencyFundContribution > 0 ? `-${formatKwanza(m.emergencyFundContribution)}` : '0 Kz'}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`font-black ${
                        m.finalBalance < 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatKwanza(m.finalBalance)}
                    </span>
                  </td>
                  <td className="p-3.5 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {m.goalsStarted.map((g) => (
                        <span
                          key={`st-${g.id}`}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold"
                        >
                          Inicia: {g.name}
                        </span>
                      ))}
                      {m.goalsCompleted.map((g) => (
                        <span
                          key={`cp-${g.id}`}
                          className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold"
                        >
                          Concluída: {g.name} 🎉
                        </span>
                      ))}
                      {m.goalsStarted.length === 0 && m.goalsCompleted.length === 0 && (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
