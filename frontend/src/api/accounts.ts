import api from './axios';

export const getAccounts = async () => {
  const response = await api.get('/accounts');
  return response.data.data.accounts;
};

export const createAccount = async (data: any) => {
  const response = await api.post('/accounts', data);
  return response.data.data.account;
};
