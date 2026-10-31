import React from 'react';
import { Menu, TrendingUp, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { MonthSelector } from '../common/MonthSelector';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { formatKwanza } from '../../utils/formatters';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { selectedMonth, setSelectedMonth, currentMonthBreakdown } = useFinance();

  const hasDeficit = currentMonthBreakdown.isDeficit;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu button & Month Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <MonthSelector
            currentMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
          />
        </div>

        {/* Right: Quick KPIs & PWA Install */}
        <div className="flex items-center gap-3">
          {/* Quick Balance Status pill */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              hasDeficit
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {hasDeficit ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              Saldo:{' '}
              <strong className="font-bold">
                {formatKwanza(currentMonthBreakdown.finalBalance)}
              </strong>
            </span>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
