import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import BudgetCard from './components/BudgetCard';
import ExpenseList from './components/ExpenseList';
import ExpenseForm from './components/ExpenseForm';
import BudgetForm from './components/BudgetForm';
import AnalyticsPage from './components/AnalyticsPage';
import { formatCurrency } from './utils/formatters';
import api from './services/api';
import {
  IndianRupee,
  Target,
  Wallet,
  AlertTriangle,
  Sparkles,
  Plus,
  BellRing,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import './App.css';

export default function App() {
  // Page navigation state — 'dashboard' or 'analytics'
  const [activePage, setActivePage] = useState('dashboard');

  // State loaded from MongoDB
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal controls
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // ── Fetching ────────────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    const data = await api.getExpenses();
    setExpenses(data);
    return data;
  }, []);

  const fetchBudgets = useCallback(async () => {
    const data = await api.getBudgets();
    setBudgets(data);
    return data;
  }, []);

  const fetchAllData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchExpenses(), fetchBudgets()]);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server. Please verify the server is running.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchExpenses, fetchBudgets]);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // ── Month-wise Calculations ─────────────────────────────────────────────────
  // Helper: extract YYYY-MM from an expense's date field
  const getExpenseMonth = (exp) => {
    const d = new Date(exp.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Today's month for the summary stat cards at the top
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Expenses in the current calendar month only
  const currentMonthExpenses = expenses.filter((e) => getExpenseMonth(e) === currentMonth);
  const totalSpentCurrentMonth = currentMonthExpenses.reduce(
    (sum, e) => sum + parseFloat(e.amount || 0), 0
  );

  // Current-month budget cap (for the summary stat cards)
  const currentMonthBudgets = budgets.filter((b) => b.month === currentMonth);
  const totalBudgetEntry = currentMonthBudgets.find((b) => b.category === 'Total');
  const totalBudgetCap = totalBudgetEntry
    ? totalBudgetEntry.limit
    : currentMonthBudgets.reduce((sum, b) => sum + parseFloat(b.limit || 0), 0);
  const totalRemaining = Math.max(0, totalBudgetCap - totalSpentCurrentMonth);

  // Each budget shows spending ONLY from its own month — no cross-month bleed
  const budgetsWithSpent = budgets.map((b) => {
    const monthExpenses = expenses.filter((e) => getExpenseMonth(e) === b.month);
    const categoryMap = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
      return acc;
    }, {});
    const monthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const spent = b.category === 'Total' ? monthTotal : (categoryMap[b.category] || 0);
    return { ...b, spent };
  });

  // Budget alerts only fire for their own month's spending
  const budgetAlerts = budgetsWithSpent.filter(
    (b) => b.limit > 0 && (b.spent / b.limit) >= 0.8
  );

  // ── Expense Handlers ────────────────────────────────────────────────────────
  const handleOpenAddExpense = () => { setEditingExpense(null); setIsExpenseModalOpen(true); };
  const handleOpenEditExpense = (expense) => { setEditingExpense(expense); setIsExpenseModalOpen(true); };

  const handleSaveExpense = async (expenseData) => {
    try {
      setError(null);
      if (editingExpense) {
        await api.updateExpense(editingExpense._id || editingExpense.id, expenseData);
      } else {
        await api.createExpense(expenseData);
      }
      await fetchAllData();
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
    } catch (err) {
      setError(err.message || 'Failed to save expense');
      throw err;
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Delete this expense entry?')) {
      try {
        setError(null);
        await api.deleteExpense(id);
        await fetchAllData();
      } catch (err) {
        setError(err.message || 'Failed to delete expense');
      }
    }
  };

  // ── Budget Handlers ─────────────────────────────────────────────────────────
  const handleOpenAddBudget = () => { setEditingBudget(null); setIsBudgetModalOpen(true); };
  const handleOpenEditBudget = (budget) => { setEditingBudget(budget); setIsBudgetModalOpen(true); };

  const handleSaveBudget = async (budgetData) => {
    try {
      setError(null);
      if (editingBudget) {
        await api.updateBudget(editingBudget._id || editingBudget.id, budgetData);
      } else {
        // If a budget for the same month+category already exists, update it
        const existing = budgets.find(
          (b) => b.month === budgetData.month && b.category === budgetData.category
        );
        if (existing) {
          await api.updateBudget(existing._id || existing.id, budgetData);
        } else {
          await api.createBudget(budgetData);
        }
      }
      await fetchAllData();
      setIsBudgetModalOpen(false);
      setEditingBudget(null);
    } catch (err) {
      setError(err.message || 'Failed to save budget');
      throw err;
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Delete this budget limit?')) {
      try {
        setError(null);
        await api.deleteBudget(id);
        await fetchAllData();
      } catch (err) {
        setError(err.message || 'Failed to delete budget');
      }
    }
  };

  const isCompletelyEmpty = !isLoading && expenses.length === 0 && budgets.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Navbar
        onOpenAddExpense={handleOpenAddExpense}
        onOpenSetBudget={handleOpenAddBudget}
        alertCount={budgetAlerts.length}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {/* ── Analytics Page ── */}
      {activePage === 'analytics' && (
        <AnalyticsPage expenses={expenses} budgets={budgets} />
      )}

      {/* ── Dashboard Page ── */}
      {activePage === 'dashboard' && (
        <main className="dashboard-content">
          {/* Error Banner */}
          {error && (
            <div className="status-banner error-banner">
              <div className="banner-content">
                <AlertCircle size={18} className="banner-icon-error" />
                <span className="banner-text"><strong>Server Notice:</strong> {error}</span>
              </div>
              <button className="btn-retry" onClick={() => fetchAllData(true)}>
                <RefreshCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Welcome Banner (empty state) */}
          {isCompletelyEmpty && (
            <div className="welcome-banner">
              <div className="welcome-header">
                <div className="welcome-icon"><Sparkles size={24} /></div>
                <div>
                  <h2>Welcome to SmartSpend!</h2>
                  <p>A simple, intelligent expense and budget manager built for students and daily tracking.</p>
                </div>
              </div>

              <div className="welcome-steps">
                <div className="step-card">
                  <span className="step-number">1</span>
                  <div>
                    <strong>Set a Monthly Budget</strong>
                    <p>Define spending limits for Food, Transport, or an overall monthly cap.</p>
                  </div>
                </div>
                <div className="step-card">
                  <span className="step-number">2</span>
                  <div>
                    <strong>Record Your Expenses</strong>
                    <p>Log transactions with title, amount in ₹, and categories.</p>
                  </div>
                </div>
                <div className="step-card">
                  <span className="step-number">3</span>
                  <div>
                    <strong>Get 80% Limit Alerts</strong>
                    <p>SmartSpend automatically warns you when you cross 80% or 100% of your budget.</p>
                  </div>
                </div>
              </div>

              <div className="welcome-actions">
                <button className="btn-welcome-primary" onClick={handleOpenAddExpense}>
                  <Plus size={16} /><span>Add Your First Expense</span>
                </button>
                <button className="btn-welcome-secondary" onClick={handleOpenAddBudget}>
                  <Target size={16} /><span>Set a Budget</span>
                </button>
              </div>
            </div>
          )}

          {/* Budget Alerts */}
          {budgetAlerts.length > 0 && (
            <div className="alert-banner">
              <div className="alert-banner-icon"><AlertTriangle size={18} /></div>
              <div className="alert-banner-text">
                <strong>SmartSpend Alert:</strong> You have {budgetAlerts.length} budget
                {budgetAlerts.length > 1 ? 's' : ''} at or above 80% capacity (
                {budgetAlerts.map((b) => `${b.category} ${b.month}: ${Math.round((b.spent / b.limit) * 100)}%`).join(', ')}
                ).
              </div>
            </div>
          )}

          {/* Summary Stat Cards — scoped to the current month */}
          <section className="stats-grid">
            <StatCard
              title="This Month's Spending"
              amount={formatCurrency(totalSpentCurrentMonth)}
              subtitle={`${currentMonth} expenses`}
              icon={IndianRupee}
              variant="primary"
            />
            <StatCard
              title="Budget Limit"
              amount={totalBudgetCap > 0 ? formatCurrency(totalBudgetCap) : 'Not Set'}
              subtitle={totalBudgetCap > 0 ? `${currentMonth} target` : 'Click "Set Budget" to set'}
              icon={Target}
              variant="success"
            />
            <StatCard
              title="Remaining Balance"
              amount={totalBudgetCap > 0 ? formatCurrency(totalRemaining) : '₹0.00'}
              subtitle={
                totalBudgetCap === 0
                  ? 'No budget configured'
                  : totalSpentCurrentMonth > totalBudgetCap
                  ? 'Over budget!'
                  : 'Available to spend'
              }
              icon={Wallet}
              variant={totalRemaining === 0 && totalBudgetCap > 0 ? 'danger' : 'primary'}
            />
            <StatCard
              title="Budget Alerts"
              amount={budgetAlerts.length}
              subtitle={budgetAlerts.length > 0 ? 'Budgets ≥ 80%' : 'All limits safe'}
              icon={BellRing}
              variant={budgetAlerts.length > 0 ? 'warning' : 'success'}
            />
          </section>

          {/* Monthly Budgets */}
          <section className="dashboard-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Monthly Budgets</h2>
                <p className="section-subtitle">Each budget tracks spending only within its own month</p>
              </div>
              <button className="btn-action-outline" onClick={handleOpenAddBudget}>
                <Plus size={15} /><span>+ Add Budget</span>
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="empty-budget-box">
                <p>No monthly budgets configured yet.</p>
                <button className="btn-link" onClick={handleOpenAddBudget}>
                  Set your first budget (e.g. ₹3,000 for Food or Total)
                </button>
              </div>
            ) : (
              <div className="budgets-grid">
                {budgetsWithSpent.map((budget) => (
                  <BudgetCard
                    key={budget._id || budget.id}
                    budget={budget}
                    onEditBudget={handleOpenEditBudget}
                    onDeleteBudget={handleDeleteBudget}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Expense Log */}
          <section className="dashboard-section">
            <ExpenseList
              expenses={expenses}
              isLoading={isLoading && expenses.length === 0}
              onEdit={handleOpenEditExpense}
              onDelete={handleDeleteExpense}
              onOpenAdd={handleOpenAddExpense}
            />
          </section>
        </main>
      )}

      {/* Modals */}
      <ExpenseForm
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
      />
      <BudgetForm
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        editingBudget={editingBudget}
      />
    </div>
  );
}
