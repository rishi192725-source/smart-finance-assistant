import { useState, useEffect } from 'react';
import { createGoal } from '../api/goals';

export const GoalModal = ({ isOpen, onClose, onGoalAdded }: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        targetAmount: '',
        deadline: '',
      });
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
      };

      if (formData.deadline) {
        payload.deadline = new Date(formData.deadline).toISOString();
      }

      await createGoal(payload);
      onGoalAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add savings goal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Add Savings Goal</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="e.g. New Car, Vacation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date (Optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
