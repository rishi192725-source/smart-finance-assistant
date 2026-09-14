import { useEffect, useState, useRef } from 'react';
import { getTransactions, deleteTransaction } from '../api/transactions';
import { Search, Filter, Trash2, Edit, Upload } from 'lucide-react';
import { TransactionModal } from '../components/TransactionModal';
import { uploadReceiptOcr, getOcrJobStatus } from '../api/ml';

export const Transactions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const [ocrStatus, setOcrStatus] = useState('');
  const [initialTxData, setInitialTxData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Invalid file format. Please upload JPG, PNG, or WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setOcrStatus('Uploading...');
    try {
      const { jobId } = await uploadReceiptOcr(file);
      setOcrStatus('Processing receipt...');
      
      const pollInterval = setInterval(async () => {
        try {
          const status = await getOcrJobStatus(jobId);
          if (status.state === 'completed') {
            clearInterval(pollInterval);
            setOcrStatus('Draft ready');
            setTimeout(() => setOcrStatus(''), 2000);
            
            const result = status.result;
            setInitialTxData({
              amount: result.amount || '',
              description: result.merchant || '',
              date: result.date || '',
            });
            setIsModalOpen(true);
          } else if (status.state === 'failed') {
            clearInterval(pollInterval);
            setOcrStatus('Unable to process receipt. Please try again.');
            setTimeout(() => setOcrStatus(''), 3000);
          } else {
            setOcrStatus('Reading receipt...');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setOcrStatus('Unable to process receipt. Please try again.');
          setTimeout(() => setOcrStatus(''), 3000);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setOcrStatus('Unable to process receipt. Please try again.');
      setTimeout(() => setOcrStatus(''), 3000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const result = await getTransactions({
        page,
        limit: 10,
        search,
        type: type || undefined,
      });
      setTransactions(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, search, type]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        fetchTransactions();
      } catch (error) {
        alert('Failed to delete transaction');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
        <div className="flex items-center gap-4">
          {ocrStatus && <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{ocrStatus}</span>}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/jpeg,image/png,image/webp"
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={!!ocrStatus && ocrStatus !== 'Draft ready' && !ocrStatus.includes('Unable')}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">Upload Receipt</span>
          </button>
          
          <button 
            onClick={() => { setInitialTxData(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            Add Transaction
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="bg-transparent outline-none text-gray-700 text-sm"
            >
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
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
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Account</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length > 0 ? transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tx.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {tx.description || (tx.type === 'TRANSFER' ? 'Transfer' : tx.type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tx.type === 'TRANSFER' ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">Transfer</span>
                      ) : (
                        tx.category?.name || 'Uncategorized'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tx.type === 'TRANSFER' 
                        ? `${tx.account.name} → ${tx.toAccount?.name}` 
                        : tx.account.name}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold text-right ${
                      tx.type === 'INCOME' ? 'text-green-600' : tx.type === 'EXPENSE' ? 'text-gray-800' : 'text-blue-600'
                    }`}>
                      {tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}
                      ${Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="border-t border-gray-100 p-4 flex justify-between items-center bg-gray-50">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {meta.totalPages}
            </span>
            <button 
              disabled={page === meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={fetchTransactions}
        initialData={initialTxData}
      />
    </div>
  );
};
