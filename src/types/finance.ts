/**
 * Types & Domain Models for FocoFinance
 */

export type ExecutionStatus = 'prevista' | 'realizada' | 'parcial' | 'nao_realizada';

export type IncomeType = 
  | 'salary_main'       // Salário principal
  | 'salary_extra'      // Salário extraordinário
  | 'allowance'         // Subsídio
  | 'bonus'             // Bónus
  | 'side_job'          // Trabalho adicional
  | 'other';            // Outros rendimentos

export type ExpenseCategory = 
  | 'family'            // Compromissos familiares
  | 'transport'         // Transporte & Táxi
  | 'education'         // Educação & Estudos
  | 'food'              // Alimentação
  | 'personal'          // Despesas pessoais & Higiene
  | 'communication'     // Saldo & Internet
  | 'housing'           // Habitação & Contas
  | 'debt'              // Pagamento de dívidas
  | 'investments'       // Investimentos & Projectos
  | 'leisure'           // Lazer & Passeios
  | 'health'            // Saúde
  | 'other';            // Outras despesas

export type ExpenseRecurrence = 'fixa' | 'variavel';
export type ExpenseType = ExpenseRecurrence;

export type Priority = 'essential' | 'high' | 'medium' | 'low';

export type GoalCategory = 
  | 'documents'         // Passaporte e documentação
  | 'education'         // Formação e cursos
  | 'housing'           // Casa própria / Sair de casa / Reforma
  | 'family'            // Apoio familiar e legado
  | 'career'            // Ferramentas de trabalho e projetos
  | 'vehicle'           // Condução e transportes
  | 'purchase'          // Compras e equipamentos
  | 'other';

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export interface MonthExecutionItem {
  status: ExecutionStatus;
  realizedAmount: number;
  notes?: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  type: IncomeType;
  frequency: 'monthly' | 'one_time' | 'annual';
  startMonth: string; // YYYY-MM
  endMonth?: string;   // YYYY-MM (optional)
  isRecurring: boolean;
  notes?: string;
  active: boolean;
}

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  recurrence: ExpenseRecurrence; // 'fixa' (recorrente nos meses seguintes) ou 'variavel' (apenas no mês indicado)
  amount: number; // Valor previsto
  startMonth: string; // YYYY-MM
  endMonth?: string;   // YYYY-MM (optional para fixa)
  paymentDay?: number; // 1 - 31
  priority: Priority;
  isPaused: boolean;
  notes?: string;
  // Execution status per month: '2026-11': { status: 'parcial', realizedAmount: 6000 }
  monthExecutions?: Record<string, MonthExecutionItem>;
}

export interface FinancialGoal {
  id: string;
  name: string;
  description?: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number; // Já acumulado
  priority: Priority;
  desiredCompletionDate?: string; // YYYY-MM
  startMonth: string; // YYYY-MM (mês em que começa a alocar)
  monthlyContribution: number;
  frequency: 'monthly';
  status: GoalStatus;
  notes?: string;
  // Execution status per month
  monthExecutions?: Record<string, MonthExecutionItem>;
}

export interface EmergencyTransaction {
  id: string;
  date: string; // ISO string
  month: string; // YYYY-MM
  type: 'deposit' | 'withdrawal';
  amount: number;
  reason: string;
}

export interface EmergencyFund {
  targetMonths: number; // e.g. 3 or 6 months
  customTargetAmount?: number;
  currentBalance: number;
  monthlyContribution: number;
  startMonth: string; // YYYY-MM
  transactions: EmergencyTransaction[];
}

export interface Debt {
  id: string;
  name: string;
  creditor: string; // Credor ou pessoa a quem deve
  totalAmount: number; // Valor total da dívida
  paidAmount: number; // Valor já pago
  remainingAmount: number; // Saldo em dívida
  startMonth: string; // YYYY-MM
  monthlyPayment: number; // Valor mensal previsto
  paymentPercentage?: number; // Opcional
  status: 'active' | 'settled' | 'paused';
  notes?: string;
  monthExecutions?: Record<string, MonthExecutionItem>;
}

export interface UnspentAllocation {
  id: string;
  fromMonth: string; // YYYY-MM
  amount: number;
  targetType: 'goal' | 'emergency' | 'debt' | 'future_expense' | 'available_buffer';
  targetId?: string; // id da meta, dívida, etc.
  targetName: string;
  date: string; // ISO string
  notes?: string;
}

export interface UnspentOriginItem {
  sourceType: 'expense' | 'goal' | 'debt';
  id: string;
  name: string;
  plannedAmount: number;
  realizedAmount: number;
  unspentAmount: number;
  status: ExecutionStatus;
}

export interface MonthlyBreakdown {
  month: string; // YYYY-MM
  initialBalance: number; // Saldo inicial transportado do mês anterior
  
  // Incomes
  incomes: Array<{ item: Income; amount: number }>;
  totalIncome: number;

  // Expenses
  expenses: Array<{
    item: Expense;
    plannedAmount: number;
    realizedAmount: number;
    status: ExecutionStatus;
    unspentAmount: number;
  }>;
  totalPlannedExpenses: number;
  totalRealizedExpenses: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalFamilyExpenses: number;
  totalPersonalExpenses: number;

  // Goals
  goalsContributions: Array<{
    goal: FinancialGoal;
    plannedContribution: number;
    realizedContribution: number;
    status: ExecutionStatus;
    unspentAmount: number;
    accumulatedAfter: number;
    isCompletedThisMonth: boolean;
  }>;
  totalPlannedGoalsContribution: number;
  totalRealizedGoalsContribution: number;

  // Debts
  debtsPayments: Array<{
    debt: Debt;
    plannedPayment: number;
    realizedPayment: number;
    status: ExecutionStatus;
    unspentAmount: number;
    remainingAfter: number;
    isSettledThisMonth: boolean;
  }>;
  totalPlannedDebtPayments: number;
  totalRealizedDebtPayments: number;

  // Emergency Fund
  emergencyFundContribution: number;
  emergencyFundBalanceAfter: number;

  // Unspent Balances (Saldo Não Realizado)
  unspentOrigins: UnspentOriginItem[];
  unspentFromExpenses: number;
  unspentFromGoals: number;
  unspentFromDebts: number;
  totalMonthUnspentGenerated: number; // Dinheiro que estava previsto mas não foi gasto
  totalAllocationsFromUnspent: number;
  netMonthUnspentAvailable: number; // unspent gerado - alocado

  // Summary Metrics
  totalPlannedOutflows: number; // Planned Expenses + Planned Goals + Planned Debts + EF
  totalRealizedOutflows: number; // Realized Expenses + Realized Goals + Realized Debts + EF
  netCashFlow: number; // Income - Realized Outflows
  finalBalance: number; // initialBalance + netCashFlow
  availablePersonalMoney: number; // Folga livre real

  // Ratios
  committedPercentage: number;
  savingsRate: number;
  
  // Status flags
  isDeficit: boolean;
  goalsStarted: FinancialGoal[];
  goalsCompleted: FinancialGoal[];
}
