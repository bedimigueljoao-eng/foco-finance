/**
 * FinanceContext - Central Reactive State & Operations for FocoFinance
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Debt,
  EmergencyFund,
  ExecutionStatus,
  Expense,
  FinancialGoal,
  Income,
  MonthlyBreakdown,
  UnspentAllocation,
} from '../types/finance';
import {
  calculateEssentialExpenses,
  calculateMonthlyBreakdown,
  simulateTimeline,
} from '../utils/calculations';
import {
  AppState,
  exportStateToFile,
  INITIAL_DEFAULT_STATE,
  loadAppState,
  saveAppState,
} from '../services/storage';

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  month?: string;
}

interface FinanceContextType {
  state: AppState;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  setInitialBaselineBalance: (balance: number) => void;

  // Incomes
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  togglePauseExpense: (id: string) => void;
  setExpenseExecution: (
    expenseId: string,
    month: string,
    status: ExecutionStatus,
    realizedAmount?: number
  ) => void;

  // Goals
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => void;
  deleteGoal: (id: string) => { success: boolean; message?: string };
  adjustGoalAccumulated: (id: string, deltaAmount: number) => void;
  setGoalExecution: (
    goalId: string,
    month: string,
    status: ExecutionStatus,
    realizedAmount?: number
  ) => void;

  // Emergency Fund
  updateEmergencyFundConfig: (config: Partial<Omit<EmergencyFund, 'transactions'>>) => void;
  addEmergencyTransaction: (type: 'deposit' | 'withdrawal', amount: number, reason: string) => void;

  // Debts
  addDebt: (debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  recordDebtPayment: (debtId: string, amount: number) => void;
  setDebtExecution: (
    debtId: string,
    month: string,
    status: ExecutionStatus,
    realizedAmount?: number
  ) => void;

  // Unspent Allocations
  allocateUnspentFunds: (
    allocation: Omit<UnspentAllocation, 'id' | 'date'>
  ) => void;

  // Backup & Reset
  exportBackup: () => void;
  importBackup: (jsonContent: string) => boolean;
  resetToDefaults: () => void;

  // Computed & Projections
  currentMonthBreakdown: MonthlyBreakdown;
  simulatedYear: MonthlyBreakdown[];
  getSimulation: (monthCount: number, startMonth?: string) => MonthlyBreakdown[];
  alerts: AlertItem[];
  essentialExpenses: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadAppState());

  // Automatically persist to localStorage whenever state updates
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const setSelectedMonth = (month: string) => {
    setState((prev) => ({ ...prev, selectedMonth: month }));
  };

  const setInitialBaselineBalance = (balance: number) => {
    setState((prev) => ({ ...prev, initialBaselineBalance: Math.max(0, balance) }));
  };

  // --- Incomes CRUD ---
  const addIncome = (income: Omit<Income, 'id'>) => {
    const newId = `inc-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      incomes: [...prev.incomes, { ...income, id: newId }],
    }));
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.map((inc) => (inc.id === id ? { ...inc, ...updates } : inc)),
    }));
  };

  const deleteIncome = (id: string) => {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((inc) => inc.id !== id),
    }));
  };

  // --- Expenses CRUD ---
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newId = `exp-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: newId }],
    }));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
    }));
  };

  const deleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((exp) => exp.id !== id),
    }));
  };

  const togglePauseExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((exp) =>
        exp.id === id ? { ...exp, isPaused: !exp.isPaused } : exp
      ),
    }));
  };

  const setExpenseExecution = (
    expenseId: string,
    month: string,
    status: ExecutionStatus,
    realizedAmount?: number
  ) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((exp) => {
        if (exp.id !== expenseId) return exp;
        const currentExec = exp.monthExecutions || {};
        let finalRealized = exp.amount;
        if (status === 'realizada') {
          finalRealized = exp.amount;
        } else if (status === 'parcial') {
          finalRealized = realizedAmount !== undefined ? realizedAmount : exp.amount;
        } else if (status === 'nao_realizada') {
          finalRealized = 0;
        } else {
          finalRealized = exp.amount;
        }

        return {
          ...exp,
          monthExecutions: {
            ...currentExec,
            [month]: {
              status,
              realizedAmount: finalRealized,
            },
          },
        };
      }),
    }));
  };

  // --- Goals CRUD ---
  const addGoal = (goal: Omit<FinancialGoal, 'id'>) => {
    const newId = `goal-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: newId }],
    }));
  };

  const updateGoal = (id: string, updates: Partial<FinancialGoal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  /**
   * Deleting a financial goal:
   * Permite eliminar qualquer meta financeira definida pelo utilizador.
   */
  const deleteGoal = (id: string): { success: boolean; message?: string } => {
    const goal = state.goals.find((g) => g.id === id);
    if (!goal) return { success: false, message: 'Meta não encontrada.' };

    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
    return { success: true };
  };

  const adjustGoalAccumulated = (id: string, deltaAmount: number) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== id) return g;
        const newAmt = Math.max(0, g.currentAmount + deltaAmount);
        const status = newAmt >= g.targetAmount ? 'completed' : g.status;
        return { ...g, currentAmount: newAmt, status };
      }),
    }));
  };

  const setGoalExecution = (
    goalId: string,
    month: string,
    status: ExecutionStatus,
    realizedAmount?: number
  ) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const currentExec = g.monthExecutions || {};
        let finalRealized = g.monthlyContribution;
        if (status === 'realizada') {
          finalRealized = g.monthlyContribution;
        } else if (status === 'parcial') {
          finalRealized = realizedAmount !== undefined ? realizedAmount : g.monthlyContribution;
        } else if (status === 'nao_realizada') {
          finalRealized = 0;
        } else {
          finalRealized = g.monthlyContribution;
        }

        return {
          ...g,
          monthExecutions: {
            ...currentExec,
            [month]: {
              status,
              realizedAmount: finalRealized,
            },
          },
        };
      }),
    }));
  };

  // --- Emergency Fund ---
  const updateEmergencyFundConfig = (config: Partial<Omit<EmergencyFund, 'transactions'>>) => {
    setState((prev) => ({
      ...prev,
      emergencyFund: {
        ...prev.emergencyFund,
        ...config,
      },
    }));
  };

  const addEmergencyTransaction = (type: 'deposit' | 'withdrawal', amount: number, reason: string) => {
    if (amount <= 0) return;
    const newTx = {
      id: `ef-tx-${Date.now()}`,
      date: new Date().toISOString(),
      month: state.selectedMonth,
      type,
      amount,
      reason,
    };

    setState((prev) => {
      const delta = type === 'deposit' ? amount : -amount;
      const newBal = Math.max(0, prev.emergencyFund.currentBalance + delta);
      return {
        ...prev,
        emergencyFund: {
          ...prev.emergencyFund,
          currentBalance: newBal,
          transactions: [newTx, ...prev.emergencyFund.transactions],
        },
      };
    });
  };

  // --- Debts CRUD ---
  const addDebt = (debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount'>) => {
    const newId = `debt-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      debts: [
        ...prev.debts,
        {
          ...debt,
          id: newId,
          paidAmount: 0,
          remainingAmount: debt.totalAmount,
          status: 'active',
        },
      ],
    }));
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates };
        if (updates.totalAmount !== undefined || updates.paidAmount !== undefined) {
          const total = updates.totalAmount ?? d.totalAmount;
          const paid = updates.paidAmount ?? d.paidAmount;
          updated.remainingAmount = Math.max(0, total - paid);
          if (updated.remainingAmount === 0) {
            updated.status = 'settled';
          }
        }
        return updated;
      }),
    }));
  };

  const deleteDebt = (id: string) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  const recordDebtPayment = (debtId: string, amount: number) => {
    if (amount <= 0) return;
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => {
        if (d.id !== debtId) return d;
        const newPaid = d.paidAmount + amount;
        const newRemaining = Math.max(0, d.totalAmount - newPaid);
        return {
          ...d,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'settled' : d.status,
        };
      }),
    }));
  };

  const setDebtExecution = (
    debtId: string,
    month: string,
    status: ExecutionStatus,
    realizedAmount?: number
  ) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => {
        if (d.id !== debtId) return d;
        const currentExec = d.monthExecutions || {};
        let finalRealized = d.monthlyPayment;
        if (status === 'realizada') {
          finalRealized = d.monthlyPayment;
        } else if (status === 'parcial') {
          finalRealized = realizedAmount !== undefined ? realizedAmount : d.monthlyPayment;
        } else if (status === 'nao_realizada') {
          finalRealized = 0;
        } else {
          finalRealized = d.monthlyPayment;
        }

        return {
          ...d,
          monthExecutions: {
            ...currentExec,
            [month]: {
              status,
              realizedAmount: finalRealized,
            },
          },
        };
      }),
    }));
  };

  // --- Allocate Unspent Funds ---
  const allocateUnspentFunds = (allocation: Omit<UnspentAllocation, 'id' | 'date'>) => {
    const newAllocation: UnspentAllocation = {
      ...allocation,
      id: `alloc-${Date.now()}`,
      date: new Date().toISOString(),
    };

    setState((prev) => {
      let updatedGoals = prev.goals;
      let updatedEmergencyFund = prev.emergencyFund;
      let updatedDebts = prev.debts;

      if (allocation.targetType === 'goal' && allocation.targetId) {
        updatedGoals = prev.goals.map((g) => {
          if (g.id === allocation.targetId) {
            const newAmt = g.currentAmount + allocation.amount;
            return {
              ...g,
              currentAmount: newAmt,
              status: newAmt >= g.targetAmount ? 'completed' : g.status,
            };
          }
          return g;
        });
      } else if (allocation.targetType === 'emergency') {
        const newTx = {
          id: `ef-tx-${Date.now()}`,
          date: new Date().toISOString(),
          month: allocation.fromMonth,
          type: 'deposit' as const,
          amount: allocation.amount,
          reason: `Aporte através do Saldo Não Utilizado (${allocation.notes || 'Economia de despesas'})`,
        };
        updatedEmergencyFund = {
          ...prev.emergencyFund,
          currentBalance: prev.emergencyFund.currentBalance + allocation.amount,
          transactions: [newTx, ...prev.emergencyFund.transactions],
        };
      } else if (allocation.targetType === 'debt' && allocation.targetId) {
        updatedDebts = prev.debts.map((d) => {
          if (d.id === allocation.targetId) {
            const newPaid = d.paidAmount + allocation.amount;
            const newRemaining = Math.max(0, d.totalAmount - newPaid);
            return {
              ...d,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newRemaining === 0 ? 'settled' : d.status,
            };
          }
          return d;
        });
      }

      return {
        ...prev,
        goals: updatedGoals,
        emergencyFund: updatedEmergencyFund,
        debts: updatedDebts,
        unspentAllocations: [newAllocation, ...(prev.unspentAllocations || [])],
      };
    });
  };

  // --- Backup & Restore ---
  const exportBackup = () => {
    exportStateToFile(state);
  };

  const importBackup = (jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed && Array.isArray(parsed.incomes) && Array.isArray(parsed.expenses)) {
        setState({
          ...INITIAL_DEFAULT_STATE,
          ...parsed,
          unspentAllocations: parsed.unspentAllocations || [],
          version: 2,
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import backup JSON', e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setState(INITIAL_DEFAULT_STATE);
  };

  // --- Projections & Calculations ---
  const essentialExpenses = useMemo(() => {
    return calculateEssentialExpenses(state.expenses, state.selectedMonth);
  }, [state.expenses, state.selectedMonth]);

  const getSimulation = (monthCount: number, startMonth?: string): MonthlyBreakdown[] => {
    return simulateTimeline({
      startMonth: startMonth || state.selectedMonth,
      monthCount,
      initialBalance: state.initialBaselineBalance,
      incomes: state.incomes,
      expenses: state.expenses,
      goals: state.goals,
      emergencyFund: state.emergencyFund,
      debts: state.debts,
      unspentAllocations: state.unspentAllocations || [],
    });
  };

  // 12-month simulation for projections
  const simulatedYear = useMemo(() => {
    return getSimulation(12, state.selectedMonth);
  }, [
    state.selectedMonth,
    state.initialBaselineBalance,
    state.incomes,
    state.expenses,
    state.goals,
    state.emergencyFund,
    state.debts,
    state.unspentAllocations,
  ]);

  // Current month breakdown
  const currentMonthBreakdown = useMemo(() => {
    if (simulatedYear.length > 0 && simulatedYear[0].month === state.selectedMonth) {
      return simulatedYear[0];
    }
    // Fallback direct calculate
    const goalsAccumulatedMap = new Map<string, number>();
    for (const g of state.goals) {
      goalsAccumulatedMap.set(g.id, g.currentAmount);
    }
    const debtsRemainingMap = new Map<string, number>();
    for (const d of state.debts) {
      debtsRemainingMap.set(d.id, d.remainingAmount);
    }

    return calculateMonthlyBreakdown({
      month: state.selectedMonth,
      initialBalance: state.initialBaselineBalance,
      incomes: state.incomes,
      expenses: state.expenses,
      goals: state.goals,
      emergencyFund: state.emergencyFund,
      debts: state.debts,
      unspentAllocations: state.unspentAllocations || [],
      goalsAccumulatedMap,
      debtsRemainingMap,
      emergencyFundBalance: state.emergencyFund.currentBalance,
    });
  }, [simulatedYear, state]);

  // Alerts logic (Never allow silent negative balances or unrealistic goals)
  const alerts = useMemo(() => {
    const list: AlertItem[] = [];

    // Current month deficit
    if (currentMonthBreakdown.isDeficit) {
      list.push({
        id: 'alert-deficit-current',
        type: 'error',
        title: 'Alerta de Défice Financeiro no Mês Atual!',
        message: `As suas despesas e poupanças em ${state.selectedMonth} superam o saldo e rendimentos disponíveis. Défice previsto: ${Math.abs(currentMonthBreakdown.finalBalance).toLocaleString('pt-AO')} Kz. Ajuste despesas ou reduza alocações.`,
        month: state.selectedMonth,
      });
    }

    // High commitment warning (> 95%)
    if (currentMonthBreakdown.committedPercentage > 0.95 && !currentMonthBreakdown.isDeficit) {
      list.push({
        id: 'alert-commitment-high',
        type: 'warning',
        title: 'Orçamento com Margem Mínima',
        message: `${Math.round(currentMonthBreakdown.committedPercentage * 100)}% do seu rendimento deste mês já está totalmente comprometido. Fica com pouca margem para imprevistos.`,
        month: state.selectedMonth,
      });
    }

    // Future deficit in next 6 months
    const futureDeficit = simulatedYear.find((m, idx) => idx > 0 && idx < 6 && m.isDeficit);
    if (futureDeficit) {
      list.push({
        id: `alert-future-deficit-${futureDeficit.month}`,
        type: 'warning',
        title: `Aviso de Défice Projetado em ${futureDeficit.month}`,
        message: `A simulação indica que no mês ${futureDeficit.month} o seu saldo poderá ficar negativo em ${Math.abs(futureDeficit.finalBalance).toLocaleString('pt-AO')} Kz se as despesas programadas forem mantidas.`,
        month: futureDeficit.month,
      });
    }

    return list;
  }, [currentMonthBreakdown, simulatedYear, state.selectedMonth]);

  return (
    <FinanceContext.Provider
      value={{
        state,
        selectedMonth: state.selectedMonth,
        setSelectedMonth,
        setInitialBaselineBalance,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        togglePauseExpense,
        setExpenseExecution,
        addGoal,
        updateGoal,
        deleteGoal,
        adjustGoalAccumulated,
        setGoalExecution,
        updateEmergencyFundConfig,
        addEmergencyTransaction,
        addDebt,
        updateDebt,
        deleteDebt,
        recordDebtPayment,
        setDebtExecution,
        allocateUnspentFunds,
        exportBackup,
        importBackup,
        resetToDefaults,
        currentMonthBreakdown,
        simulatedYear,
        getSimulation,
        alerts,
        essentialExpenses,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
