import React, { useState } from 'react';
import { Plus, Wallet, Edit2, Trash2, Calendar, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Income, IncomeType } from '../../types/finance';
import {
  formatKwanza,
  formatMonthYear,
  INCOME_TYPE_LABELS,
} from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const IncomesView: React.FC = () => {
  const { state, selectedMonth, addIncome, updateIncome, deleteIncome } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(350000);
  const [type, setType] = useState<IncomeType>('salary_main');
  const [frequency, setFrequency] = useState<'monthly' | 'one_time' | 'annual'>('monthly');
  const [startMonth, setStartMonth] = useState(selectedMonth);
  const [endMonth, setEndMonth] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  const openAddModal = () => {
    setEditingIncome(null);
    setName('');
    setAmount(350000);
    setType('salary_main');
    setFrequency('monthly');
    setStartMonth(selectedMonth);
    setEndMonth('');
    setNotes('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (inc: Income) => {
    setEditingIncome(inc);
    setName(inc.name);
    setAmount(inc.amount);
    setType(inc.type);
    setFrequency(inc.frequency);
    setStartMonth(inc.startMonth);
    setEndMonth(inc.endMonth || '');
    setNotes(inc.notes || '');
    setActive(inc.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) return;

    const payload = {
      name: name.trim(),
      amount,
      type,
      frequency,
      startMonth,
      endMonth: endMonth.trim() ? endMonth.trim() : undefined,
      isRecurring: frequency === 'monthly',
      notes: notes.trim() || undefined,
      active,
    };

    if (editingIncome) {
      updateIncome(editingIncome.id, payload);
    } else {
      addIncome(payload);
    }

    setIsModalOpen(false);
  };

  // Filter incomes active in current selected month vs all
  const activeInSelectedMonth = state.incomes.filter((inc) => {
    // Custom logic matching our engine
    if (!inc.active) return false;
    if (inc.frequency === 'one_time') return inc.startMonth === selectedMonth;
    if (inc.startMonth > selectedMonth) return false;
    if (inc.endMonth && inc.endMonth < selectedMonth) return false;
    return true;
  });

  const totalCurrentIncome = activeInSelectedMonth.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Gestão de Rendimentos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Defina o seu salário normal (ex: 350.000 Kz) e adicione rendimentos extraordinários
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right sm:border-r border-slate-200 sm:pr-4">
            <span className="text-[11px] text-slate-500 block">Total Previsto em {selectedMonth}</span>
            <span className="text-lg font-extrabold text-emerald-600">
              {formatKwanza(totalCurrentIncome)}
            </span>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Rendimento</span>
          </button>
        </div>
      </div>

      {/* Incomes List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">
            Fontes de Rendimento Cadastradas ({state.incomes.length})
          </h3>
          <span className="text-xs text-slate-500">
            {activeInSelectedMonth.length} activo(s) em {formatMonthYear(selectedMonth)}
          </span>
        </div>

        {state.incomes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">Nenhum rendimento cadastrado</p>
            <p className="text-xs mt-1">Comece por cadastrar o seu salário mensal principal.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {state.incomes.map((inc) => {
              const isActiveThisMonth = activeInSelectedMonth.some((item) => item.id === inc.id);
              return (
                <div
                  key={inc.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/80 ${
                    !isActiveThisMonth ? 'opacity-60 bg-slate-50/30' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900">{inc.name}</h4>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {INCOME_TYPE_LABELS[inc.type]}
                      </span>
                      {inc.frequency === 'one_time' ? (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Pontual em {inc.startMonth}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Mensal recorrente
                        </span>
                      )}
                      {!isActiveThisMonth && (
                        <span className="text-[10px] text-slate-500 italic">
                          (Não aplicável em {selectedMonth})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Início: <strong>{inc.startMonth}</strong></span>
                      {inc.endMonth && <span>Término: <strong>{inc.endMonth}</strong></span>}
                      {inc.notes && <span className="text-slate-600 truncate max-w-xs">{inc.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900 block">
                        {formatKwanza(inc.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {inc.frequency === 'monthly' ? 'por mês' : 'valor total'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <button
                        onClick={() => openEditModal(inc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingIncome(inc)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Eliminar rendimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Income */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIncome ? 'Editar Rendimento' : 'Novo Rendimento'}
        subtitle="Registe o salário principal ou rendimentos extraordinários"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Rendimento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Salário Principal, Bónus, Trabalho Freelance..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor em Kwanzas (Kz) *
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Visualização: {formatKwanza(amount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Rendimento *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncomeType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="salary_main">Salário principal</option>
                <option value="salary_extra">Salário extraordinário</option>
                <option value="allowance">Subsídio</option>
                <option value="bonus">Bónus</option>
                <option value="side_job">Trabalho adicional</option>
                <option value="other">Outros rendimentos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequência *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="monthly">Mensal (Recorrente)</option>
                <option value="one_time">Pontual (Mês único)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mês de Início *
              </label>
              <input
                type="month"
                required
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mês de Término (Opcional)
              </label>
              <input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                placeholder="Indefinido"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais sobre o rendimento..."
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
              {editingIncome ? 'Guardar Alterações' : 'Criar Rendimento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={!!deletingIncome}
        onClose={() => setDeletingIncome(null)}
        onConfirm={() => {
          if (deletingIncome) {
            deleteIncome(deletingIncome.id);
            setDeletingIncome(null);
          }
        }}
        title="Eliminar Rendimento"
        message={`Tem a certeza de que deseja eliminar o rendimento "${deletingIncome?.name}" (${deletingIncome ? formatKwanza(deletingIncome.amount) : ''})? Esta acção irá removê-lo das projecções orçamentais futuras.`}
        confirmText="Eliminar Rendimento"
        isDestructive={true}
      />
    </div>
  );
};
