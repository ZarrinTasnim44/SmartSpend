import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  TrendingUp,
  PieChart,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  Receipt,
  Target
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import './AnalyticsPage.css';

// Register Chart.js components once
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// ── Colour palettes ───────────────────────────────────────────────────────────
const CATEGORY_PALETTE = [
  '#0d9488', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#3b82f6', '#06b6d4', '#84cc16', '#64748b'
];

// Friendly month label: "2026-10" → "Oct 2026"
function fmtMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

// Navigate YYYY-MM by delta months
function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// expenses and budgets are available as props but analytics data is fetched via API
export default function AnalyticsPage({ expenses: _expenses, budgets: _budgets }) {
  const todayMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch analytics data ──────────────────────────────────────────────────
  const fetchData = useCallback(async (month) => {
    setLoading(true);
    setError(null);
    try {
      const [sum, comp] = await Promise.all([
        api.getMonthlySummary(month),
        api.getMonthlyComparison()
      ]);
      setSummary(sum);
      setComparison(Array.isArray(comp) ? comp : []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth, fetchData]);

  const handlePrevMonth = () => setSelectedMonth((m) => shiftMonth(m, -1));
  const handleNextMonth = () => setSelectedMonth((m) => shiftMonth(m, +1));

  // ── Derived chart data ────────────────────────────────────────────────────

  // Doughnut: category breakdown for selected month
  const doughnutData = summary && summary.categoryBreakdown && summary.categoryBreakdown.length > 0
    ? {
        labels: summary.categoryBreakdown.map((c) => c.category),
        datasets: [{
          data: summary.categoryBreakdown.map((c) => c.totalSpent),
          backgroundColor: CATEGORY_PALETTE.slice(0, summary.categoryBreakdown.length),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 8
        }]
      }
    : null;

  // Bar: monthly comparison (last up to 12 months)
  const barMonths = comparison.slice(-12);
  const barData = {
    labels: barMonths.map((d) => fmtMonth(d.month)),
    datasets: [{
      label: 'Total Spent (₹)',
      data: barMonths.map((d) => d.totalSpent),
      backgroundColor: barMonths.map((d) =>
        d.month === selectedMonth ? '#0d9488' : '#ccfbf1'
      ),
      borderColor: barMonths.map((d) =>
        d.month === selectedMonth ? '#0f766e' : '#99f6e4'
      ),
      borderWidth: 1.5,
      borderRadius: 6
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          boxWidth: 12,
          padding: 14
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = summary?.categoryBreakdown?.[ctx.dataIndex]?.percentage ?? 0;
            return ` ₹${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Monthly Expense Trend',
        font: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: '600' },
        color: '#0f172a'
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => `₹${v.toLocaleString('en-IN')}`,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
        },
        grid: { color: '#f1f5f9' }
      },
      x: {
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
        },
        grid: { display: false }
      }
    }
  };

  // Budget progress for selected month (from summary.budgetProgress)
  const budgetProgress = summary?.budgetProgress ?? [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="analytics-container">
      {/* Page Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">
            <TrendingUp size={22} className="analytics-title-icon" />
            Analytics
          </h1>
          <p className="analytics-subtitle">
            Month-by-month spending insights. Each month's budget is fully independent.
          </p>
        </div>

        {/* Month Selector */}
        <div className="month-selector">
          <button
            className="month-nav-btn"
            onClick={handlePrevMonth}
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="month-label">
            <Calendar size={14} />
            {fmtMonth(selectedMonth)}
          </span>
          <button
            className="month-nav-btn"
            onClick={handleNextMonth}
            title="Next month"
            aria-label="Next month"
            disabled={selectedMonth >= todayMonth}
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="month-today-btn"
            onClick={() => setSelectedMonth(todayMonth)}
            disabled={selectedMonth === todayMonth}
          >
            Today
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="analytics-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => fetchData(selectedMonth)}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="analytics-loading">
          <Loader2 size={28} className="spin" />
          <span>Loading analytics…</span>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* ── Summary Cards ── */}
          <section className="analytics-stat-row">
            <div className="analytics-stat-card">
              <div className="analytics-stat-icon icon-primary">
                <IndianRupee size={18} />
              </div>
              <div>
                <div className="analytics-stat-value">{formatCurrency(summary.totalSpent)}</div>
                <div className="analytics-stat-label">Total Spent — {fmtMonth(selectedMonth)}</div>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-icon icon-success">
                <Receipt size={18} />
              </div>
              <div>
                <div className="analytics-stat-value">{summary.expenseCount}</div>
                <div className="analytics-stat-label">Transactions this month</div>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-icon icon-warning">
                <Target size={18} />
              </div>
              <div>
                <div className="analytics-stat-value">{budgetProgress.length}</div>
                <div className="analytics-stat-label">Budget{budgetProgress.length !== 1 ? 's' : ''} configured</div>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className={`analytics-stat-icon ${summary.alerts?.length > 0 ? 'icon-danger' : 'icon-success'}`}>
                <TrendingUp size={18} />
              </div>
              <div>
                <div className="analytics-stat-value">{summary.alerts?.length ?? 0}</div>
                <div className="analytics-stat-label">Budget alert{(summary.alerts?.length ?? 0) !== 1 ? 's' : ''} this month</div>
              </div>
            </div>
          </section>

          {/* ── Charts Row ── */}
          <section className="analytics-charts-row">
            {/* Doughnut: Category Breakdown */}
            <div className="analytics-chart-card">
              <div className="chart-card-header">
                <PieChart size={16} className="chart-icon" />
                <h2 className="chart-title">Spending by Category</h2>
                <span className="chart-month-badge">{fmtMonth(selectedMonth)}</span>
              </div>

              {doughnutData ? (
                <div className="doughnut-wrapper">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              ) : (
                <div className="chart-empty">
                  <PieChart size={32} className="chart-empty-icon" />
                  <p>No expenses recorded for {fmtMonth(selectedMonth)}</p>
                </div>
              )}
            </div>

            {/* Bar: Monthly Comparison */}
            <div className="analytics-chart-card analytics-chart-card-wide">
              <div className="chart-card-header">
                <BarChart2 size={16} className="chart-icon" />
                <h2 className="chart-title">Monthly Comparison</h2>
                <span className="chart-month-badge">Last {barMonths.length} month{barMonths.length !== 1 ? 's' : ''}</span>
              </div>

              {barMonths.length > 0 ? (
                <div className="bar-wrapper">
                  <Bar data={barData} options={barOptions} />
                </div>
              ) : (
                <div className="chart-empty">
                  <BarChart2 size={32} className="chart-empty-icon" />
                  <p>No expense history available yet</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Budget Progress Table ── */}
          {budgetProgress.length > 0 && (
            <section className="analytics-budget-section">
              <div className="chart-card-header" style={{ marginBottom: '1rem' }}>
                <Target size={16} className="chart-icon" />
                <h2 className="chart-title">Budget Progress — {fmtMonth(selectedMonth)}</h2>
              </div>

              <div className="budget-progress-list">
                {budgetProgress.map((b) => {
                  const pct = Math.min(b.percentageUsed, 100);
                  const statusColor = b.status === 'CRITICAL'
                    ? '#ef4444'
                    : b.status === 'WARNING'
                    ? '#f59e0b'
                    : '#10b981';

                  return (
                    <div key={b.id} className="budget-progress-row">
                      <div className="bp-meta">
                        <span className="bp-category">{b.category}</span>
                        <span className="bp-amounts">
                          {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                        </span>
                        <span
                          className={`bp-status-badge bp-${b.status.toLowerCase()}`}
                        >
                          {b.percentageUsed}%
                        </span>
                      </div>
                      <div className="bp-bar-track">
                        <div
                          className="bp-bar-fill"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: statusColor
                          }}
                        />
                      </div>
                      {b.status === 'CRITICAL' && (
                        <span className="bp-over-note">
                          Over by {formatCurrency(b.spent - b.limit)}
                        </span>
                      )}
                      {b.status !== 'CRITICAL' && (
                        <span className="bp-remaining-note">
                          {formatCurrency(b.remaining)} remaining
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Monthly Spending Summary Table ── */}
          {comparison.length > 0 && (
            <section className="analytics-summary-section">
              <div className="chart-card-header" style={{ marginBottom: '1rem' }}>
                <BarChart2 size={16} className="chart-icon" />
                <h2 className="chart-title">Monthly Spending Summary</h2>
              </div>

              <div className="summary-table-wrapper">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Transactions</th>
                      <th className="text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...comparison].reverse().map((row) => (
                      <tr
                        key={row.month}
                        className={row.month === selectedMonth ? 'summary-row-active' : ''}
                        onClick={() => setSelectedMonth(row.month)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="summary-month-cell">
                          {row.month === selectedMonth && (
                            <span className="summary-active-dot" />
                          )}
                          {fmtMonth(row.month)}
                        </td>
                        <td>{row.count}</td>
                        <td className="text-right summary-amount">{formatCurrency(row.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Empty state when no data at all */}
      {!loading && !error && summary && summary.expenseCount === 0 && comparison.length === 0 && (
        <div className="analytics-empty-all">
          <BarChart2 size={40} className="chart-empty-icon" />
          <h3>No data yet</h3>
          <p>Add expenses on the Dashboard to see analytics here.</p>
        </div>
      )}
    </main>
  );
}
