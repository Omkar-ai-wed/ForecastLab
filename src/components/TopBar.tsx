import React from 'react';
import { Search, Bell, User, ChevronDown, Zap } from 'lucide-react';

interface TopBarProps {
  onProfileClick: () => void;
  onRunForecast?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onProfileClick, onRunForecast }) => {
  return (
    <header className="flex justify-between items-center w-full px-8 h-[72px] border-b border-outline/30 sticky top-0 z-40" style={{ background: 'rgba(15, 19, 28, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Forecasting System</h2>
        <div className="flex items-center rounded-xl px-4 py-1.5 ml-8 transition-all w-72 input-dark">
          <Search size={16} className="text-on-surface-variant mr-3 flex-shrink-0" />
          <input className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full p-0 placeholder:text-on-surface-variant/60 text-on-surface" placeholder="Search datasets..." type="text" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-outline/30 pr-6">
          <button aria-label="Notifications" title="Notifications" className="text-on-surface-variant hover:text-primary transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 status-dot" style={{ width: '6px', height: '6px' }} />
          </button>
          <button onClick={onProfileClick} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline group-hover:border-primary/40 transition-all flex items-center justify-center bg-surface-container">
              <User size={16} className="text-on-surface-variant" />
            </div>
            <span className="text-[13px] font-medium text-on-surface">Alex Rivera</span>
            <ChevronDown size={14} className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-xs uppercase tracking-widest">Export</button>
          <button onClick={onRunForecast} className="btn-primary-glow flex items-center gap-2">
            <Zap size={14} />
            Run Forecast
          </button>
        </div>
      </div>
    </header>
  );
};
