const mongoose = require('mongoose');

// Allowed categories for expenses
const CATEGORIES = [
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

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category'
      },
      default: 'Other',
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true // Automatically creates createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
