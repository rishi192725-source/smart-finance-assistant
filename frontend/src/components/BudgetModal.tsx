import { useState, useEffect } from 'react';
import api from '../api/axios';
import { createBudget } from '../api/budgets';

export const BudgetModal = ({ isOpen, onClose, onBudgetAdded }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setFormData({
        categoryId: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
      });
      setError('');
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const catRes = await api.get('/categories');
      setCategories(catRes.data.data.categories || catRes.data.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        month: formData.month,
      };

      await createBudget(payload);
      onBudgetAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add budget');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Set Monthly Budget</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select Category</option>
              {categories.filter(c => c.type === 'EXPENSE').map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              required
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

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
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
