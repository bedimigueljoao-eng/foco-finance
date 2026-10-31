import React, { useRef, useState } from 'react';
import {
  History,
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle,
  CreditCard,
  Target,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatKwanza,
  formatMonthYear,
  EXPENSE_CATEGORY_LABELS,
} from '../../utils/formatters';
import { exportSimulationToCSV } from '../../services/storage';

export const ReportsView: React.FC = () => {
  const {
    state,
    simulatedYear,
    exportBackup,
    importBackup,
    resetToDefaults,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackup(content);
      if (success) {
        setImportStatus('Dados importados e restaurados com sucesso!');
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus('Erro: o ficheiro de cópia de segurança é inválido ou incompatível.');
        setTimeout(() => setImportStatus(null), 6000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Category breakdown for current month
  const categorySummary = new Map<string, { planned: number; count: number }>();
  state.expenses.forEach((e) => {
    const current = categorySummary.get(e.category) || { planned: 0, count: 0 };
    categorySummary.set(e.category, {
      planned: current.planned + e.amount,
      count: current.count + 1,
    });
  });

  const totalExpensesAll = Array.from(categorySummary.values()).reduce(
    (acc, v) => acc + v.planned,
    0
  );

  const completedGoals = state.goals.filter((g) => g.status === 'completed' || g.currentAmount >= g.targetAmount);
  const inProgressGoals = state.goals.filter((g) => g.status !== 'completed' && g.currentAmount < g.targetAmount);

  // Debts status
  const totalDebts = state.debts.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Histórico & Relatórios Financeiros</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Análise consolidada, relatórios por categoria, exportação e cópias de segurança
          </p>
        </div>

        {/* Export / Import Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportSimulationToCSV(simulatedYear)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV / Excel</span>
          </button>

          <button
            onClick={exportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Backup (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Restaurar Backup</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {importStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Relatório 1: Despesas por Categoria */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Distribuição por Categoria de Despesa</h3>
            <p className="text-xs text-slate-500">Valores mensais comprometidos por área da sua vida</p>
          </div>
          <span className="text-xs font-bold text-slate-900">
            Total: {formatKwanza(totalExpensesAll)}
          </span>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {Array.from(categorySummary.entries()).map(([catKey, data]) => {
              const label =
                EXPENSE_CATEGORY_LABELS[catKey as keyof typeof EXPENSE_CATEGORY_LABELS] || catKey;
              const pct = totalExpensesAll > 0 ? (data.planned / totalExpensesAll) * 100 : 0;
              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {label}{' '}
                      <span className="text-slate-400 font-normal">({data.count} despesa(s))</span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {formatKwanza(data.planned)}{' '}
                      <span className="text-slate-500 font-semibold">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Relatório 2: Estado Consolidado das Metas e Dívidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metas Concluídas vs Em Andamento */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Estado das Metas Financeiras</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">
                Metas Concluídas ({completedGoals.length})
              </span>
              <div className="mt-2 space-y-1">
                {completedGoals.map((g) => (
                  <p key={g.id} className="text-emerald-800">
                    ✓ <strong>{g.name}</strong> — {formatKwanza(g.targetAmount)}
                  </p>
                ))}
                {completedGoals.length === 0 && (
                  <p className="text-emerald-700 italic">Nenhuma meta concluída ainda.</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="font-bold text-blue-900 block">
                Metas em Andamento ou Planeadas ({inProgressGoals.length})
              </span>
              <div className="mt-2 space-y-1.5">
                {inProgressGoals.map((g) => (
                  <div key={g.id} className="flex justify-between items-center text-blue-900">
                    <span>• {g.name} (Início: {g.startMonth})</span>
                    <span className="font-bold">
                      {formatKwanza(g.currentAmount)} / {formatKwanza(g.targetAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gestão das Dívidas e Amortização */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold text-slate-900">Amortização de Dívidas</h3>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Valor Inicial da Dívida:</span>
              <span className="text-base font-black text-slate-900">{formatKwanza(totalDebts)}</span>
            </div>

            {state.debts.map((d) => (
              <div key={d.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{d.name}</span>
                  <span className="text-red-600">{formatKwanza(d.remainingAmount)}</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Pagamento programado: {formatKwanza(d.monthlyPayment)}/mês
                </p>
                <div className="text-[11px] text-slate-400">
                  Início: {formatMonthYear(d.startMonth)}
                </div>
              </div>
            ))}

            <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
              Os pagamentos de dívidas são abatidos directamente como despesas prioritárias essenciais no motor de cálculo.
            </p>
          </div>
        </div>
      </div>

      {/* Zona de Manutenção e Reposição de Dados */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Repor Dados Iniciais</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Restaura as configurações de fábrica sugeridas (salário 350.000 Kz, despesas familiares e metas)
          </p>
        </div>

        <button
          onClick={() => {
            if (
              confirm(
                'Tem a certeza que deseja repor todos os dados para os valores padrão de fábrica?'
              )
            ) {
              resetToDefaults();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Repor Dados Originais</span>
        </button>
      </div>
    </div>
  );
};
