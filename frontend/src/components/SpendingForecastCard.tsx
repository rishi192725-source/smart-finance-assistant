import { useState, useEffect, useCallback } from 'react';
import { getSpendingPrediction } from '../api/ml';
import api from '../api/axios';
import { TrendingUp, TrendingDown, Info, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const SpendingForecastCard = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [prediction, setPrediction] = useState<number | null>(null);
  const [reason, setReason] = useState<string>('');
  const [trendSlope, setTrendSlope] = useState<number | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSpendingPrediction(selectedCategory || undefined);
      setPrediction(data.prediction);
      setReason(data.reason);
      setTrendSlope(data.trend_slope ?? null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch prediction');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return (
    <div className="bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="text-blue-500" size={20} />
          Spending Forecast
        </h2>
        <div className="flex items-center gap-3">
          <select 
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Overall Spending</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button 
            onClick={fetchPrediction}
            disabled={loading}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh Forecast"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-8">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm">Analyzing historical data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button 
              onClick={fetchPrediction}
              className="mt-2 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        ) : reason === 'INSUFFICIENT_HISTORY' ? (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Info size={24} />
            </div>
            <h3 className="text-blue-900 font-medium mb-1">Need More Data</h3>
            <p className="text-blue-700 text-sm">
              We need at least 2 months of expense history to forecast your future spending.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-1">Predicted Next Month</p>
            <div className="text-3xl font-extrabold text-slate-950 mb-4">
              ${prediction?.toFixed(2) || '0.00'}
            </div>
            
            {trendSlope !== null && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                trendSlope > 0 ? 'bg-red-50 text-red-600' : 
                trendSlope < 0 ? 'bg-green-50 text-green-600' : 
                'bg-slate-100 text-slate-600'
              }`}>
                {trendSlope > 0 ? <TrendingUp size={16} /> : 
                 trendSlope < 0 ? <TrendingDown size={16} /> : 
                 <TrendingUp size={16} className="text-slate-400" />}
                
                {trendSlope > 0 ? `Trending up +$${trendSlope.toFixed(2)}/mo` : 
                 trendSlope < 0 ? `Trending down -$${Math.abs(trendSlope).toFixed(2)}/mo` : 
                 'Stable spending trend'}
              </div>
            )}
            
            <p className="text-xs text-slate-400 mt-6 mt-auto">
              Based on a 3-month weighted moving average & linear momentum.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
