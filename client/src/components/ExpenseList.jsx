import React, { useState } from 'react';
import { Edit2, Trash2, Search, Filter, Calendar, Receipt, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import './ExpenseList.css';

const CATEGORY_COLORS = {
  Food: { bg: '#ffedd5', text: '#c2410c' },
  Transportation: { bg: '#e0f2fe', text: '#0369a1' },
  Utilities: { bg: '#fef3c7', text: '#b45309' },
  Entertainment: { bg: '#f3e8ff', text: '#7e22ce' },
  Shopping: { bg: '#fce7f3', text: '#be185d' },
  Health: { bg: '#fee2e2', text: '#b91c1c' },
  Education: { bg: '#ecfdf5', text: '#047857' },
  'Personal Care': { bg: '#e0e7ff', text: '#4338ca' },
  Travel: { bg: '#ccfbf1', text: '#0f766e' },
  Other: { bg: '#f1f5f9', text: '#475569' }
};

export default function ExpenseList({ expenses = [], onEdit, onDelete, onOpenAdd, isLoading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter expenses based on search and category
  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(expenses.map((e) => e.category))];

  return (
    <div className="expense-list-container">
      <div className="expense-list-header">
        <div>
          <h2 className="section-title">Expense Log</h2>
          <p className="section-subtitle">
            {expenses.length === 0
              ? 'Your tracked expenses will appear here'
              : `Showing ${filteredExpenses.length} of ${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {expenses.length > 0 && (
          <div className="expense-filters">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by title or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="category-filter">
              <Filter size={16} className="filter-icon" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="friendly-empty-state">
          <div className="empty-icon-bubble" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Loader2 size={32} className="spinner" />
          </div>
          <h3>Loading expenses...</h3>
          <p>Connecting to MongoDB and fetching your financial records.</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="friendly-empty-state">
          <div className="empty-icon-bubble">
            <Receipt size={32} />
          </div>
          <h3>No expenses added yet!</h3>
          <p>Start recording your daily spends to track budgets and category-wise charts.</p>
          {onOpenAdd && (
            <button className="btn-empty-add" onClick={onOpenAdd}>
              + Add First Expense
            </button>
          )}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="friendly-empty-state">
          <p className="empty-search-text">No expenses matched your search query or filter.</p>
          <button
            className="btn-clear-filter"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Expense Details</th>
                <th>Category</th>
                <th>Date (DD/MM/YYYY)</th>
                <th>Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => {
                const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other;
                const formattedDate = formatDate(expense.date);
                const expenseId = expense._id || expense.id;

                return (
                  <tr key={expenseId} className="expense-row">
                    <td>
                      <div className="expense-item-info">
                        <span className="expense-item-title">{expense.title}</span>
                        {expense.notes && (
                          <span className="expense-item-notes">{expense.notes}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="category-pill"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        <span>{formattedDate}</span>
                      </div>
                    </td>
                    <td>
                      <span className="expense-amount-inr">
                        -{formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          title="Edit Expense"
                          onClick={() => onEdit(expense)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-action btn-delete"
                          title="Delete Expense"
                          onClick={() => onDelete(expenseId)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
