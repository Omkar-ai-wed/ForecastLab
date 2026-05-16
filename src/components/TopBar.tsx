import React from 'react';
import { Search, Bell, User, ChevronDown } from 'lucide-react';

interface TopBarProps {
  onProfileClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onProfileClick }) => {
  return (
    <header className="flex justify-between items-center w-full px-8 h-[72px] bg-black border-b border-outline sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-extrabold text-white tracking-tight">Forecasting System</h2>
        <div className="flex items-center bg-surface-dim rounded-xl px-4 py-1.5 ml-8 border border-outline focus-within:border-secondary transition-all w-72">
          <Search size={18} className="text-on-surface-variant mr-3" />
          <input className="bg-transparent border-none focus:ring-0 text-sm w-full p-0 placeholder:text-on-surface-variant text-white" placeholder="Search datasets..." type="text" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-outline pr-6">
          <button aria-label="Notifications" title="Notifications" className="text-on-surface-variant hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full" />
          </button>
          <button onClick={onProfileClick} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline group-hover:border-secondary transition-all flex items-center justify-center bg-surface-container">
              <User size={16} className="text-on-surface-variant" />
            </div>
            <span className="text-[13px] font-medium text-white">Alex Rivera</span>
            <ChevronDown size={14} className="text-on-surface-variant group-hover:text-white" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-dim text-white border border-outline hover:bg-surface-container px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Export</button>
          <button className="bg-white text-black px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-sm">Run Forecast</button>
        </div>
      </div>
    </header>
  );
};
