import React, { useState, useEffect } from 'react';
import { X, Check, Target, Calendar } from 'lucide-react';
import './BudgetForm.css';

const BUDGET_CATEGORIES = [
  'Total',
  'Food',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Personal Care',
  'Travel',
  'Other'
];

export default function BudgetForm({ isOpen, onClose, onSave, editingBudget = null }) {
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  const [formData, setFormData] = useState({
    month: currentMonth,
    category: 'Total',
    limit: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        month: editingBudget.month || currentMonth,
        category: editingBudget.category || 'Total',
        limit: editingBudget.limit || ''
      });
    } else {
      setFormData({
        month: currentMonth,
        category: 'Total',
        limit: ''
      });
    }
    setError('');
    setIsSubmitting(false);
  }, [editingBudget, isOpen, currentMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const limitNum = parseFloat(formData.limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setError('Please enter a valid positive budget limit in ₹');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        ...formData,
        limit: limitNum
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{editingBudget ? 'Edit Monthly Budget' : 'Set New Monthly Budget'}</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="budget-form">
          <div className="form-group">
            <label htmlFor="budget-month">Target Month</label>
            <div className="input-with-icon">
              <Calendar size={18} className="field-icon" />
              <input
                id="budget-month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="budget-category">Budget Category</label>
            <div className="input-with-icon">
              <Target size={18} className="field-icon" />
              <select
                id="budget-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {BUDGET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Total' ? 'Total (Overall Monthly Cap)' : cat}
                  </option>
                ))}
              </select>
            </div>
            <span className="field-hint">
              {formData.category === 'Total' 
                ? 'Sets a spending ceiling for all expenses combined this month.' 
                : `Sets a ceiling specifically for ${formData.category} expenses.`}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="budget-limit">Budget Limit (₹)</label>
            <div className="input-with-currency">
              <span className="currency-symbol">₹</span>
              <input
                id="budget-limit"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 5000"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              <Check size={18} />
              <span>{isSubmitting ? 'Saving...' : editingBudget ? 'Update Budget' : 'Save Budget'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
