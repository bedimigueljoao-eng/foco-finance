/**
 * LocalStorage Persistence and Data Backup/Restore Service for FocoFinance
 */

import {
  Debt,
  EmergencyFund,
  Expense,
  FinancialGoal,
  Income,
  UnspentAllocation,
} from '../types/finance';

const STORAGE_KEY = 'focofinance_state_v2';

export interface AppState {
  version: number;
  selectedMonth: string;
  initialBaselineBalance: number;
  incomes: Income[];
  expenses: Expense[];
  goals: FinancialGoal[];
  emergencyFund: EmergencyFund;
  debts: Debt[];
  unspentAllocations: UnspentAllocation[];
}

export const INITIAL_DEFAULT_STATE: AppState = {
  version: 2,
  selectedMonth: '2026-11',
  initialBaselineBalance: 0, // Sem saldo artificial: começa com zero a menos que definido pelo utilizador
  unspentAllocations: [],
  incomes: [
    {
      id: 'inc-salary-1',
      name: 'Salário Principal',
      amount: 350000,
      type: 'salary_main',
      frequency: 'monthly',
      startMonth: '2026-11',
      isRecurring: true,
      active: true,
      notes: 'Salário base mensal recebido no final do mês',
    },
    {
      id: 'inc-extra-1',
      name: 'Trabalho Adicional / Freelance',
      amount: 45000,
      type: 'side_job',
      frequency: 'one_time',
      startMonth: '2026-12',
      isRecurring: false,
      active: true,
      notes: 'Consultoria e serviços de apoio técnico de fim de ano',
    },
  ],
  expenses: [
    // Responsabilidades familiares (Fixas)
    {
      id: 'exp-fam-1',
      name: 'Universidade da irmã',
      category: 'family',
      recurrence: 'fixa',
      amount: 65000,
      startMonth: '2026-11',
      paymentDay: 5,
      priority: 'essential',
      isPaused: false,
      notes: 'Propina universitária da irmã',
    },
    {
      id: 'exp-fam-2',
      name: 'Ajuda ao irmão',
      category: 'family',
      recurrence: 'fixa',
      amount: 30000,
      startMonth: '2026-11',
      paymentDay: 8,
      priority: 'high',
      isPaused: false,
      notes: 'Apoio nas despesas do irmão',
    },
    {
      id: 'exp-fam-3',
      name: 'Ajuda Midoi',
      category: 'family',
      recurrence: 'fixa',
      amount: 6000,
      startMonth: '2026-11',
      paymentDay: 10,
      priority: 'medium',
      isPaused: false,
      notes: 'Apoio mensal para Midoi',
    },

    // Despesas pessoais & dia a dia
    {
      id: 'exp-pes-1',
      name: 'Táxi / Transporte diário',
      category: 'transport',
      recurrence: 'fixa',
      amount: 26400,
      startMonth: '2026-11',
      priority: 'essential',
      isPaused: false,
      notes: 'Transporte diário para deslocações e trabalho',
    },
    {
      id: 'exp-pes-2',
      name: 'Saldo / Recargas telemóvel',
      category: 'communication',
      recurrence: 'fixa',
      amount: 5000,
      startMonth: '2026-11',
      priority: 'high',
      isPaused: false,
      notes: 'Comunicação e pacotes de internet',
    },
    {
      id: 'exp-pes-3',
      name: 'Material de higiene',
      category: 'personal',
      recurrence: 'fixa',
      amount: 10000,
      startMonth: '2026-11',
      priority: 'essential',
      isPaused: false,
      notes: 'Artigos de higiene pessoal mensal',
    },
    {
      id: 'exp-pes-4',
      name: 'Passeio com namorada',
      category: 'leisure',
      recurrence: 'fixa',
      amount: 10000,
      startMonth: '2026-11',
      priority: 'medium',
      isPaused: false,
      notes: 'Lazer e momentos a dois no fim de semana',
    },
    {
      id: 'exp-pes-5',
      name: 'Ideias com amigos',
      category: 'leisure',
      recurrence: 'fixa',
      amount: 10000,
      startMonth: '2026-11',
      priority: 'medium',
      isPaused: false,
      notes: 'Convivência e momentos de descontracção',
    },
    {
      id: 'exp-pes-6',
      name: 'Camisas e sapatos',
      category: 'personal',
      recurrence: 'variavel', // Apenas no mês indicado
      amount: 5000,
      startMonth: '2026-11',
      priority: 'low',
      isPaused: false,
      notes: 'Compra pontual de vestuário e calçado',
    },
    {
      id: 'exp-pes-7',
      name: 'Dinheiro semanal (bolso)',
      category: 'personal',
      recurrence: 'fixa',
      amount: 20000,
      startMonth: '2026-11',
      priority: 'high',
      isPaused: false,
      notes: 'Pequenas despesas pontuais ao longo da semana',
    },
    {
      id: 'exp-pes-8',
      name: 'Rita saldo',
      category: 'communication',
      recurrence: 'fixa',
      amount: 2000,
      startMonth: '2026-11',
      priority: 'medium',
      isPaused: false,
      notes: 'Recarga mensal Rita',
    },
  ],
  goals: [
    {
      id: 'goal-passaporte',
      name: 'Passaporte',
      description: 'Emissão e taxas oficiais do passaporte angolano',
      category: 'documents',
      targetAmount: 35000,
      currentAmount: 0,
      priority: 'essential',
      desiredCompletionDate: '2026-11',
      startMonth: '2026-11',
      monthlyContribution: 35000,
      frequency: 'monthly',
      status: 'in_progress',
      notes: 'Objectivo urgente para documentação oficial',
    },
    {
      id: 'goal-conducao',
      name: 'Escola de condução',
      description: 'Inscrição na auto-escola e aulas para carta ligeira',
      category: 'vehicle',
      targetAmount: 120000,
      currentAmount: 0,
      priority: 'high',
      desiredCompletionDate: '2027-03',
      startMonth: '2026-12',
      monthlyContribution: 30000,
      frequency: 'monthly',
      status: 'not_started',
      notes: 'Poupança de 30.000 Kz durante 4 meses',
    },
    {
      id: 'goal-livros',
      name: 'Comprar livros',
      description: 'Livros de desenvolvimento pessoal, tecnologia e finanças',
      category: 'education',
      targetAmount: 25000,
      currentAmount: 0,
      priority: 'medium',
      desiredCompletionDate: '2026-12',
      startMonth: '2026-11',
      monthlyContribution: 10000,
      frequency: 'monthly',
      status: 'in_progress',
      notes: 'Investimento em conhecimento contínuo',
    },
    {
      id: 'goal-cursos',
      name: 'Cursos profissionais',
      description: 'Especializações e certificações na área profissional',
      category: 'education',
      targetAmount: 60000,
      currentAmount: 0,
      priority: 'high',
      desiredCompletionDate: '2027-04',
      startMonth: '2027-01',
      monthlyContribution: 20000,
      frequency: 'monthly',
      status: 'not_started',
      notes: 'Avançar na carreira com novas certificações',
    },
    {
      id: 'goal-projetos',
      name: 'Projectos pessoais',
      description: 'Fundo para arranque de iniciativa empresarial e protótipos',
      category: 'career',
      targetAmount: 150000,
      currentAmount: 0,
      priority: 'medium',
      desiredCompletionDate: '2027-08',
      startMonth: '2027-03',
      monthlyContribution: 25000,
      frequency: 'monthly',
      status: 'not_started',
      notes: 'Capital semente para iniciativa própria',
    },
    {
      id: 'goal-mae',
      name: 'Reformar a casa da mãe',
      description: 'Pintura, melhorias na cozinha e arranjos prioritários',
      category: 'family',
      targetAmount: 450000,
      currentAmount: 0,
      priority: 'high',
      desiredCompletionDate: '2028-02',
      startMonth: '2027-04',
      monthlyContribution: 40000,
      frequency: 'monthly',
      status: 'not_started',
      notes: 'Compromisso com o conforto da mãe',
    },
    {
      id: 'goal-independencia',
      name: 'Sair de casa / Independência',
      description: 'Caução de arrendamento e primeiros equipamentos para moradia própria',
      category: 'housing',
      targetAmount: 600000,
      currentAmount: 0,
      priority: 'high',
      desiredCompletionDate: '2028-06',
      startMonth: '2027-05',
      monthlyContribution: 50000,
      frequency: 'monthly',
      status: 'not_started',
      notes: 'Conquista da independência habitacional',
    },
  ],
  emergencyFund: {
    targetMonths: 3,
    currentBalance: 50000,
    monthlyContribution: 20000,
    startMonth: '2026-11',
    transactions: [
      {
        id: 'tx-ef-1',
        date: '2026-10-15T10:00:00Z',
        month: '2026-10',
        type: 'deposit',
        amount: 50000,
        reason: 'Aporte inicial para abertura da reserva de emergência',
      },
    ],
  },
  debts: [
    {
      id: 'debt-1',
      name: 'Dívida Inicial',
      creditor: 'Credor Particular',
      totalAmount: 190000,
      paidAmount: 0,
      remainingAmount: 190000,
      monthlyPayment: 60000, // Conforme exemplo: 60k/mês (Nov 60k, Dez 60k, Jan 60k, Fev 10k)
      startMonth: '2026-11',
      status: 'active',
      notes: 'Dívida a liquidar com pagamentos de 60.000 Kz/mês',
    },
  ],
};

