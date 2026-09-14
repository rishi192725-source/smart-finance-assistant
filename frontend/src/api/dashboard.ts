import api from './axios';

export const getDashboardSummary = async (params: any = {}) => {
  const response = await api.get('/dashboard/summary', { params });
  return response.data.data;
};

export const getExpensesByCategory = async (params: any = {}) => {
  const response = await api.get('/dashboard/expenses-by-category', { params });
  return response.data.data.expenses;
};

export const getTrends = async (params: any = {}) => {
  const response = await api.get('/dashboard/trends', { params });
  return response.data.data.trends;
};

export const getRecentTransactions = async () => {
  const response = await api.get('/dashboard/recent-transactions');
  return response.data.data.transactions;
};
