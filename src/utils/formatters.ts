/**
 * Currency, Date and Portuguese Label Formatters for FocoFinance
 */

import { ExpenseCategory, ExpenseType, GoalCategory, GoalStatus, IncomeType, Priority } from '../types/finance';

/**
 * Formats a number into Angolan Kwanza standard format: e.g. 350.000 Kz or -26.400 Kz
 */
export function formatKwanza(
  amount: number | null | undefined,
  options?: { showSign?: boolean; showSymbol?: boolean }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 Kz';
  }

  const { showSign = false, showSymbol = true } = options || {};
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));

  // Convert to string with dot thousands separator (Angolan/Portuguese convention)
  const formattedNumber = absVal
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  let prefix = '';
  if (isNegative) {
    prefix = '-';
  } else if (showSign && amount > 0) {
    prefix = '+';
  }

  const symbol = showSymbol ? ' Kz' : '';
  return `${prefix}${formattedNumber}${symbol}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return `${Math.round(value * 100)}%`;
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_SHORT_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/**
 * Returns formatted month name, e.g. "Novembro de 2026"
 */
export function formatMonthYear(ym: string): string {
  if (!ym || !ym.includes('-')) return ym || '';
  const [yearStr, monthStr] = ym.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES_PT[monthIdx] || monthStr;
  return `${monthName} de ${yearStr}`;
}

/**
 * Returns short month name, e.g. "Nov 2026"
 */
export function formatMonthShort(ym: string): string {
  if (!ym || !ym.includes('-')) return ym || '';
  const [yearStr, monthStr] = ym.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_SHORT_PT[monthIdx] || monthStr;
  return `${monthName} ${yearStr}`;
}

/**
 * Adds n months to a 'YYYY-MM' string
 */
export function addMonths(ym: string, monthsToAdd: number): string {
  if (!ym || !ym.includes('-')) return ym;
  const [yearStr, monthStr] = ym.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1 + monthsToAdd;

  year += Math.floor(month / 12);
  month = ((month % 12) + 12) % 12;

  const paddedMonth = String(month + 1).padStart(2, '0');
  return `${year}-${paddedMonth}`;
}

/**
 * Difference in months between ym1 and ym2 (ym2 - ym1)
 */
export function getMonthsDiff(ym1: string, ym2: string): number {
  if (!ym1 || !ym2 || !ym1.includes('-') || !ym2.includes('-')) return 0;
  const [y1, m1] = ym1.split('-').map(Number);
  const [y2, m2] = ym2.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

/**
 * Generate a sequence of months between start and count
 */
export function generateMonthList(startMonth: string, count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(addMonths(startMonth, i));
  }
  return result;
}

// Human readable labels for domain types
export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  salary_main: 'Salário principal',
  salary_extra: 'Salário extraordinário',
  allowance: 'Subsídio',
  bonus: 'Bónus',
  side_job: 'Trabalho adicional',
  other: 'Outros rendimentos',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  family: 'Compromissos familiares',
  transport: 'Transporte & Táxi',
  education: 'Educação & Estudos',
  food: 'Alimentação',
  personal: 'Despesas pessoais & Higiene',
  communication: 'Saldo & Internet',
  housing: 'Habitação & Contas',
  debt: 'Pagamento de dívidas',
  investments: 'Investimentos & Projectos',
  leisure: 'Lazer & Passeios',
  health: 'Saúde & Farmácia',
  other: 'Outras despesas',
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  fixa: 'Despesa fixa (mensal recorrente)',
  variavel: 'Despesa variável (mês pontual)',
};

export const PRIORITY_LABELS: Record<Priority, { label: string; color: string; badge: string }> = {
  essential: { label: 'Essencial', color: 'text-red-700 bg-red-50 border-red-200', badge: 'bg-red-500' },
  high: { label: 'Alta', color: 'text-amber-800 bg-amber-50 border-amber-200', badge: 'bg-amber-500' },
  medium: { label: 'Média', color: 'text-blue-800 bg-blue-50 border-blue-200', badge: 'bg-blue-500' },
  low: { label: 'Baixa', color: 'text-slate-700 bg-slate-100 border-slate-200', badge: 'bg-slate-400' },
};

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  documents: 'Documentos & Burocracia',
  education: 'Educação & Cursos',
  housing: 'Habitação & Reforma',
  family: 'Família & Apoio',
  career: 'Carreira & Negócios',
  vehicle: 'Condução & Transporte',
  purchase: 'Equipamentos & Bens',
  other: 'Outros objectivos',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, { label: string; color: string }> = {
  not_started: { label: 'Não iniciado', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  in_progress: { label: 'Em andamento', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  completed: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  paused: { label: 'Pausado', color: 'bg-amber-50 text-amber-700 border-amber-300' },
};

export const EXECUTION_STATUS_LABELS = {
  prevista: {
    label: 'Prevista',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Valor reservado no orçamento',
  },
  realizada: {
    label: 'Realizada',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    description: 'Gasto efectivamente no valor integral',
  },
  parcial: {
    label: 'Realizada parcialmente',
    color: 'bg-amber-50 text-amber-700 border-amber-300',
    description: 'Gasto menor que o previsto; diferença libertada',
  },
  nao_realizada: {
    label: 'Não realizada',
    color: 'bg-rose-50 text-rose-700 border-rose-300',
    description: 'Não gasto; valor integral libertado para saldo',
  },
} as const;

export const EXPENSE_RECURRENCE_LABELS = {
  fixa: 'Despesa fixa (recorrente nos meses seguintes)',
  variavel: 'Despesa variável (apenas no mês indicado)',
} as const;