/**
 * Loads state from localStorage or initial defaults
 */
export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Also check old key to migrate if exists
      const oldRaw = localStorage.getItem('focofinance_state_v1');
      if (oldRaw) {
        try {
          const oldParsed = JSON.parse(oldRaw);
          // Clean the artificial 30000 initial balance if present
          if (oldParsed.initialBaselineBalance === 30000) {
            oldParsed.initialBaselineBalance = 0;
          }
          return {
            ...INITIAL_DEFAULT_STATE,
            ...oldParsed,
            version: 2,
            unspentAllocations: oldParsed.unspentAllocations || [],
          };
        } catch {
          // fallback
        }
      }
      return INITIAL_DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    if (parsed) {
      if (parsed.initialBaselineBalance === 30000) {
        parsed.initialBaselineBalance = 0;
      }
      return {
        ...INITIAL_DEFAULT_STATE,
        ...parsed,
        unspentAllocations: parsed.unspentAllocations || [],
        version: 2,
      };
    }
    return INITIAL_DEFAULT_STATE;
  } catch (err) {
    console.error('Failed to parse state from localStorage', err);
    return INITIAL_DEFAULT_STATE;
  }
}

/**
 * Saves state to localStorage
 */
export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

/**
 * Exports application state to a downloadable JSON file
 */
