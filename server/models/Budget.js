const mongoose = require('mongoose');

// Allowed categories for budgets ('Total' represents an overall monthly cap)
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

const budgetSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format (e.g., 2026-10)'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Budget category is required'],
      enum: {
        values: BUDGET_CATEGORIES,
        message: '{VALUE} is not a valid category'
      },
      default: 'Total',
      trim: true
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [1, 'Budget limit must be at least 1']
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate budget entries for the same month and category
budgetSchema.index({ month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
