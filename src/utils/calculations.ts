/**
 * Central Financial Calculation Engine for FocoFinance
 * Implements strict balance carryover, execution statuses, unspent fund accounting, and multi-month simulation
 */

import {
  Debt,
  EmergencyFund,
  ExecutionStatus,
  Expense,
  FinancialGoal,
  Income,
  MonthlyBreakdown,
  UnspentAllocation,
  UnspentOriginItem,
} from '../types/finance';
import { addMonths } from './formatters';

/**
 * Checks if an income is active in targetMonth
 */
export function isIncomeActiveInMonth(income: Income, targetMonth: string): boolean {
  if (!income.active) return false;
  
  if (income.frequency === 'one_time') {
    return income.startMonth === targetMonth;
  }

  // Monthly recurring
  if (income.startMonth > targetMonth) {
    return false;
  }

  if (income.endMonth && income.endMonth < targetMonth) {
    return false;
  }

  return true;
}

/**
 * Checks if an expense is active in targetMonth based on recurrence rule:
 * - 'variavel': planned ONLY for the specified month (never carried over automatically)
 * - 'fixa': recurring monthly starting from startMonth until endMonth, suspension, or deletion
 */
export function isExpenseActiveInMonth(expense: Expense, targetMonth: string): boolean {
  if (expense.isPaused) return false;

  // Despesa variável: apenas no mês correspondente
  if (expense.recurrence === 'variavel') {
    return expense.startMonth === targetMonth;
  }

  // Despesa fixa: inicia no mês de início e mantém-se nos seguintes
  if (expense.startMonth > targetMonth) {
    return false;
  }

  if (expense.endMonth && expense.endMonth < targetMonth) {
    return false;
  }

  return true;
}

/**
 * Calculates essential monthly expenses for Emergency Fund target sizing
 */
