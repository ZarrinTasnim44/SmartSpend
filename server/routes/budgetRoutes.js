const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');

// Routes for /api/budgets
router.route('/')
  .get(getBudgets)
  .post(createBudget);

// Routes for /api/budgets/:id
router.route('/:id')
  .get(getBudgetById)
  .put(updateBudget)
  .delete(deleteBudget);

module.exports = router;
