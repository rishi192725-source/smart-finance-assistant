import { useEffect, useState } from 'react';
import { getRecurringExpenses, deleteRecurringExpense } from '../api/recurringExpenses';
import { Trash2, Plus, Calendar, Repeat } from 'lucide-react';
import { RecurringExpenseModal } from '../components/RecurringExpenseModal';
import { Link } from 'react-router-dom';

export const RecurringExpenses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const result = await getRecurringExpenses();
      setExpenses(result);
    } catch (error) {
      console.error('Failed to load recurring expenses', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to stop and delete this recurring expense?')) {
      try {
        await deleteRecurringExpense(id);
        fetchExpenses();
      } catch (error) {
        alert('Failed to delete expense');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Recurring Expenses</h1>
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
          >
            Back to Dashboard
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Recurring</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Account</th>
                  <th className="px-6 py-4 font-medium">Frequency</th>
                  <th className="px-6 py-4 font-medium">Next Run Date</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length > 0 ? expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {exp.description || 'Recurring Expense'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exp.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exp.account?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                        <Repeat size={14} />
                        <span className="capitalize">{exp.frequency.toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(exp.nextRunDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-gray-800">
                      ${Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No recurring expenses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <RecurringExpenseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExpenseAdded={fetchExpenses}
      />
    </div>
  );
};
