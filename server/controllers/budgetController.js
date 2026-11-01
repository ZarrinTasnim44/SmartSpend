const Budget = require('../models/Budget');

// @desc    Get all budgets (with optional month filter)
// @route   GET /api/budgets
const getBudgets = async (req, res) => {
  try {
    const { month } = req.query;
    let query = {};

    if (month) {
      query.month = month;
    }

    const budgets = await Budget.find(query).sort({ month: -1, category: 1 });
    res.status(200).json({ success: true, count: budgets.length, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single budget by ID
// @route   GET /api/budgets/:id
const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new budget
// @route   POST /api/budgets
const createBudget = async (req, res) => {
  try {
    const { month, category, limit } = req.body;

    if (!month || !limit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both month (YYYY-MM) and budget limit'
      });
    }

    const budget = await Budget.create({
      month,
      category: category || 'Total',
      limit
    });

    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    // Check if error is duplicate key (code 11000) for unique compound index (month + category)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A budget for this category and month already exists. You can edit it instead.'
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A budget for this category and month already exists.'
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
};