export function exportStateToFile(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `FocoFinance_Backup_${timestamp}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Exports monthly projection into CSV format
 */
export function exportSimulationToCSV(monthsData: Array<{
  month: string;
  totalIncome: number;
  totalPlannedExpenses: number;
  totalRealizedExpenses: number;
  totalRealizedGoalsContribution: number;
  totalRealizedDebtPayments: number;
  netMonthUnspentAvailable: number;
  finalBalance: number;
  isDeficit: boolean;
}>): void {
  const headers = [
    'Mês',
    'Rendimento (Kz)',
    'Despesas Previstas (Kz)',
    'Despesas Realizadas (Kz)',
    'Poupança Metas (Kz)',
    'Pagamento Dívidas (Kz)',
    'Saldo Não Utilizado (Kz)',
    'Saldo Final (Kz)',
    'Situação',
  ];

  const rows = monthsData.map((m) => [
    m.month,
    m.totalIncome,
    m.totalPlannedExpenses,
    m.totalRealizedExpenses,
    m.totalRealizedGoalsContribution,
    m.totalRealizedDebtPayments,
    m.netMonthUnspentAvailable,
    m.finalBalance,
    m.isDeficit ? 'ALERTA: DÉFICE' : 'Equilibrado',
  ]);

  const csvContent = [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FocoFinance_Planeamento_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
