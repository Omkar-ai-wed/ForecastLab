import React from 'react';
import { cn } from '../lib/utils';
import { 
  Plus, 
  Database, 
  BrainCircuit, 
  LineChart, 
  Settings, 
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';
import { Screen } from '../types';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onScreenChange }) => {
  const navItems = [
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'train', label: 'Train Model', icon: BrainCircuit },
    { id: 'forecasts', label: 'Forecasts', icon: LineChart },
  ];

  const footerItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-[280px] bg-black border-r border-outline flex flex-col py-6 gap-8 z-50">
      <div className="px-6 flex items-center gap-3 cursor-pointer" onClick={() => onScreenChange('datasets')}>
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/20">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">Forecast Lab</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Studio OS v2.4</p>
        </div>
      </div>

      <div className="px-6">
        <button className="w-full bg-white text-black rounded-xl hover:bg-opacity-90 transition-all h-11 font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95">
          <Plus size={18} />
          New Project
        </button>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id as Screen)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left",
              activeScreen === item.id 
                ? "text-white font-bold bg-surface-container" 
                : "text-on-surface-variant font-medium hover:bg-surface-dim hover:text-white"
            )}
          >
            <item.icon size={20} className={cn(activeScreen === item.id ? "text-secondary" : "")} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-1 mt-auto border-t border-outline pt-6">
        {footerItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id as Screen)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
              activeScreen === item.id 
                ? "text-white font-bold bg-surface-container" 
                : "text-on-surface-variant font-medium hover:bg-surface-dim hover:text-white"
            )}
          >
            <item.icon size={20} className={cn(activeScreen === item.id ? "text-secondary" : "")} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
