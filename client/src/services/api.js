// api.js - Centralized API client for SmartSpend backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to make API requests with unified error handling and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Expenses API
  getExpenses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/expenses?${query}` : '/expenses';
    const res = await request(endpoint);
    return res.data || [];
  },

  getExpenseById: async (id) => {
    const res = await request(`/expenses/${id}`);
    return res.data;
  },

  createExpense: async (expenseData) => {
    const res = await request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    return res.data;
  },

  updateExpense: async (id, expenseData) => {
    const res = await request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
    return res.data;
  },

  deleteExpense: async (id) => {
    const res = await request(`/expenses/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  // Budgets API
  getBudgets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/budgets?${query}` : '/budgets';
    const res = await request(endpoint);
    return res.data || [];
  },

  createBudget: async (budgetData) => {
    const res = await request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
    return res.data;
  },

  updateBudget: async (id, budgetData) => {
    const res = await request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
    return res.data;
  },

  deleteBudget: async (id) => {
    const res = await request(`/budgets/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  // Analytics API
  // Returns: { month, totalSpent, expenseCount, categoryBreakdown, budgetProgress, alerts }
  getMonthlySummary: async (month) => {
    const query = month ? `?month=${month}` : '';
    const res = await request(`/analytics/monthly-summary${query}`);
    // Server returns data at top level (not nested under .data)
    return res;
  },

  // Returns array of { month, totalSpent, count }
  getMonthlyComparison: async () => {
    const res = await request('/analytics/monthly-comparison');
    return res.data || [];
  },
};

export default api;
