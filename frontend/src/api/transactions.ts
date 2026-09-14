import api from './axios';

export const getTransactions = async (params: any = {}) => {
  const response = await api.get('/transactions', { params });
  return response.data.data;
};

export const createTransaction = async (data: any) => {
  const response = await api.post('/transactions', data);
  return response.data.data.transaction;
};

export const updateTransaction = async (id: string, data: any) => {
  const response = await api.patch(`/transactions/${id}`, data);
  return response.data.data.transaction;
};

export const deleteTransaction = async (id: string) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data.data;
};
