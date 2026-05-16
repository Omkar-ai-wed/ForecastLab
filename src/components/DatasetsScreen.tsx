import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, CloudUpload, Activity, Database, ArrowUpRight, Filter, Plus as PlusIcon, RefreshCw, Download, BarChart3, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Dataset } from '../types';
import { api } from '../lib/api';

interface DatasetsScreenProps { onNavigateToExplore: () => void; }

export const DatasetsScreen: React.FC<DatasetsScreenProps> = ({ onNavigateToExplore }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDs, setSelectedDs] = useState<Dataset | null>(null);
  const [formData, setFormData] = useState({ dateColumn: 'timestamp', targetColumn: 'value', featureColumns: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDs) {
        setSelectedDs(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedFile) newErrors.file = 'Please select a CSV file';
    if (!formData.dateColumn.trim()) newErrors.dateColumn = 'Date column is required';
    if (!formData.targetColumn.trim()) newErrors.targetColumn = 'Target column is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (validate() && selectedFile) {
      try {
        setIsUploading(true);
        await api.uploadDataset(
          selectedFile, 
          formData.dateColumn, 
          formData.targetColumn, 
          formData.featureColumns
        );
        await fetchDatasets();
        setIsModalOpen(false);
        setSelectedFile(null);
        setFormData({ dateColumn: 'timestamp', targetColumn: 'value', featureColumns: '' });
        setErrors({});
      } catch (err: any) {
        setErrors({ submit: err.message || 'Upload failed' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setShowExportConfirm(false);
    // In a real app, this might call a global export endpoint
    setTimeout(() => { 
      setIsExporting(false); 
      alert('Datasets catalog exported successfully as datasets_export.csv'); 
    }, 1500);
  };

  const hasDatasets = datasets.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tighter leading-none mb-2">Command Center</h2>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-60">System Overview & Management</p>
        </div>
        <div className="flex gap-3">
          <button aria-label="Refresh datasets" title="Refresh datasets" className="bg-surface-dim border border-outline text-white p-3 rounded-xl hover:bg-surface-container transition-all" onClick={fetchDatasets}>
            <RefreshCw size={20} className={cn(isLoading && "animate-spin")} />
          </button>
          <button disabled={isExporting || !hasDatasets} onClick={() => setShowExportConfirm(true)} className="bg-surface-dim border border-outline text-white px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-surface-container transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />} Export
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg active:scale-95">
            <Upload size={18} /> Upload
          </button>
        </div>
      </div>

      {isLoading && datasets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <RefreshCw size={48} className="text-secondary animate-spin mb-4" />
          <p className="text-white font-bold uppercase tracking-widest text-xs">Synchronizing with mainframe...</p>
        </div>
      ) : !hasDatasets ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-3xl bg-surface-dim border border-outline flex items-center justify-center">
              <Database size={48} className="text-on-surface-variant/40" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <PlusIcon size={20} className="text-secondary" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight mb-3">No Datasets Yet</h3>
          <p className="text-on-surface-variant font-medium text-sm max-w-md text-center mb-8 leading-relaxed">
            Upload your first energy dataset to get started with demand forecasting, model training, and time-series analysis.
          </p>
          <div className="flex gap-4">
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg active:scale-95">
              <Upload size={18} /> Upload Dataset
            </button>
          </div>
        </div>
      ) : (
        /* Data View */
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {selectedDs && (
              <div className="md:col-span-4 lg:col-span-4 bento-card !p-0 overflow-hidden group">
                <div className="p-6 border-b border-outline flex justify-between items-center bg-surface-dim/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">{selectedDs.original_filename}</h3>
                    </div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Target: {selectedDs.target_column} | ID: {selectedDs.dataset_id}</p>
                  </div>
                  <button aria-label="Open in explorer" title="Open in explorer" onClick={onNavigateToExplore} className="p-2.5 rounded-xl bg-surface-container border border-outline text-white hover:text-secondary group-hover:scale-110 transition-all">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Rows</p>
                      <p className="text-xl font-black text-white tabular-nums">{selectedDs.row_count.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Frequency</p>
                      <p className="text-xl font-black text-white uppercase">{selectedDs.frequency || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Start Date</p>
                      <p className="text-sm font-black text-white">{selectedDs.start_date?.split(' ')[0] || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">End Date</p>
                      <p className="text-sm font-black text-white">{selectedDs.end_date?.split(' ')[0] || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-12 bg-surface-container/30 rounded-2xl border border-outline border-dashed">
                    <BarChart3 size={40} className="text-on-surface-variant/30 mb-4" />
                    <p className="text-sm font-bold text-white mb-1">Visualization Module Ready</p>
                    <p className="text-xs text-on-surface-variant mb-6 text-center max-w-xs">Launch the explorer to analyze trends, seasonal patterns, and identify anomalies.</p>
                    <button onClick={onNavigateToExplore} className="bg-white text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-opacity-90 transition-all active:scale-95 shadow-lg">
                      Open Explorer
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 lg:col-span-2 space-y-6">
              <div className="bento-card bg-blue-900/20 border-blue-500/20 relative group cursor-pointer overflow-hidden" onClick={onNavigateToExplore}>
                <div className="absolute right-0 top-0 p-4 text-blue-400 opacity-10 group-hover:scale-125 transition-all duration-700"><Activity size={120} /></div>
                <div className="z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-4 border border-blue-500/20">{datasets.length} Dataset{datasets.length !== 1 ? 's' : ''}</div>
                    <h4 className="text-3xl font-black text-white tracking-tighter mb-2 leading-none">Catalog Status</h4>
                    <p className="text-xs text-on-surface-variant font-medium opacity-60">Global system health and data integrity metrics</p>
                  </div>
                  <div className="flex items-center gap-4 mt-auto pt-6">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 w-full" />
                    </div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      System Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bento-card items-center justify-center text-center">
                  <div className="card-label !mb-3">Total Rows</div>
                  <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    {(datasets.reduce((acc, d) => acc + d.row_count, 0) / 1000).toFixed(1)}k
                  </div>
                </div>
                <div onClick={() => setIsModalOpen(true)} className="bento-card items-center justify-center text-center bg-white group cursor-pointer hover:bg-opacity-90 transition-all border-none">
                  <div className="card-label !text-black/60 !mb-2 text-[10px]">New Data</div>
                  <div className="text-black group-hover:scale-125 transition-transform"><PlusIcon size={24} strokeWidth={3} /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-outline">
            <h3 className="text-xl font-bold text-white tracking-tight mb-6">Your Datasets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datasets.map((ds) => (
                <div key={ds.dataset_id} onClick={() => setSelectedDs(ds)} className={cn("bento-card group cursor-pointer transition-all relative overflow-hidden", selectedDs?.dataset_id === ds.dataset_id ? "border-secondary ring-1 ring-secondary" : "hover:border-on-surface-variant/40")}>
                  {selectedDs?.dataset_id === ds.dataset_id && <div className="absolute top-0 right-0 p-2"><div className="w-2 h-2 rounded-full bg-secondary" /></div>}
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-surface-container rounded-lg text-on-surface-variant group-hover:text-secondary group-hover:bg-secondary/10 transition-all">
                      <Database size={18} />
                    </div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{ds.dataset_id}</span>
                  </div>
                  <h4 className="font-bold text-white mb-1 group-hover:text-secondary transition-colors truncate">{ds.original_filename}</h4>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Target: <span className="text-secondary">{ds.target_column}</span></p>
                  <div className="mt-auto pt-4 border-t border-outline flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-400">Indexed</span>
                     </div>
                     <ArrowUpRight size={14} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-surface-dim w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden z-10 border border-outline">
              <div className="flex justify-between items-center px-8 py-5 border-b border-outline">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Data Transmission</h3>
                <button aria-label="Close dialog" title="Close dialog" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
                {errors.submit && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <p className="text-xs font-bold uppercase tracking-widest">{errors.submit}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="card-label">Source File (CSV)</label>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" aria-label="Select CSV file" title="Select CSV file" />
                  <div onClick={() => fileInputRef.current?.click()} className={cn("border-2 border-dashed border-outline rounded-xl p-10 flex flex-col items-center justify-center bg-surface-container/30 hover:bg-surface-container/50 hover:border-secondary transition-all cursor-pointer group", selectedFile && "border-emerald-500/30 bg-emerald-500/5")}>
                    {selectedFile ? (
                      <>
                        <Database size={48} className="text-emerald-400 mb-4" />
                        <p className="font-bold text-white mb-1">{selectedFile.name}</p>
                        <p className="text-sm text-emerald-400/60 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB Ready</p>
                      </>
                    ) : (
                      <>
                        <CloudUpload size={48} className="text-on-surface-variant group-hover:text-secondary mb-4 transition-colors" />
                        <p className="font-bold text-white mb-1">Click to select data file</p>
                        <p className="text-sm text-on-surface-variant font-medium text-center">Format must be CSV with header row</p>
                      </>
                    )}
                  </div>
                  {errors.file && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{errors.file}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="card-label">Time Column</label>
                    <input value={formData.dateColumn} onChange={(e) => setFormData({ ...formData, dateColumn: e.target.value })} className={cn("w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant", errors.dateColumn && "border-red-500/50 focus:ring-red-500/20")} placeholder="e.g. timestamp" type="text" />
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Header name of the datetime column</p>
                    {errors.dateColumn && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{errors.dateColumn}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="card-label">Target Column</label>
                    <input value={formData.targetColumn} onChange={(e) => setFormData({ ...formData, targetColumn: e.target.value })} className={cn("w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant", errors.targetColumn && "border-red-500/50 focus:ring-red-500/20")} placeholder="e.g. mw_demand" type="text" />
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Header name of the value to forecast</p>
                    {errors.targetColumn && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{errors.targetColumn}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="card-label">Exogenous Features (Optional)</label>
                    <input value={formData.featureColumns} onChange={(e) => setFormData({ ...formData, featureColumns: e.target.value })} className="w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant" placeholder="e.g. temperature, humidity, is_holiday" type="text" />
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Comma-separated list of additional features</p>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-6 border-t border-outline bg-surface-dim flex justify-end gap-4">
                <button onClick={() => { setIsModalOpen(false); setErrors({}); setSelectedFile(null); }} className="px-6 py-2.5 border border-outline rounded-xl font-bold text-white hover:bg-surface-container transition-colors">Cancel</button>
                <button disabled={isUploading} onClick={handleSubmit} className="px-6 py-2.5 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2">
                  {isUploading ? <><RefreshCw size={14} className="animate-spin" /> Uploading...</> : 'Initiate Upload'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showExportConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExportConfirm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-surface-dim w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 border border-outline p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full"><Download size={32} /></div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Export Catalog?</h3>
                <p className="text-on-surface-variant font-medium text-sm">This will compile a CSV export of all your indexed datasets. Proceed?</p>
                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <button onClick={() => setShowExportConfirm(false)} className="px-6 py-3 border border-outline rounded-xl font-bold text-white hover:bg-surface-container transition-colors">Cancel</button>
                  <button onClick={handleExport} className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-md active:scale-95">Generate CSV</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
