import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  ShieldCheck,
  CalendarCheck2,
  LineChart,
  History,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatKwanza } from '../../utils/formatters';

export type NavTab = 
  | 'dashboard'
  | 'incomes'
  | 'expenses'
  | 'goals'
  | 'debts'
  | 'emergency'
  | 'planning'
  | 'simulator'
  | 'reports';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentMonthBreakdown, state } = useFinance();

  const navItems: Array<{ id: NavTab; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incomes', label: 'Rendimentos', icon: Wallet, badge: state.incomes.length },
    { id: 'expenses', label: 'Despesas', icon: Receipt, badge: state.expenses.length },
    { id: 'goals', label: 'Metas Financeiras', icon: Target, badge: state.goals.length },
    { id: 'debts', label: 'Gestão de Dívidas', icon: CreditCard, badge: state.debts.length },
    { id: 'emergency', label: 'Fundo Emergência', icon: ShieldCheck },
    { id: 'planning', label: 'Planeamento Mensal', icon: CalendarCheck2 },
    { id: 'simulator', label: 'Simulador Futuro', icon: LineChart },
    { id: 'reports', label: 'Histórico & Relatórios', icon: History },
  ];

  const completedGoalsCount = state.goals.filter((g) => g.status === 'completed').length;

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 border-r border-slate-800 text-white min-h-screen shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              FocoFinance
            </h1>
            <p className="text-[11px] font-medium text-slate-400">Planeamento em Kwanzas (Kz)</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Financial Snapshot in Sidebar */}
      <div className="p-4 mx-3 mb-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Saldo Previsto</span>
          <span className="text-[10px] text-blue-400 font-semibold">{state.selectedMonth}</span>
        </div>
        <div
          className={`text-base font-extrabold tracking-tight ${
            currentMonthBreakdown.finalBalance < 0 ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {formatKwanza(currentMonthBreakdown.finalBalance)}
        </div>
        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Metas Concluídas</span>
          <span className="font-bold text-white">
            {completedGoalsCount} de {state.goals.length}
          </span>
        </div>
      </div>
    </aside>
  );
};
