import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getDashboardSummary, 
  getExpensesByCategory, 
  getTrends, 
  getRecentTransactions 
} from '../api/dashboard';
import { getBudgetsOverview } from '../api/budgets';
import { getGoals } from '../api/goals';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Target, PiggyBank, AlertCircle } from 'lucide-react';
import { SpendingForecastCard } from '../components/SpendingForecastCard';
import { AccountModal } from '../components/AccountModal';
import { BudgetModal } from '../components/BudgetModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666'];

export const Dashboard = () => {
  const [summary, setSummary] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>([]);
  const [trendData, setTrendData] = useState<any>([]);
  const [recentTx, setRecentTx] = useState<any>([]);
  const [budgets, setBudgets] = useState<any>([]);
  const [goals, setGoals] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [sum, cat, trends, tx, budg, gols] = await Promise.all([
        getDashboardSummary(),
        getExpensesByCategory(),
        getTrends(),
        getRecentTransactions(),
        getBudgetsOverview(currentMonth).catch(() => []),
        getGoals().catch(() => [])
      ]);
      setSummary(sum);
      setCategoryData(cat);
      setTrendData(trends);
      setRecentTx(tx);
      setBudgets(budg);
      setGoals(gols);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        onAccountAdded={fetchData} 
      />
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onBudgetAdded={fetchData}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
        <div className="flex gap-3">
          <Link 
            to="/recurring-expenses" 
            className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-lg shadow-sm transition-colors font-medium"
          >
            Recurring
          </Link>
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-sm transition-colors font-medium"
          >
            + Add Account
          </button>
          <Link 
            to="/transactions" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium"
          >
            View Transactions
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={20} /></div>
            <span className="font-medium">Total Balance</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">
            ${summary?.totalBalance?.toFixed(2) || '0.00'}
          </span>
        </div>

        <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ArrowUpRight size={20} /></div>
            <span className="font-medium">Total Income</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">
            ${summary?.totalIncome?.toFixed(2) || '0.00'}
          </span>
        </div>

        <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ArrowDownRight size={20} /></div>
            <span className="font-medium">Total Expense</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">
            ${summary?.totalExpense?.toFixed(2) || '0.00'}
          </span>
        </div>

        <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CreditCard size={20} /></div>
            <span className="font-medium">Net Savings</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">
            ${summary?.netSavings?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Spending Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="totalAmount" name="Expense" stroke="#0088FE" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Expenses by Category</h2>
          <div className="h-64 flex justify-center items-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="totalAmount"
                    nameKey="categoryName"
                  >
                    {categoryData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500">No expenses this month</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Budgets */}
        <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="text-blue-600" size={24} />
              <h2 className="text-lg font-bold text-slate-900">Monthly Budgets</h2>
            </div>
            <button 
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add
            </button>
          </div>
          
          <div className="space-y-6">
            {budgets.length > 0 ? budgets.slice(0, 4).map((b: any) => (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-900">{b.categoryName}</span>
                  <span className="text-slate-600">
                    ${b.actualSpent.toFixed(2)} / ${b.amount.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${b.isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${b.percentUsed}%` }}
                  ></div>
                </div>
                {b.isOverBudget && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Over budget by ${(b.actualSpent - b.amount).toFixed(2)}
                  </p>
                )}
              </div>
            )) : (
              <p className="text-slate-500 text-sm text-center py-4">No budgets set for this month.</p>
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <PiggyBank className="text-green-600" size={24} />
            <h2 className="text-lg font-bold text-slate-900">Savings Goals</h2>
          </div>
          
          <div className="space-y-6">
            {goals.length > 0 ? goals.slice(0, 4).map((g: any) => (
              <div key={g.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-900">{g.name}</span>
                  <span className="text-slate-600">
                    ${g.currentAmount.toFixed(2)} / ${g.targetAmount.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${g.isCompleted ? 'bg-green-500' : 'bg-green-400'}`}
                    style={{ width: `${g.progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {g.isCompleted ? 'Goal reached! 🎉' : `$${g.remainingAmount.toFixed(2)} remaining`}
                </p>
              </div>
            )) : (
              <p className="text-slate-500 text-sm text-center py-4">No savings goals created yet.</p>
            )}
          </div>
        </div>

        {/* Prediction Card */}
        <SpendingForecastCard />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow-sm border border-slate-200/60 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-700 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Account</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTx.length > 0 ? recentTx.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(tx.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {tx.description || (tx.type === 'TRANSFER' ? 'Transfer' : tx.type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {tx.type === 'TRANSFER' ? (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">Transfer</span>
                    ) : (
                      tx.category?.name || 'Uncategorized'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {tx.type === 'TRANSFER' 
                      ? `${tx.account.name} → ${tx.toAccount?.name}` 
                      : tx.account.name}
                  </td>
                  <td className={`px-6 py-4 text-sm font-semibold text-right ${
                    tx.type === 'INCOME' ? 'text-green-600' : tx.type === 'EXPENSE' ? 'text-slate-900' : 'text-blue-600'
                  }`}>
                    {tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}
                    ${Number(tx.amount).toFixed(2)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No recent transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
