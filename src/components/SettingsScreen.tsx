import React, { useState } from 'react';
import {
  Settings2,
  Cog,
  Bell,
  HardDrive,
  Shield,
  ChevronDown,
  Plus,
  Globe,
  Clock,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ApiProvider } from '../types';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'general' | 'api' | 'notifications' | 'storage' | 'security';

const settingsTabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General Settings', icon: Settings2 },
  { id: 'api', label: 'API Configuration', icon: Cog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'storage', label: 'Storage & Usage', icon: HardDrive },
  { id: 'security', label: 'Security', icon: Shield },
];

export const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // General Settings state
  const [language, setLanguage] = useState('en-US');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD HH:mm:ss');
  const [autoSaveFreq, setAutoSaveFreq] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // API Configuration state
  const [baseApiUrl, setBaseApiUrl] = useState('https://api.forecastlab.internal/v2/');
  const [apiProviders, setApiProviders] = useState<ApiProvider[]>([]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', key: '' });

  const handleSaveGeneral = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  const handleAddProvider = () => {
    if (newProvider.name.trim() && newProvider.key.trim()) {
      const masked = '••••••••••••••••••••' + newProvider.key.slice(-4);
      setApiProviders(prev => [...prev, {
        id: `prov-${Date.now()}`,
        name: newProvider.name,
        apiKeyMasked: masked,
        status: 'Active',
      }]);
      setNewProvider({ name: '', key: '' });
      setShowAddKey(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-8">
            {/* General Settings Card */}
            <div className="bento-card !p-8">
              <div className="flex items-center gap-3 mb-2">
                <Settings2 size={22} className="text-secondary" />
                <h3 className="text-xl font-bold text-white tracking-tight">General Settings</h3>
              </div>
              <p className="text-sm text-on-surface-variant font-medium mb-8">Configure basic system behaviors.</p>
              <div className="border-t border-outline pt-8" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-3">
                  <label className="card-label" htmlFor="systemLanguage">System Language</label>
                  <div className="relative group">
                    <select
                      id="systemLanguage"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none appearance-none cursor-pointer font-bold text-sm"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="ja">日本語</option>
                      <option value="hi">हिन्दी</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-secondary transition-colors pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="card-label" htmlFor="dateFormat">Date/Time Format</label>
                  <div className="relative group">
                    <select
                      id="dateFormat"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none appearance-none cursor-pointer font-bold text-sm"
                    >
                      <option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</option>
                      <option value="MM/DD/YYYY HH:mm">MM/DD/YYYY HH:mm</option>
                      <option value="DD/MM/YYYY HH:mm">DD/MM/YYYY HH:mm</option>
                      <option value="ISO 8601">ISO 8601</option>
                      <option value="Unix Timestamp">Unix Timestamp</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-secondary transition-colors pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <label className="card-label">Auto-Save Frequency (Drafts)</label>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={autoSaveFreq}
                    onChange={(e) => setAutoSaveFreq(Number(e.target.value))}
                    aria-label="Auto-save frequency in minutes"
                    title="Auto-save frequency"
                    className="flex-1 h-1.5 bg-surface-container rounded-full appearance-none cursor-pointer accent-secondary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="text-sm font-black text-white tabular-nums min-w-[60px] text-right">{autoSaveFreq} min{autoSaveFreq !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-outline">
                <button className="px-6 py-2.5 border border-outline rounded-xl font-bold text-white hover:bg-surface-container transition-colors active:scale-95">
                  Cancel
                </button>
                <button
                  onClick={handleSaveGeneral}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                  {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-8">
            <div className="bento-card !p-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Cog size={22} className="text-secondary" />
                  <h3 className="text-xl font-bold text-white tracking-tight">API Configuration</h3>
                </div>
                <button
                  onClick={() => setShowAddKey(true)}
                  className="bg-surface-container border border-outline text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container-high transition-all active:scale-95"
                >
                  <Plus size={16} /> Add Key
                </button>
              </div>
              <p className="text-sm text-on-surface-variant font-medium mb-8">Manage connections to external data providers.</p>

              <div className="space-y-3 mb-8">
                <label className="card-label" htmlFor="baseApiUrl">Backend Base API URL</label>
                <input
                  id="baseApiUrl"
                  value={baseApiUrl}
                  onChange={(e) => setBaseApiUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-mono text-sm"
                  type="url"
                />
              </div>

              {apiProviders.length === 0 ? (
                <div className="border border-outline rounded-xl p-10 flex flex-col items-center justify-center text-center">
                  <Cog size={40} className="text-on-surface-variant/20 mb-4" />
                  <h4 className="text-base font-bold text-white mb-2">No API Keys Configured</h4>
                  <p className="text-sm text-on-surface-variant font-medium max-w-sm mb-4">
                    Add API keys for external data providers like NOAA Weather Data or EIA Energy Markets.
                  </p>
                  <button
                    onClick={() => setShowAddKey(true)}
                    className="bg-white text-black px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-opacity-90 transition-all active:scale-95"
                  >
                    <Plus size={16} /> Add Your First Key
                  </button>
                </div>
              ) : (
                <div className="border border-outline rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline bg-surface-container/30">
                        <th className="py-4 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Provider Name</th>
                        <th className="py-4 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">API Key</th>
                        <th className="py-4 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/50">
                      {apiProviders.map((provider) => (
                        <tr key={provider.id} className="hover:bg-surface-container/20 transition-all">
                          <td className="py-4 px-6 text-sm font-bold text-white">{provider.name}</td>
                          <td className="py-4 px-6 text-sm font-mono text-on-surface-variant tracking-wider">{provider.apiKeyMasked}</td>
                          <td className="py-4 px-6 text-right">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              provider.status === 'Active'
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-error/10 text-error border-error/20"
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", provider.status === 'Active' ? "bg-emerald-500" : "bg-error")} />
                              {provider.status}
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
        );

      case 'notifications':
        return (
          <div className="bento-card !p-8 flex flex-col items-center justify-center py-16">
            <Bell size={48} className="text-on-surface-variant/15 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Notification Preferences</h4>
            <p className="text-sm text-on-surface-variant font-medium text-center max-w-sm">
              Configure email and in-app alerts for training completions, dataset uploads, and system warnings.
            </p>
          </div>
        );

      case 'storage':
        return (
          <div className="bento-card !p-8 flex flex-col items-center justify-center py-16">
            <HardDrive size={48} className="text-on-surface-variant/15 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Storage & Usage</h4>
            <p className="text-sm text-on-surface-variant font-medium text-center max-w-sm">
              Monitor disk usage, manage dataset retention policies, and configure storage quotas.
            </p>
          </div>
        );

      case 'security':
        return (
          <div className="bento-card !p-8 flex flex-col items-center justify-center py-16">
            <Shield size={48} className="text-on-surface-variant/15 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Security Settings</h4>
            <p className="text-sm text-on-surface-variant font-medium text-center max-w-sm">
              Manage authentication methods, session timeouts, and audit logging preferences.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      <div>
        <h2 className="text-4xl font-extrabold text-white tracking-tighter leading-none mb-2">Settings</h2>
        <p className="text-on-surface-variant font-medium text-sm">Manage your forecasting environment, API connections, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Sidebar Navigation */}
        <div className="lg:col-span-3">
          <nav className="flex flex-col gap-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left w-full",
                  activeTab === tab.id
                    ? "text-white font-bold bg-surface-container border-l-2 border-secondary"
                    : "text-on-surface-variant font-medium hover:bg-surface-dim hover:text-white border-l-2 border-transparent"
                )}
              >
                <tab.icon size={18} className={cn(activeTab === tab.id ? "text-secondary" : "")} />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-9">
          {renderTabContent()}
        </div>
      </div>

      {/* Add Key Modal */}
      <AnimatePresence>
        {showAddKey && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddKey(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface-dim w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 border border-outline"
            >
              <div className="flex justify-between items-center px-8 py-5 border-b border-outline">
                <h3 className="text-xl font-extrabold text-white tracking-tight">Add API Key</h3>
                <button aria-label="Close dialog" title="Close dialog" onClick={() => setShowAddKey(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="card-label" htmlFor="providerName">Provider Name</label>
                  <input
                    id="providerName"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-bold placeholder:text-on-surface-variant/40"
                    placeholder="e.g. NOAA Weather Data"
                    type="text"
                  />
                </div>
                <div className="space-y-3">
                  <label className="card-label" htmlFor="apiKey">API Key</label>
                  <input
                    id="apiKey"
                    value={newProvider.key}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, key: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-mono placeholder:text-on-surface-variant/40"
                    placeholder="sk-xxxx-xxxx-xxxx-xxxx"
                    type="password"
                  />
                </div>
              </div>
              <div className="px-8 py-6 border-t border-outline flex justify-end gap-4">
                <button onClick={() => { setShowAddKey(false); setNewProvider({ name: '', key: '' }); }} className="px-6 py-2.5 border border-outline rounded-xl font-bold text-white hover:bg-surface-container transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAddProvider}
                  disabled={!newProvider.name.trim() || !newProvider.key.trim()}
                  className="px-6 py-2.5 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Provider
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
