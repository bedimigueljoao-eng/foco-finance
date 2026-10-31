import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { addMonths, formatMonthYear } from '../../utils/formatters';

interface MonthSelectorProps {
  currentMonth: string;
  onChangeMonth: (month: string) => void;
  className?: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonth,
  onChangeMonth,
  className = '',
}) => {
  const handlePrev = () => {
    onChangeMonth(addMonths(currentMonth, -1));
  };

  const handleNext = () => {
    onChangeMonth(addMonths(currentMonth, 1));
  };

  const handleQuickNov26 = () => {
    onChangeMonth('2026-11');
  };

  return (
    <div className={`inline-flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs ${className}`}>
      <button
        onClick={handlePrev}
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        title="Mês anterior"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 px-2.5 py-1">
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-slate-900 tracking-tight whitespace-nowrap">
          {formatMonthYear(currentMonth)}
        </span>
      </div>

      <button
        onClick={handleNext}
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        title="Próximo mês"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {currentMonth !== '2026-11' && (
        <button
          onClick={handleQuickNov26}
          className="ml-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
          title="Voltar ao início (Novembro 2026)"
        >
          Início
        </button>
      )}
    </div>
  );
};
