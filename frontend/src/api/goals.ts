import api from './axios';

export const getGoals = async () => {
  const response = await api.get('/goals');
  return response.data.data.goals;
};

export const createGoal = async (data: any) => {
  const response = await api.post('/goals', data);
  return response.data.data.goal;
};

export const addContribution = async (id: string, amount: number) => {
  const response = await api.post(`/goals/${id}/contributions`, { amount });
  return response.data.data.goal;
};
