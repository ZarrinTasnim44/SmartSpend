import React from 'react';
import { Wallet, Plus, Target, Bell, BarChart2, LayoutDashboard } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import './Navbar.css';

export default function Navbar({
  onOpenAddExpense,
  onOpenSetBudget,
  alertCount = 0,
  activePage = 'dashboard',
  onNavigate
}) {
  const todayFormatted = formatDate(new Date());

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <Wallet size={20} color="#ffffff" />
          </div>
          <div className="brand-text">
            <span className="brand-title">SmartSpend</span>
            <span className="brand-subtitle">Student Expense &amp; Budget Tracker</span>
          </div>
        </div>

        {/* Page Nav Links */}
        <nav className="navbar-nav" aria-label="Main navigation">
          <button
            className={`nav-link${activePage === 'dashboard' ? ' nav-link-active' : ''}`}
            onClick={() => onNavigate('dashboard')}
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-link${activePage === 'analytics' ? ' nav-link-active' : ''}`}
            onClick={() => onNavigate('analytics')}
            aria-current={activePage === 'analytics' ? 'page' : undefined}
          >
            <BarChart2 size={16} />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Actions */}
        <div className="navbar-actions">
          <div className="navbar-date">
            <span>Date: {todayFormatted}</span>
          </div>

          {alertCount > 0 && (
            <div className="alert-indicator" title={`${alertCount} Budget Alert(s)`}>
              <Bell size={18} />
              <span className="alert-count-badge">{alertCount}</span>
            </div>
          )}

          <button className="btn-secondary" onClick={onOpenSetBudget}>
            <Target size={16} />
            <span>Set Budget</span>
          </button>

          <button className="btn-primary" onClick={onOpenAddExpense}>
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
}
