import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  MoreHorizontal,
  X,
  ShieldCheck,
  CalendarCheck2,
  LineChart,
  History,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useFinance } from '../../context/FinanceContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenDrawer: boolean;
  onCloseDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  isOpenDrawer,
  onCloseDrawer,
}) => {
  const { state } = useFinance();

  const primaryTabs: Array<{ id: NavTab; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'incomes', label: 'Rendas', icon: Wallet },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'goals', label: 'Metas', icon: Target },
  ];

  const allTabs: Array<{ id: NavTab; label: string; icon: React.ElementType; desc: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Visão geral financeira' },
    { id: 'incomes', label: 'Rendimentos', icon: Wallet, desc: 'Salários e fontes de receita' },
    { id: 'expenses', label: 'Despesas', icon: Receipt, desc: 'Fixas e variáveis' },
    { id: 'goals', label: 'Metas Financeiras', icon: Target, desc: 'Poupanças e objectivos' },
    { id: 'debts', label: 'Gestão de Dívidas', icon: CreditCard, desc: 'Amortização e controlo de dívidas' },
    { id: 'emergency', label: 'Fundo de Emergência', icon: ShieldCheck, desc: 'Reserva para imprevistos' },
    { id: 'planning', label: 'Planeamento Mensal', icon: CalendarCheck2, desc: 'Orçamento detalhado por mês' },
    { id: 'simulator', label: 'Simulador Financeiro', icon: LineChart, desc: 'Projecção a médio e longo prazo' },
    { id: 'reports', label: 'Histórico & Relatórios', icon: History, desc: 'Evolução e exportação de dados' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {primaryTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Menu button */}
        <button
          onClick={onCloseDrawer}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            !primaryTabs.some((t) => t.id === currentTab)
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Mais</span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpenDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseDrawer}
          />
          <div className="relative w-5/6 max-w-xs bg-slate-900 text-white flex flex-col h-full shadow-2xl p-5 overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">FocoFinance</h2>
                  <p className="text-[10px] text-slate-400">Menu de Navegação</p>
                </div>
              </div>
              <button
                onClick={onCloseDrawer}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 mb-2">
              <PWAInstallButton className="w-full justify-center" />
            </div>

            <div className="space-y-1 mt-2">
              {allTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      onCloseDrawer();
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-semibold leading-tight">{tab.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
