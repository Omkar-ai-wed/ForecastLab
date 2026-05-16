import React, { useState, useEffect } from 'react';
import { Calendar, Target, ChevronRight, Info, Upload, BarChart3, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Scatter, ScatterChart, ZAxis, ComposedChart, Line, Legend } from 'recharts';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { Dataset, AnomalyResponse, AnomalyDataPoint } from '../types';

export const ExploreScreen: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDsId, setSelectedDsId] = useState<string>('');
  const [anomalyData, setAnomalyData] = useState<AnomalyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDsId) {
        setSelectedDsId(data[0].dataset_id);
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchExploreData = async () => {
    if (!selectedDsId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAnomalies(selectedDsId);
      setAnomalyData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze dataset');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDsId) {
      fetchExploreData();
    }
  }, [selectedDsId]);

  const selectedDs = datasets.find(d => d.dataset_id === selectedDsId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.25em]">
            Diagnostics <ChevronRight size={12} className="text-outline" /> <span className="text-secondary">Insight Engine</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-none">Data Explorer</h2>
        </div>
        
        <div className="relative flex-1 md:flex-none md:min-w-[280px]">
          <select 
            value={selectedDsId}
            onChange={(e) => setSelectedDsId(e.target.value)}
            aria-label="Select dataset"
            title="Select dataset"
            className="w-full bg-surface-dim border border-outline text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-secondary outline-none appearance-none cursor-pointer"
          >
            {datasets.length === 0 ? (
              <option value="">No datasets available</option>
            ) : (
              datasets.map(ds => (
                <option key={ds.dataset_id} value={ds.dataset_id}>{ds.original_filename}</option>
              ))
            )}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bento-card bg-surface-container/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Calendar size={20} /></div>
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Temporal Span</h3>
          </div>
          <p className="text-xl font-black text-white tabular-nums tracking-tighter">
            {selectedDs?.start_date ? `${selectedDs.start_date.split(' ')[0]} to ${selectedDs.end_date?.split(' ')[0]}` : '—'}
          </p>
        </div>
        <div className="bento-card text-center items-center justify-center bg-surface-container/10">
          <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3">Sampling Freq</div>
          <p className="text-4xl font-black text-white uppercase tracking-tighter">{selectedDs?.frequency || '—'}</p>
        </div>
        <div className="bento-card bg-surface-container/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Target size={20} /></div>
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Main Variable</h3>
          </div>
          <p className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg font-black text-xs text-emerald-400 uppercase tracking-widest">
            {selectedDs?.target_column || '—'}
          </p>
        </div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-3 pt-3">
          <div><h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">Behavioral Scan</h3></div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Anomaly Shield</span>
              <button aria-label="Toggle anomaly display" title="Toggle anomaly display" onClick={() => setShowAnomalies(!showAnomalies)} className={cn("w-10 h-5 rounded-full relative transition-all outline-none border border-outline", showAnomalies ? "bg-secondary border-transparent" : "bg-surface-container")}>
                <motion.div animate={{ x: showAnomalies ? 20 : 4 }} className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
              </button>
            </div>
            <button aria-label="Refresh data" title="Refresh data" onClick={fetchExploreData} className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-all">
              <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
        
        <div className="h-[450px] w-full relative p-4">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-dim/40 backdrop-blur-sm z-10">
              <RefreshCw size={40} className="text-secondary animate-spin mb-4" />
              <p className="text-xs font-black text-white uppercase tracking-widest">Mapping Core Logic...</p>
            </div>
          ) : !anomalyData ? (
            <div className="h-full w-full flex flex-col items-center justify-center opacity-40">
              <BarChart3 size={64} className="text-on-surface-variant mb-6" />
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">No Visual Buffer</h4>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest max-w-xs text-center leading-relaxed">
                Connect a dataset above to initialize the spatial visualization matrix.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={anomalyData.data || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={9} 
                  tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit' })}
                  minTickGap={40}
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
                <Legend iconType="circle" />
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--secondary)" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Signal"
                />
                
                {showAnomalies && (
                  <Scatter 
                    data={(anomalyData.data || []).filter((d: AnomalyDataPoint) => d.is_anomaly)} 
                    fill="#f43f5e" 
                    name="Anomalies" 
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Statistical Core</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Minimum', value: anomalyData?.stats?.min?.toFixed(2) },
            { label: 'Maximum', value: anomalyData?.stats?.max?.toFixed(2) },
            { label: 'Global Mean', value: anomalyData?.stats?.mean?.toFixed(2) },
            { label: 'Std Deviation', value: anomalyData?.stats?.std?.toFixed(2) },
          ].map((stat) => (
            <div key={stat.label} className="bento-card bg-surface-container/10">
              <p className="card-label text-[9px]!">{stat.label}</p>
              <p className="text-2xl font-black text-white tabular-nums tracking-tighter">
                {stat.value || '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
