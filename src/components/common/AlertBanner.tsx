import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthYear } from '../../utils/formatters';

export const AlertBanner: React.FC = () => {
  const { alerts, selectedMonth } = useFinance();
  const [expanded, setExpanded] = useState(true);

  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter((a) => a.type === 'error');
  const warningAlerts = alerts.filter((a) => a.type === 'warning');

  const mainAlert = criticalAlerts[0] || warningAlerts[0] || alerts[0];
  const isCritical = criticalAlerts.length > 0;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-xs transition-all duration-200 mb-6 ${
        isCritical
          ? 'bg-red-50/90 border-red-200 text-red-900'
          : 'bg-amber-50/90 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl flex-shrink-0 ${
              isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isCritical ? (
              <AlertCircle className="w-5 h-5 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/70">
                {isCritical ? 'Atenção Crítica' : 'Aviso de Planeamento'}
              </span>
              <span className="text-xs text-slate-500">
                Mês activo: {formatMonthYear(selectedMonth)}
              </span>
            </div>
            <h4 className="text-sm font-bold mt-1 text-slate-900">{mainAlert.title}</h4>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{mainAlert.message}</p>
          </div>
        </div>

        {alerts.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-white/60 hover:bg-white text-slate-700 transition"
          >
            <span>{alerts.length} avisos</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {expanded && alerts.length > 1 && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2">
          {alerts.slice(1).map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-2.5 text-xs text-slate-800 bg-white/60 p-2.5 rounded-xl border border-black/5"
            >
              {a.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-slate-900">{a.title}</p>
                <p className="text-slate-600 mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
