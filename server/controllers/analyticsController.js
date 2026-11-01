const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// Helper to calculate start and end dates for a given month (YYYY-MM)
const getMonthDateRange = (monthStr) => {
  let year, monthNum;
  if (monthStr && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr)) {
    [year, monthNum] = monthStr.split('-').map(Number);
  } else {
    const now = new Date();
    year = now.getFullYear();
    monthNum = now.getMonth() + 1;
    monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
  }

  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

  return { startDate, endDate, formattedMonth: monthStr };
};

// @desc    Get monthly summary, category breakdown, and budget alerts
// @route   GET /api/analytics/monthly-summary
const getMonthlySummary = async (req, res) => {
  try {
    const { month } = req.query;
    const { startDate, endDate, formattedMonth } = getMonthDateRange(month);

    // 1. Fetch expenses for the month
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate }
    });

    // 2. Calculate total monthly spending and category breakdown
    let totalSpent = 0;
    const categoryTotals = {};

    expenses.forEach((item) => {
      totalSpent += item.amount;
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });

    // Format category spending list
    const categoryBreakdown = Object.keys(categoryTotals).map((cat) => ({
      category: cat,
      totalSpent: Number(categoryTotals[cat].toFixed(2)),
      percentage: totalSpent > 0 ? Number(((categoryTotals[cat] / totalSpent) * 100).toFixed(1)) : 0
    }));

    // 3. Fetch budgets set for this month
    const budgets = await Budget.find({ month: formattedMonth });

    // 4. Calculate budget usage and generate 80% and 100% alerts
    const alerts = [];
    const budgetProgress = budgets.map((b) => {
      // If budget is for 'Total', compare against total monthly spending; otherwise against that specific category
      const spent = b.category === 'Total' ? totalSpent : (categoryTotals[b.category] || 0);
      const percentageUsed = b.limit > 0 ? Number(((spent / b.limit) * 100).toFixed(1)) : 0;

      let status = 'OK'; // 'OK' | 'WARNING' (>= 80%) | 'CRITICAL' (>= 100%)

      if (percentageUsed >= 100) {
        status = 'CRITICAL';
        alerts.push({
          level: 'critical',
          category: b.category,
          message: `Critical Alert: You have reached or exceeded 100% of your ${b.category} budget! (Spent: ₹${spent.toFixed(2)} / Budget: ₹${b.limit})`
        });
      } else if (percentageUsed >= 80) {
        status = 'WARNING';
        alerts.push({
          level: 'warning',
          category: b.category,
          message: `Warning: You have used ${percentageUsed}% of your ${b.category} budget! (Spent: ₹${spent.toFixed(2)} / Budget: ₹${b.limit})`
        });
      }

      return {
        id: b._id,
        category: b.category,
        limit: b.limit,
        spent: Number(spent.toFixed(2)),
        remaining: Number(Math.max(0, b.limit - spent).toFixed(2)),
        percentageUsed,
        status
      };
    });

    res.status(200).json({
      success: true,
      month: formattedMonth,
      totalSpent: Number(totalSpent.toFixed(2)),
      expenseCount: expenses.length,
      categoryBreakdown,
      budgetProgress,
      alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Compare spending across months (for bar charts / trendlines)
// @route   GET /api/analytics/monthly-comparison
const getMonthlyComparison = async (req, res) => {
  try {
    // Group all expenses by year-month and sum the amount
    const comparison = await Expense.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }, // Chronological order
      {
        $project: {
          _id: 0,
          month: '$_id',
          totalSpent: { $round: ['$totalSpent', 2] },
          count: 1
        }
      }
    ]);

    res.status(200).json({ success: true, count: comparison.length, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMonthlySummary,
  getMonthlyComparison
};
