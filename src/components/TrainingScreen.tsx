import React, { useState, useEffect } from 'react';
import { Database, Settings2, ChevronDown, ChevronUp, RotateCcw, Play, CheckCircle2, XCircle, Loader2, Download, BrainCircuit, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { Dataset, Model } from '../types';
import { useAppContext } from '../context/AppContext';

export const TrainingScreen: React.FC = () => {
  const { datasets, models, isLoading, refreshAll } = useAppContext();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dataset_id: datasets[0]?.dataset_id || '',
    model_type: 'ARIMA',
    validation_size: 30,
    forecast_horizon: 24,
    learning_rate: 0.001,
    epochs: 50,
    lookback_window: 72,
    hidden_size: 64,
    num_layers: 2
  });

  // Auto-select first dataset when datasets load
  useEffect(() => {
    if (datasets.length > 0 && !formData.dataset_id) {
      setFormData(prev => ({ ...prev, dataset_id: datasets[0].dataset_id }));
    }
  }, [datasets]);

  const handleStartTraining = async () => {
    if (!formData.dataset_id) {
      setError('Transmission Error: No source dataset selected.');
      return;
    }

    try {
      setIsTraining(true);
      setError(null);
      await api.trainModel({
        dataset_id: formData.dataset_id,
        model_type: formData.model_type,
        validation_size: formData.validation_size,
        forecast_horizon: formData.forecast_horizon,
        learning_rate: formData.learning_rate,
        epochs: formData.epochs,
        lookback_window: formData.lookback_window,
        hidden_size: formData.hidden_size,
        num_layers: formData.num_layers
      });
      await refreshAll();
    } catch (err: any) {
      setError(err.message || 'Processing Error: Training failed.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleReset = () => {
    setFormData({
      dataset_id: datasets[0]?.dataset_id || '',
      model_type: 'ARIMA',
      validation_size: 30,
      forecast_horizon: 24,
      learning_rate: 0.001,
      epochs: 50,
      lookback_window: 72,
      hidden_size: 64,
      num_layers: 2
    });
    setError(null);
  };

  const hasHistory = models.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">Neural Foundry</h2>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-60">Architect & Train Predictive Engines</p>
        </div>
        <button aria-label="Refresh data" title="Refresh data" onClick={refreshAll} className="bg-surface-dim border border-outline text-white p-3 rounded-xl hover:bg-surface-container transition-all">
          <RefreshCw size={20} className={cn(isLoading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 bento-card p-8! h-full gap-8">
          <div className="flex items-center gap-3 border-b border-outline pb-5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Foundry Config</h3>
          </div>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="card-label">Source Dataset</label>
              <div className="relative">
                <select 
                  value={formData.dataset_id} 
                  onChange={(e) => setFormData({ ...formData, dataset_id: e.target.value })}
                  aria-label="Select source dataset"
                  title="Select source dataset"
                  className="w-full bg-surface-container border border-outline text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary transition-all outline-none appearance-none cursor-pointer"
                >
                  {datasets.length === 0 ? (
                    <option value="">No datasets found</option>
                  ) : (
                    datasets.map(ds => (
                      <option key={ds.dataset_id} value={ds.dataset_id}>{ds.original_filename}</option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={16} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="card-label">Architecture</label>
              <div className="relative">
                <select 
                  value={formData.model_type}
                  onChange={(e) => setFormData({ ...formData, model_type: e.target.value })}
                  aria-label="Select model architecture"
                  title="Select model architecture"
                  className="w-full bg-surface-container border border-outline text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="ARIMA">ARIMA (Classical)</option>
                  <option value="PROPHET">PROPHET (Hybrid)</option>
                  <option value="LSTM">LSTM (Deep Recurrent)</option>
                  <option value="GRU">GRU (Efficient Recurrent)</option>
                  <option value="TRANSFORMER">TRANSFORMER (Attention-Based)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={16} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="card-label">Hold-out Size</label>
                <input 
                  value={formData.validation_size}
                  onChange={(e) => setFormData({ ...formData, validation_size: parseInt(e.target.value) || 0 })}
                  aria-label="Hold-out size"
                  title="Hold-out size"
                  className="w-full bg-surface-container border border-outline text-white rounded-xl px-4 py-3 text-sm font-black tabular-nums focus:ring-2 focus:ring-secondary transition-all outline-none" 
                  type="number" 
                />
              </div>
              <div className="space-y-2">
                <label className="card-label">Horizon (pts)</label>
                <input 
                  value={formData.forecast_horizon}
                  onChange={(e) => setFormData({ ...formData, forecast_horizon: parseInt(e.target.value) || 0 })}
                  aria-label="Forecast horizon points"
                  title="Forecast horizon points"
                  className="w-full bg-surface-container border border-outline text-white rounded-xl px-4 py-3 text-sm font-black tabular-nums focus:ring-2 focus:ring-secondary transition-all outline-none" 
                  type="number" 
                />
              </div>
            </div>

            <div className="border border-outline rounded-xl overflow-hidden bg-surface-dim transition-all">
              <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full px-5 py-4 flex justify-between items-center hover:bg-surface-container transition-colors group">
                <div className="flex items-center gap-2"><Settings2 size={16} className="text-secondary" /><span className="text-xs font-black text-white uppercase tracking-widest">Advanced Cores</span></div>
                {isAdvancedOpen ? <ChevronUp size={16} className="text-on-surface-variant" /> : <ChevronDown size={16} className="text-on-surface-variant" />}
              </button>
              <AnimatePresence>
                {isAdvancedOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-5 space-y-5 border-t border-outline bg-surface-container/20">
                      <div className="space-y-2">
                        <label className="card-label">Learning Velocity</label>
                        <input 
                          value={formData.learning_rate}
                          onChange={(e) => setFormData({ ...formData, learning_rate: parseFloat(e.target.value) || 0 })}
                          aria-label="Learning velocity"
                          title="Learning velocity"
                          className="w-full bg-surface-container border border-outline text-white rounded-xl px-4 py-3 text-sm font-black tabular-nums focus:ring-2 focus:ring-secondary transition-all outline-none" 
                          type="text" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="card-label">Epochs</label>
                          <input 
                            value={formData.epochs}
                            onChange={(e) => setFormData({ ...formData, epochs: parseInt(e.target.value) || 0 })}
                            aria-label="Number of epochs"
                            title="Number of epochs"
                            className="w-full bg-surface-container border border-outline text-white rounded-xl px-4 py-3 text-sm font-black tabular-nums focus:ring-2 focus:ring-secondary transition-all outline-none" 
                            type="number" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="card-label">Lookback</label>
                          <input 
                            value={formData.lookback_window}
                            onChange={(e) => setFormData({ ...formData, lookback_window: parseInt(e.target.value) || 0 })}
                            aria-label="Lookback window"
                            title="Lookback window"
                            className="w-full bg-surface-container border border-outline text-white rounded-xl px-4 py-3 text-sm font-black tabular-nums focus:ring-2 focus:ring-secondary transition-all outline-none" 
                            type="number" 
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="pt-6 flex flex-wrap gap-4">
              <button type="button" onClick={handleReset} className="flex-1 min-w-[100px] bg-surface-container border border-outline text-white font-bold py-3 rounded-xl hover:bg-surface-dim transition-all flex items-center justify-center gap-2 active:scale-95"><RotateCcw size={18} /> Reset</button>
              <button 
                type="button" 
                onClick={handleStartTraining} 
                disabled={isTraining || datasets.length === 0} 
                className={cn("flex-2 min-w-[180px] text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95", isTraining ? "bg-secondary text-white" : "bg-white hover:bg-opacity-90 shadow-white/10")}
              >
                {isTraining ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Play size={18} fill="currentColor" /> Ignite Foundry</>}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-8 space-y-8 h-full flex flex-col">
          <div className="bento-card relative overflow-hidden group p-8! bg-surface-container/10">
            <div className="absolute right-0 top-0 w-48 h-48 bg-secondary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl opacity-50" />
            <div className="z-10 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
                  <span className={cn("w-2 h-2 rounded-full", isTraining ? "bg-secondary animate-pulse" : "bg-on-surface-variant/30")} />
                  {isTraining ? 'Training in Progress' : 'Foundry Standby'}
                </h4>
                <p className="text-xs font-bold text-on-surface-variant mt-2 max-w-xs">
                  {isTraining ? 'Neural weights are being calculated across multiple parallel threads.' : 'Foundry is ready for new architecture definition. Select a source to begin.'}
                </p>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  {isTraining && (
                    <circle 
                      cx="40" cy="40" r="34" 
                      fill="transparent" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      strokeDasharray={213.6} 
                      strokeDashoffset={100} 
                      className="text-secondary animate-pulse" 
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                  {isTraining ? '---' : '0%'}
                </div>
              </div>
            </div>
          </div>

          <div className="bento-card p-0! shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-outline flex justify-between items-center bg-surface-dim">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Engine History</h3>
            </div>
            {!hasHistory && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 px-8">
                <BrainCircuit size={64} className="text-on-surface-variant/10 mb-6" />
                <h4 className="text-lg font-black text-white mb-2">No Engines Fabricated</h4>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest text-center max-w-xs opacity-60">
                  Complete your first training cycle to populate the foundry history.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline bg-surface-container/30">
                      <th className="py-5 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">Model ID</th>
                      <th className="py-5 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">Type</th>
                      <th className="py-5 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">Dataset</th>
                      <th className="py-5 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none text-right">RMSE</th>
                      <th className="py-5 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none text-right">MAPE</th>
                      <th className="py-5 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/50">
                    {models.map((model) => (
                      <tr key={model.model_id} className="hover:bg-white/5 transition-all group">
                        <td className="py-5 px-6 text-xs font-black text-white tabular-nums tracking-tighter">{model.model_id}</td>
                        <td className="py-5 px-6">
                          <span className="bg-surface-container border border-outline px-2 py-0.5 rounded-[4px] text-[9px] font-black tracking-widest uppercase text-secondary">
                            {model.model_type}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-xs font-bold text-on-surface-variant group-hover:text-white truncate max-w-[150px]">
                          {datasets.find(d => d.dataset_id === model.dataset_id)?.original_filename || model.dataset_id}
                        </td>
                        <td className="py-5 px-6 text-xs font-black tabular-nums text-right text-white tracking-tighter">
                          {model.metrics.rmse.toFixed(4)}
                        </td>
                        <td className="py-5 px-6 text-xs font-black tabular-nums text-right text-white tracking-tighter">
                          {model.metrics.mape.toFixed(2)}%
                        </td>
                        <td className="py-5 px-6 text-right">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                            {new Date(model.created_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>
);