export function calculateEssentialExpenses(expenses: Expense[], targetMonth: string): number {
  return expenses
    .filter((e) => isExpenseActiveInMonth(e, targetMonth))
    .filter((e) => 
      e.priority === 'essential' || 
      e.recurrence === 'fixa' ||
      e.category === 'family' || 
      e.category === 'housing' || 
      e.category === 'food' || 
      e.category === 'transport'
    )
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Computes projected completion month for a goal given current accumulated state
 */
export function calculateGoalProjection(goal: FinancialGoal, currentAccumulated?: number): {
  remainingAmount: number;
  monthsNeeded: number;
  projectedEndMonth: string;
  isDelayed: boolean;
  isOnSchedule: boolean;
} {
  const accumulated = currentAccumulated !== undefined ? currentAccumulated : goal.currentAmount;
  const remaining = Math.max(0, goal.targetAmount - accumulated);

  if (remaining === 0) {
    return {
      remainingAmount: 0,
      monthsNeeded: 0,
      projectedEndMonth: goal.startMonth,
      isDelayed: false,
      isOnSchedule: true,
    };
  }

  if (goal.monthlyContribution <= 0) {
    return {
      remainingAmount: remaining,
      monthsNeeded: 999,
      projectedEndMonth: 'Sem previsão',
      isDelayed: true,
      isOnSchedule: false,
    };
  }

  const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
  const projectedEndMonth = addMonths(goal.startMonth, Math.max(0, monthsNeeded - 1));

  let isDelayed = false;
  if (goal.desiredCompletionDate) {
    isDelayed = projectedEndMonth > goal.desiredCompletionDate;
  }

  return {
    remainingAmount: remaining,
    monthsNeeded,
    projectedEndMonth,
    isDelayed,
    isOnSchedule: !isDelayed,
  };
}

/**
 * Computes projected completion month for a debt
 */
export function calculateDebtProjection(debt: Debt, currentRemaining?: number): {
  remainingAmount: number;
  monthsNeeded: number;
  projectedEndMonth: string;
} {
  const remaining = currentRemaining !== undefined ? currentRemaining : debt.remainingAmount;

  if (remaining <= 0) {
    return {
      remainingAmount: 0,
      monthsNeeded: 0,
      projectedEndMonth: debt.startMonth,
    };
  }

  if (debt.monthlyPayment <= 0) {
    return {
      remainingAmount: remaining,
      monthsNeeded: 999,
      projectedEndMonth: 'Sem previsão',
    };
  }

  const monthsNeeded = Math.ceil(remaining / debt.monthlyPayment);
  const projectedEndMonth = addMonths(debt.startMonth, Math.max(0, monthsNeeded - 1));

  return {
    remainingAmount: remaining,
    monthsNeeded,
    projectedEndMonth,
  };
}

/**
 * Generates single-month breakdown with precise execution tracking and unspent fund accounting
 */
export function calculateMonthlyBreakdown(params: {
  month: string;
  initialBalance: number;
  incomes: Income[];
  expenses: Expense[];
  goals: FinancialGoal[];
  emergencyFund: EmergencyFund;
  debts: Debt[];
  unspentAllocations: UnspentAllocation[];
  goalsAccumulatedMap: Map<string, number>;
  debtsRemainingMap: Map<string, number>;
  emergencyFundBalance: number;
}): MonthlyBreakdown {
  const {
    month,
    initialBalance,
    incomes,
    expenses,
    goals,
    emergencyFund,
    debts,
    unspentAllocations,
    goalsAccumulatedMap,
    debtsRemainingMap,
    emergencyFundBalance,
  } = params;

  // 1. Incomes
  const activeIncomes = incomes.filter((inc) => isIncomeActiveInMonth(inc, month));
  const incomesList = activeIncomes.map((inc) => ({
    item: inc,
    amount: inc.amount,
  }));
  const totalIncome = incomesList.reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Expenses with execution status & unspent calculation
  const activeExpenses = expenses.filter((exp) => isExpenseActiveInMonth(exp, month));
  const unspentOrigins: UnspentOriginItem[] = [];

  const expensesList = activeExpenses.map((exp) => {
    const plannedAmount = exp.amount;
    const exec = exp.monthExecutions?.[month];

    let status: ExecutionStatus = 'prevista';
    let realizedAmount = plannedAmount;

    if (exec) {
      status = exec.status;
      if (status === 'realizada') {
        realizedAmount = plannedAmount;
      } else if (status === 'parcial') {
        realizedAmount = Math.max(0, Math.min(plannedAmount, exec.realizedAmount));
      } else if (status === 'nao_realizada') {
        realizedAmount = 0;
      } else {
        // prevista
        realizedAmount = plannedAmount;
      }
    }

    // Only unspent when status is 'parcial' or 'nao_realizada'
    const unspentAmount =
      status === 'parcial' || status === 'nao_realizada'
        ? Math.max(0, plannedAmount - realizedAmount)
        : 0;

    if (unspentAmount > 0) {
      unspentOrigins.push({
        sourceType: 'expense',
        id: exp.id,
        name: exp.name,
        plannedAmount,
        realizedAmount,
        unspentAmount,
        status,
      });
    }

    return {
      item: exp,
      plannedAmount,
      realizedAmount,
      status,
      unspentAmount,
    };
  });

  const totalPlannedExpenses = expensesList.reduce((sum, e) => sum + e.plannedAmount, 0);
  const totalRealizedExpenses = expensesList.reduce((sum, e) => sum + e.realizedAmount, 0);

  const totalFixedExpenses = expensesList
    .filter((e) => e.item.recurrence === 'fixa')
    .reduce((sum, e) => sum + e.plannedAmount, 0);

  const totalVariableExpenses = expensesList
    .filter((e) => e.item.recurrence === 'variavel')
    .reduce((sum, e) => sum + e.plannedAmount, 0);

  const totalFamilyExpenses = expensesList
    .filter((e) => e.item.category === 'family')
    .reduce((sum, e) => sum + e.plannedAmount, 0);

  const totalPersonalExpenses = expensesList
    .filter((e) => e.item.category === 'personal')
    .reduce((sum, e) => sum + e.plannedAmount, 0);

  // 3. Financial Goals with execution status
  const goalsContributions: MonthlyBreakdown['goalsContributions'] = [];
  const goalsStarted: FinancialGoal[] = [];
  const goalsCompleted: FinancialGoal[] = [];

  for (const goal of goals) {
    if (goal.status === 'paused') continue;

    const accumulatedBefore = goalsAccumulatedMap.get(goal.id) ?? goal.currentAmount;
    const remainingBefore = Math.max(0, goal.targetAmount - accumulatedBefore);

    if (goal.startMonth === month && remainingBefore > 0) {
      goalsStarted.push(goal);
    }

    // Active if current month is >= startMonth and goal is not yet finished
    if (month >= goal.startMonth && remainingBefore > 0 && goal.monthlyContribution > 0) {
      const plannedContribution = Math.min(goal.monthlyContribution, remainingBefore);
      const exec = goal.monthExecutions?.[month];

      let status: ExecutionStatus = 'prevista';
      let realizedContribution = plannedContribution;

      if (exec) {
        status = exec.status;
        if (status === 'realizada') {
          realizedContribution = plannedContribution;
        } else if (status === 'parcial') {
          realizedContribution = Math.max(0, Math.min(plannedContribution, exec.realizedAmount));
        } else if (status === 'nao_realizada') {
          realizedContribution = 0;
        } else {
          realizedContribution = plannedContribution;
        }
      }

      const unspentAmount =
        status === 'parcial' || status === 'nao_realizada'
          ? Math.max(0, plannedContribution - realizedContribution)
          : 0;

      if (unspentAmount > 0) {
        unspentOrigins.push({
          sourceType: 'goal',
          id: goal.id,
          name: `Meta: ${goal.name}`,
          plannedAmount: plannedContribution,
          realizedAmount: realizedContribution,
          unspentAmount,
          status,
        });
      }

      const accumulatedAfter = accumulatedBefore + realizedContribution;
      const isCompleted = accumulatedAfter >= goal.targetAmount;

      goalsAccumulatedMap.set(goal.id, accumulatedAfter);

      if (isCompleted) {
        goalsCompleted.push(goal);
      }

      goalsContributions.push({
        goal,
        plannedContribution,
        realizedContribution,
        status,
        unspentAmount,
        accumulatedAfter,
        isCompletedThisMonth: isCompleted,
      });
    }
  }

  const totalPlannedGoalsContribution = goalsContributions.reduce(
    (sum, g) => sum + g.plannedContribution,
    0
  );
  const totalRealizedGoalsContribution = goalsContributions.reduce(
    (sum, g) => sum + g.realizedContribution,
    0
  );

  // 4. Debts Payments with execution status
  const debtsPayments: MonthlyBreakdown['debtsPayments'] = [];

  for (const debt of debts) {
    if (debt.status === 'paused' || debt.status === 'settled') continue;

    const remainingBefore = debtsRemainingMap.get(debt.id) ?? debt.remainingAmount;

    if (month >= debt.startMonth && remainingBefore > 0 && debt.monthlyPayment > 0) {
      const plannedPayment = Math.min(debt.monthlyPayment, remainingBefore);
      const exec = debt.monthExecutions?.[month];

      let status: ExecutionStatus = 'prevista';
      let realizedPayment = plannedPayment;

      if (exec) {
        status = exec.status;
        if (status === 'realizada') {
          realizedPayment = plannedPayment;
        } else if (status === 'parcial') {
          realizedPayment = Math.max(0, Math.min(plannedPayment, exec.realizedAmount));
        } else if (status === 'nao_realizada') {
          realizedPayment = 0;
        } else {
          realizedPayment = plannedPayment;
        }
      }

      const unspentAmount =
        status === 'parcial' || status === 'nao_realizada'
          ? Math.max(0, plannedPayment - realizedPayment)
          : 0;

      if (unspentAmount > 0) {
        unspentOrigins.push({
          sourceType: 'debt',
          id: debt.id,
          name: `Dívida: ${debt.name}`,
          plannedAmount: plannedPayment,
          realizedAmount: realizedPayment,
          unspentAmount,
          status,
        });
      }

      const remainingAfter = Math.max(0, remainingBefore - realizedPayment);
      const isSettled = remainingAfter === 0;

      debtsRemainingMap.set(debt.id, remainingAfter);

      debtsPayments.push({
        debt,
        plannedPayment,
        realizedPayment,
        status,
        unspentAmount,
        remainingAfter,
        isSettledThisMonth: isSettled,
      });
    }
  }

  const totalPlannedDebtPayments = debtsPayments.reduce((sum, d) => sum + d.plannedPayment, 0);
  const totalRealizedDebtPayments = debtsPayments.reduce((sum, d) => sum + d.realizedPayment, 0);

  // 5. Emergency Fund Contribution
  const essentialMonthlyExpenses = calculateEssentialExpenses(expenses, month);
  const efTarget = emergencyFund.customTargetAmount ?? (essentialMonthlyExpenses * emergencyFund.targetMonths);
  const efRemaining = Math.max(0, efTarget - emergencyFundBalance);

  let efContribution = 0;
  if (month >= emergencyFund.startMonth && efRemaining > 0 && emergencyFund.monthlyContribution > 0) {
    efContribution = Math.min(emergencyFund.monthlyContribution, efRemaining);
  }
  const emergencyFundBalanceAfter = emergencyFundBalance + efContribution;

  // 6. Unspent Balances & Allocations
  const unspentFromExpenses = expensesList.reduce((sum, e) => sum + e.unspentAmount, 0);
  const unspentFromGoals = goalsContributions.reduce((sum, g) => sum + g.unspentAmount, 0);
  const unspentFromDebts = debtsPayments.reduce((sum, d) => sum + d.unspentAmount, 0);
  const totalMonthUnspentGenerated = unspentFromExpenses + unspentFromGoals + unspentFromDebts;

  const monthAllocations = unspentAllocations.filter((a) => a.fromMonth === month);
  const totalAllocationsFromUnspent = monthAllocations.reduce((sum, a) => sum + a.amount, 0);
  const netMonthUnspentAvailable = Math.max(0, totalMonthUnspentGenerated - totalAllocationsFromUnspent);

  // 7. Net Cash Flow & Balance
  // Fórmula estrita:
  // Saldo final = Saldo inicial + Rendimentos recebidos - Despesas efectivamente realizadas - Contribuições para metas realizadas - Pagamentos de dívidas realizados - Fundo de emergência
  const totalPlannedOutflows =
    totalPlannedExpenses + totalPlannedGoalsContribution + totalPlannedDebtPayments + efContribution;

  const totalRealizedOutflows =
    totalRealizedExpenses + totalRealizedGoalsContribution + totalRealizedDebtPayments + efContribution;

  const netCashFlow = totalIncome - totalRealizedOutflows;
  const finalBalance = initialBalance + netCashFlow;

  // Dinheiro livre (surplus de caixa não comprometido no mês)
  const availablePersonalMoney = Math.max(0, netCashFlow);

  const committedPercentage = totalIncome > 0 ? totalRealizedOutflows / totalIncome : 1;
  const savingsRate = totalIncome > 0 ? (totalRealizedGoalsContribution + efContribution) / totalIncome : 0;
  const isDeficit = finalBalance < 0;

  return {
    month,
    initialBalance,
    incomes: incomesList,
    totalIncome,
    expenses: expensesList,
    totalPlannedExpenses,
    totalRealizedExpenses,
    totalFixedExpenses,
    totalVariableExpenses,
    totalFamilyExpenses,
    totalPersonalExpenses,
    goalsContributions,
    totalPlannedGoalsContribution,
    totalRealizedGoalsContribution,
    debtsPayments,
    totalPlannedDebtPayments,
    totalRealizedDebtPayments,
    emergencyFundContribution: efContribution,
    emergencyFundBalanceAfter,
    unspentOrigins,
    unspentFromExpenses,
    unspentFromGoals,
    unspentFromDebts,
    totalMonthUnspentGenerated,
    totalAllocationsFromUnspent,
    netMonthUnspentAvailable,
    totalPlannedOutflows,
    totalRealizedOutflows,
    netCashFlow,
    finalBalance,
    availablePersonalMoney,
    committedPercentage,
    savingsRate,
    isDeficit,
    goalsStarted,
    goalsCompleted,
  };
}

/**
 * Runs a multi-month simulation carrying over actual final balances sequentially
 * Regra: Saldo inicial de Dezembro = Saldo final de Novembro, etc.
 */
export function simulateTimeline(params: {
  startMonth: string;
  monthCount: number;
  initialBalance: number;
  incomes: Income[];
  expenses: Expense[];
  goals: FinancialGoal[];
  emergencyFund: EmergencyFund;
  debts: Debt[];
  unspentAllocations: UnspentAllocation[];
}): MonthlyBreakdown[] {
  const {
    startMonth,
    monthCount,
    initialBalance,
    incomes,
    expenses,
    goals,
    emergencyFund,
    debts,
    unspentAllocations,
  } = params;

  const results: MonthlyBreakdown[] = [];
  
  // Clone goal accumulated amounts and debt remaining amounts to trace forward
  const goalsAccumulatedMap = new Map<string, number>();
  for (const g of goals) {
    goalsAccumulatedMap.set(g.id, g.currentAmount);
  }

  const debtsRemainingMap = new Map<string, number>();
  for (const d of debts) {
    debtsRemainingMap.set(d.id, d.remainingAmount);
  }

  let runningEFBalance = emergencyFund.currentBalance;
  let runningBalance = initialBalance; // Initial baseline defined by user (or 0)

  for (let i = 0; i < monthCount; i++) {
    const currentMonth = addMonths(startMonth, i);

    const breakdown = calculateMonthlyBreakdown({
      month: currentMonth,
      initialBalance: runningBalance,
      incomes,
      expenses,
      goals,
      emergencyFund,
      debts,
      unspentAllocations,
      goalsAccumulatedMap,
      debtsRemainingMap,
      emergencyFundBalance: runningEFBalance,
    });

    results.push(breakdown);
    // Carry over final balance as next month's initial balance!
    runningBalance = breakdown.finalBalance;
    runningEFBalance = breakdown.emergencyFundBalanceAfter;
  }

  return results;
}
