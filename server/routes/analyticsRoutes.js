const express = require('express');
const router = express.Router();
const {
  getMonthlySummary,
  getMonthlyComparison
} = require('../controllers/analyticsController');

// Summary of current or selected month (totals, category breakdown, 80% and 100% budget alerts)
router.get('/monthly-summary', getMonthlySummary);

// Comparison data across months for trend analysis and bar charts
router.get('/monthly-comparison', getMonthlyComparison);

module.exports = router;
