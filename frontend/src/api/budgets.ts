import api from './axios';

export const getBudgetsOverview = async (month: string) => {
  const response = await api.get('/budgets/overview', { params: { month } });
  return response.data.data.overview;
};

export const createBudget = async (data: any) => {
  const response = await api.post('/budgets', data);
  return response.data.data.budget;
};
