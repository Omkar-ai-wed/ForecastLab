import React, { useState, useEffect } from 'react';
import { Download, Activity, Zap, BarChart3, Percent, LineChart, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { Model, ForecastResponse } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine, Line
} from 'recharts';

export const ForecastResultScreen: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      const data = await api.getModels();
      setModels(data);
      if (data.length > 0 && !selectedModelId) {
        setSelectedModelId(data[0].model_id);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleGenerateForecast = async () => {
    if (!selectedModelId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getForecast(selectedModelId);
      setForecast(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate forecast');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedModelId) {
      handleGenerateForecast();
    }
  }, [selectedModelId]);

  const selectedModel = models.find(m => m.model_id === selectedModelId);

  const metrics = [
    { label: 'RMSE', value: selectedModel?.metrics.rmse.toFixed(4) || '—', icon: Activity },
    { label: 'MSE', value: selectedModel?.metrics.mse.toFixed(4) || '—', icon: Zap },
    { label: 'MAE', value: selectedModel?.metrics.mae.toFixed(4) || '—', icon: BarChart3 },
    { label: 'MAPE', value: selectedModel?.metrics.mape !== undefined ? `${selectedModel.metrics.mape.toFixed(2)}%` : '—', icon: Percent },
  ];

  const handleDownload = () => {
    if (selectedModelId) {
      window.open(api.getDownloadUrl(selectedModelId), '_blank');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.25em]">
            <span className={cn("flex h-2 w-2 rounded-full", forecast ? "bg-emerald-500 animate-pulse" : "bg-on-surface-variant/30")} />
            Status: {forecast ? 'Data Live' : 'Ready'}
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-none">Vision Nexus</h2>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest opacity-60">High-Fidelity Demand Projections</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:min-w-[240px]">
            <select 
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              aria-label="Select model"
              title="Select model"
              className="w-full bg-surface-dim border border-outline text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-secondary outline-none appearance-none cursor-pointer"
            >
              {models.length === 0 ? (
                <option value="">No models fabricated</option>
              ) : (
                models.map(m => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.model_type} : {m.model_id.split('-')[0]}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={!selectedModelId}
            className="bg-surface-dim border border-outline text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container transition-all shadow-sm disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bento-card group relative">
            <div className="absolute top-0 right-0 p-4 opacity-5"><metric.icon size={48} className="text-white" /></div>
            <h3 className="card-label mb-4 text-[10px]">{metric.label}</h3>
            <div className="text-2xl font-black text-white tabular-nums tracking-tighter mb-1">{metric.value}</div>
            <div className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant opacity-60">
              {metric.value === '—' ? 'Calculations pending' : 'Validated Metric'}
            </div>
          </div>
        ))}
      </div>

      <div className="bento-card !p-0 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-outline flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-dim/30">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Temporal Projection</h3>
            <p className="text-[10px] font-bold text-on-surface-variant mt-1 uppercase tracking-widest opacity-60">
              {selectedModel ? `Model: ${selectedModel.model_type} | Horizon: ${forecast?.forecast.length || '—'} points` : 'No model selected'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Historical</span></div>
            <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-secondary" /><span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Projection</span></div>
            <div className="flex items-center gap-2.5"><div className="w-4 h-1.5 rounded-sm bg-secondary/10 border border-secondary/20 border-dashed" /><span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Confidence Interval</span></div>
          </div>
        </div>
        
        <div className="p-8 h-[500px] w-full relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-dim/40 backdrop-blur-sm z-10">
              <RefreshCw size={40} className="text-secondary animate-spin mb-4" />
              <p className="text-xs font-black text-white uppercase tracking-widest">Synthesizing Vision...</p>
            </div>
          ) : !forecast ? (
            <div className="h-full w-full flex flex-col items-center justify-center opacity-40">
              <LineChart size={64} className="text-on-surface-variant mb-6" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Null Output</h4>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest max-w-xs text-center leading-relaxed">
                Execute a model selection above to render high-fidelity time-series projections.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...forecast.history.slice(-100), ...forecast.forecast]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={9} 
                  tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit' })}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={9} 
                  tickFormatter={(val) => val.toLocaleString()}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ color: 'white', fontWeight: 'bold' }}
                />
                
                {/* Confidence Interval */}
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="none" 
                  fill="var(--secondary)" 
                  fillOpacity={0.05} 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="none" 
                  fill="var(--secondary)" 
                  fillOpacity={0.05} 
                  connectNulls
                />
                
                {/* Historical Line */}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Historical"
                />
                
                {/* Forecast Line */}
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="var(--secondary)" 
                  strokeWidth={3} 
                  fill="url(#colorValue)" 
                  name="Forecast"
                  dot={false}
                />

                <ReferenceLine x={forecast.forecast[0]?.timestamp} stroke="var(--secondary)" strokeDasharray="3 3" label={{ value: 'Start Forecast', position: 'insideTopRight', fill: 'var(--secondary)', fontSize: 9, fontWeight: 'bold' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
