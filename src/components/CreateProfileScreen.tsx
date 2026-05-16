import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, ChevronDown, ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CreateProfileScreenProps { onCancel: () => void; onSave: () => void; }

export const CreateProfileScreen: React.FC<CreateProfileScreenProps> = ({ onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', role: '', organization: '',
    defaultDataset: 'regional-demand', forecastHorizon: 30, modelType: 'transformer', timezone: 'UTC'
  });

  const [systemTimezone, setSystemTimezone] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) { setSystemTimezone(tz); setFormData(prev => ({ ...prev, timezone: tz })); }
    } catch (e) { console.warn('Failed to detect system timezone', e); }
  }, []);

  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isDirty) {
      setSaveStatus('saving');
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        console.log('Auto-saving profile:', formData);
        setSaveStatus('saved');
        setIsDirty(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      }, 2000);
    }
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [formData, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setIsDirty(true);
  };

  const handleCancelClick = () => {
    if (isDirty || saveStatus === 'saving') { setShowExitConfirm(true); } else { onCancel(); }
  };

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center py-12 px-6 overflow-x-hidden">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl bento-card p-12! shadow-2xl relative">
        <div className="absolute right-0 top-0 w-64 h-64 bg-secondary/5 rounded-full -translate-y-24 translate-x-24 blur-3xl" />
        <div className="absolute top-8 right-12 z-20 flex items-center gap-3">
          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.div key="saving" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2 text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">
                <Loader2 size={14} className="animate-spin" /> Auto-saving...
              </motion.div>
            )}
            {saveStatus === 'saved' && (
              <motion.div key="saved" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                <CheckCircle2 size={14} /> Changes saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-14 text-center space-y-4 relative z-10">
          <div className="inline-flex p-5 rounded-2xl bg-secondary/10 text-secondary mb-4 shadow-lg shadow-secondary/5"><UserIcon size={48} /></div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter leading-none">Create Your Profile</h1>
          <p className="text-on-surface-variant font-bold text-sm uppercase tracking-widest opacity-60">Configure your Studio OS user settings</p>
        </div>

        <form className="space-y-14 relative z-10" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <section className="space-y-10">
             <div className="flex items-center gap-4 border-b border-outline pb-4">
               <h2 className="text-xl font-black text-white tracking-tight uppercase">Basic Information</h2>
               <div className="h-0.5 flex-1 bg-outline/30" />
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-3">
                <label className="card-label" htmlFor="fullName">Full Name <span className="text-secondary opacity-50">*</span></label>
                <input value={formData.fullName} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold placeholder:text-on-surface-variant/40" id="fullName" placeholder="Jane Doe" required type="text" />
              </div>
              <div className="space-y-3">
                <label className="card-label" htmlFor="email">Email Address <span className="text-secondary opacity-50">*</span></label>
                <input value={formData.email} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold placeholder:text-on-surface-variant/40" id="email" placeholder="jane.doe@example.com" required type="email" />
              </div>
              <div className="space-y-3">
                <label className="card-label" htmlFor="role">Role</label>
                <div className="relative group">
                  <select value={formData.role} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline rounded-xl appearance-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold text-white cursor-pointer" id="role">
                    <option value="" disabled>Select a role...</option>
                    <option value="data-scientist">Data Scientist</option><option value="ml-engineer">ML Engineer</option><option value="data-analyst">Data Analyst</option><option value="business-user">Business User</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-secondary transition-colors pointer-events-none" size={20} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="card-label" htmlFor="organization">Organization <span className="text-on-surface-variant/40 font-normal normal-case italic">(Optional)</span></label>
                <input value={formData.organization} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold placeholder:text-on-surface-variant/40" id="organization" placeholder="e.g. Acme Corp" type="text" />
              </div>
            </div>
          </section>

          <section className="space-y-10">
            <div className="flex items-center gap-4 border-b border-outline pb-4">
               <h2 className="text-xl font-black text-white tracking-tight uppercase">Forecasting Preferences</h2>
               <div className="h-0.5 flex-1 bg-outline/30" />
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-3">
                <label className="card-label" htmlFor="defaultDataset">Default Dataset</label>
                <div className="relative group">
                  <select value={formData.defaultDataset} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline rounded-xl appearance-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold text-white cursor-pointer" id="defaultDataset">
                    <option value="global-energy">Global Energy Consumption</option><option value="regional-demand">Regional Power Demand</option><option value="renewables-output">Renewables Output</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-secondary transition-all pointer-events-none" size={20} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="card-label" htmlFor="forecastHorizon">Default Horizon (Days)</label>
                <input value={formData.forecastHorizon} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-black tabular-nums" id="forecastHorizon" min={1} type="number" />
              </div>
              <div className="space-y-3">
                <label className="card-label" htmlFor="modelType">Default Model Type</label>
                <div className="relative group">
                  <select value={formData.modelType} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline rounded-xl appearance-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold text-white cursor-pointer" id="modelType">
                    <option value="arima">ARIMA</option><option value="prophet">PROPHET</option><option value="lstm">LSTM</option><option value="gru">GRU</option><option value="transformer">TRANSFORMER</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-secondary transition-all pointer-events-none" size={20} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="card-label" htmlFor="timezone">Time Zone</label>
                <div className="relative group">
                  <select value={formData.timezone} onChange={handleChange} className="w-full px-5 py-4 bg-surface-container border border-outline rounded-xl appearance-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold text-white cursor-pointer" id="timezone">
                    {systemTimezone && <option value={systemTimezone}>{systemTimezone} (System)</option>}
                    <option value="UTC">UTC (Universal Coordinated Time)</option><option value="EST">EST (Eastern Standard Time)</option><option value="CST">CST (Central Standard Time)</option><option value="MST">MST (Mountain Standard Time)</option><option value="PST">PST (Pacific Standard Time)</option><option value="GMT">GMT (Greenwich Mean Time)</option><option value="CET">CET (Central European Time)</option><option value="IST">IST (India Standard Time)</option><option value="JST">JST (Japan Standard Time)</option><option value="AEST">AEST (Australian Eastern Standard Time)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-secondary transition-all pointer-events-none" size={20} />
                </div>
              </div>
            </div>
          </section>

          <div className="pt-10 flex flex-col sm:flex-row justify-end items-center gap-6">
            <button type="button" onClick={handleCancelClick} className="w-full sm:w-auto px-10 py-4 bg-surface-dim border border-outline text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-surface-container transition-all flex items-center justify-center gap-2 active:scale-95">Cancel</button>
            <button type="submit" className="w-full sm:w-auto px-12 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-opacity-90 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 active:scale-95"><Save size={18} /> Save Profile</button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitConfirm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-surface-dim w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 border border-outline p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full"><AlertCircle size={32} /></div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Unsaved Changes</h3>
                <p className="text-on-surface-variant font-medium">You have unsaved changes that will be lost if you leave. Wait for auto-save or save manually?</p>
                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <button onClick={() => setShowExitConfirm(false)} className="px-6 py-3 border border-outline rounded-xl font-bold text-white hover:bg-surface-container transition-colors">Stay here</button>
                  <button onClick={onCancel} className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all shadow-md active:scale-95">Discard</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
