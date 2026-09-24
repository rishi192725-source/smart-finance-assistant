import api from './index';

export const getRecurringExpenses = async () => {
  const response = await api.get('/recurring-expenses');
  return response.data.data.recurringExpenses;
};

export const createRecurringExpense = async (data: any) => {
  const response = await api.post('/recurring-expenses', data);
  return response.data.data.recurringExpense;
};

export const updateRecurringExpense = async (id: string, data: any) => {
  const response = await api.put(`/recurring-expenses/${id}`, data);
  return response.data.data.recurringExpense;
};

export const deleteRecurringExpense = async (id: string) => {
  const response = await api.delete(`/recurring-expenses/${id}`);
  return response.data;
};
