/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';

import { DashboardView } from './components/dashboard/DashboardView';
import { IncomesView } from './components/incomes/IncomesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { GoalsView } from './components/goals/GoalsView';
import { DebtsView } from './components/debts/DebtsView';
import { EmergencyFundView } from './components/emergency/EmergencyFundView';
import { MonthlyPlanningView } from './components/planning/MonthlyPlanningView';
import { SimulatorView } from './components/simulator/SimulatorView';
import { ReportsView } from './components/reports/ReportsView';

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'incomes':
        return <IncomesView />;
      case 'expenses':
        return <ExpensesView />;
      case 'goals':
        return <GoalsView />;
      case 'debts':
        return <DebtsView />;
      case 'emergency':
        return <EmergencyFundView />;
      case 'planning':
        return <MonthlyPlanningView />;
      case 'simulator':
        return <SimulatorView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-slate-900">
      {/* Offline Status Warning */}
      <OfflineIndicator />

      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setIsMobileDrawerOpen(true)} />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation & Drawer */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenDrawer={isMobileDrawerOpen}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
