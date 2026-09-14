import { useState, useEffect } from 'react';
import api from '../api/axios';
import { createTransaction } from '../api/transactions';

export const TransactionModal = ({ isOpen, onClose, onTransactionAdded, initialData }: any) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    accountId: '',
    categoryId: '',
    toAccountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      fetchAccountsAndCategories();
      setFormData({
        type: 'EXPENSE',
        amount: initialData?.amount || '',
        description: initialData?.description || '',
        accountId: '',
        categoryId: '',
        toAccountId: '',
        transactionDate: initialData?.date || new Date().toISOString().split('T')[0],
      });
      setError('');
    }
  }, [isOpen, initialData]);

  const fetchAccountsAndCategories = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setAccounts(accRes.data.data.accounts || accRes.data.data); // Adjust depending on your actual API response structure
      setCategories(catRes.data.data.categories || catRes.data.data);
    } catch (err) {
      console.error('Failed to fetch form data', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        accountId: formData.accountId,
        transactionDate: new Date(formData.transactionDate).toISOString(),
      };

      if (formData.type === 'TRANSFER') {
        payload.toAccountId = formData.toAccountId;
      } else {
        payload.categoryId = formData.categoryId;
      }

      await createTransaction(payload);
      onTransactionAdded();
      onClose();
      // Reset form
      setFormData({
        type: 'EXPENSE',
        amount: '',
        description: '',
        accountId: '',
        categoryId: '',
        toAccountId: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="e.g. Groceries"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select Account</option>
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name} (${Number(acc.balance).toFixed(2)})</option>
              ))}
            </select>
          </div>

          {formData.type === 'TRANSFER' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
              <select
                required
                value={formData.toAccountId}
                onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2"
                disabled={accounts.length <= 1}
              >
                <option value="">
                  {accounts.length <= 1 ? "No other accounts available" : "Select Destination Account"}
                </option>
                {accounts.filter(a => a.id !== formData.accountId).map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name} (${Number(acc.balance).toFixed(2)})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">Select Category</option>
                {categories.filter(c => c.type === formData.type).map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
