import React, { useState, useEffect } from 'react';
import { Coins, Sparkles, Check, X, Percent } from 'lucide-react';
import { Modal } from './Modal';
import { formatKwanza } from '../../utils/formatters';

interface PartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemTypeLabel?: string; // 'Despesa' | 'Meta Financeira' | 'Dívida'
  plannedAmount: number;
  initialRealizedAmount?: number;
  onConfirm: (realizedAmount: number) => void;
}

export const PartialPaymentModal: React.FC<PartialPaymentModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemTypeLabel = 'Despesa',
  plannedAmount,
  initialRealizedAmount,
  onConfirm,
}) => {
  // O utilizador especificou: "E quando falo parcial, é metade. Quando eu clicar em parcial, eu tenho que introduzir o valor."
  const defaultHalf = Math.round(plannedAmount * 0.5);
  const [amount, setAmount] = useState<number>(defaultHalf);

  useEffect(() => {
    if (isOpen) {
      if (
        initialRealizedAmount !== undefined &&
        initialRealizedAmount > 0 &&
        initialRealizedAmount < plannedAmount
      ) {
        setAmount(initialRealizedAmount);
      } else {
        setAmount(defaultHalf);
      }
    }
  }, [isOpen, initialRealizedAmount, plannedAmount, defaultHalf]);

  const unspent = Math.max(0, plannedAmount - amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeAmount = Math.max(0, Math.min(plannedAmount, Number(amount) || 0));
    onConfirm(safeAmount);
    onClose();
  };

  const setPreset = (percentage: number) => {
    setAmount(Math.round(plannedAmount * percentage));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registar Pagamento Parcial"
      subtitle={`Introduza o valor que foi efectivamente pago para ${itemTypeLabel.toLowerCase()}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Info Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{itemTypeLabel}</span>
            <span className="text-xs font-bold text-slate-900">{formatKwanza(plannedAmount)} (Previsto)</span>
          </div>
          <h4 className="text-base font-bold text-slate-900">{itemName}</h4>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Valor Efectivamente Pago (Kz) *
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={plannedAmount}
              step="500"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-4 pr-16 py-3 rounded-xl border-2 border-amber-300 focus:border-amber-500 focus:outline-none text-lg font-black text-slate-900 bg-amber-50/20"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              Kz
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Introduza o valor pago ou seleccione um dos atalhos rápidos abaixo:
          </span>
        </div>

        {/* Quick presets (50% Metade recomendada pelo utilizador) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreset(0.5)}
            className="flex-1 py-1.5 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            <span>50% (Metade: {formatKwanza(defaultHalf)})</span>
          </button>
          <button
            type="button"
            onClick={() => setPreset(0.25)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setPreset(0.75)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            75%
          </button>
        </div>

        {/* Live Calculation Preview */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-semibold">Valor contabilizado como gasto:</span>
            <span className="font-extrabold text-slate-900">{formatKwanza(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saldo não utilizado (libertado):</span>
            </span>
            <span className="font-extrabold text-emerald-700">+{formatKwanza(unspent)}</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-tight pt-1 border-t border-emerald-200/60">
            A diferença de <strong>{formatKwanza(unspent)}</strong> não será debitada e passa a integrar o seu saldo acumulado disponível.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Pagamento Parcial</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
