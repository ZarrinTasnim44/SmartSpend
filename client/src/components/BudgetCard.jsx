import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import './BudgetCard.css';

export default function BudgetCard({ budget, onEditBudget, onDeleteBudget }) {
  const { category, limit, spent = 0, month } = budget;
  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const remaining = Math.max(0, limit - spent);

  // Status computation for alerts
  let status = 'normal';
  if (percentage >= 100) {
    status = 'critical';
  } else if (percentage >= 80) {
    status = 'warning';
  }

  return (
    <div className={`budget-card status-${status}`}>
      <div className="budget-card-header">
        <div className="budget-category-info">
          <span className="budget-category-name">{category}</span>
          <span className="budget-month-tag">{month || 'Monthly Target'}</span>
        </div>

        {status === 'critical' && (
          <span className="badge badge-critical">
            <AlertCircle size={13} /> Over Budget ({percentage}%)
          </span>
        )}
        {status === 'warning' && (
          <span className="badge badge-warning">
            <AlertTriangle size={13} /> 80% Used ({percentage}%)
          </span>
        )}
        {status === 'normal' && (
          <span className="badge badge-normal">
            <CheckCircle size={13} /> Healthy ({percentage}%)
          </span>
        )}
      </div>

      <div className="budget-amounts">
        <div>
          <span className="amount-label">Spent so far</span>
          <div className="amount-value">{formatCurrency(spent)}</div>
        </div>
        <div className="text-right">
          <span className="amount-label">Monthly Limit</span>
          <div className="amount-limit">{formatCurrency(limit)}</div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill fill-${status}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="budget-card-footer">
        <span className="remaining-text">
          {percentage >= 100 ? (
            <span className="over-budget-text">Exceeded by {formatCurrency(spent - limit)}</span>
          ) : (
            <span><strong>{formatCurrency(remaining)}</strong> left</span>
          )}
        </span>

        <div className="budget-card-actions">
          {onEditBudget && (
            <button
              className="btn-card-action btn-edit-subtle"
              onClick={() => onEditBudget(budget)}
              title="Edit Limit"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
          )}
          {onDeleteBudget && (
            <button
              className="btn-card-action btn-delete-subtle"
              onClick={() => onDeleteBudget(budget.id || budget._id)}
              title="Delete Budget"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
