import React from 'react';
import { cn } from '../lib/utils';
import { 
  Plus, 
  Database, 
  BrainCircuit, 
  LineChart, 
  Settings, 
  HelpCircle,
  LayoutDashboard,
  Compass
} from 'lucide-react';
import { Screen } from '../types';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  onNewProjectClick?: () => void;
  onSupportClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeScreen, 
  onScreenChange,
  onNewProjectClick,
  onSupportClick
}) => {
  const navItems = [
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'train', label: 'Train Model', icon: BrainCircuit },
    { id: 'forecasts', label: 'Forecasts', icon: LineChart },
  ];

  const footerItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <nav className="sidebar-glass fixed left-0 top-0 h-full w-[280px] flex flex-col py-6 gap-8 z-50">
      {/* Logo & Branding */}
      <div className="px-6 flex items-center gap-3 cursor-pointer group" onClick={() => onScreenChange('datasets')}>
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-lg shadow-primary-container/20 transition-all duration-300 group-hover:shadow-primary-container/40">
          <LayoutDashboard size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-on-surface">Forecast Lab</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-60">Studio OS v2.4</p>
        </div>
      </div>

      {/* New Project CTA */}
      <div className="px-6">
        <button 
          onClick={onNewProjectClick}
          className="btn-primary-glow w-full flex items-center justify-center gap-2 h-11"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id as Screen)}
            className={cn(
              "sidebar-item flex items-center gap-3 transition-all duration-200 group text-left relative",
              activeScreen === item.id 
                ? "active text-on-surface font-bold" 
                : "text-on-surface-variant font-medium hover:text-on-surface"
            )}
          >
            <item.icon 
              size={20} 
              className={cn(
                "transition-colors duration-200",
                activeScreen === item.id ? "text-primary" : "group-hover:text-primary/60"
              )} 
            />
            <span className="text-sm">{item.label}</span>
            {activeScreen === item.id && (
              <span className="status-dot ml-auto" />
            )}
          </button>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="px-4 flex flex-col gap-1 mt-auto border-t border-outline/30 pt-6">
        {footerItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'support') {
                onSupportClick?.();
              } else {
                onScreenChange(item.id as Screen);
              }
            }}
            className={cn(
              "sidebar-item flex items-center gap-3 transition-all duration-200 text-left",
              activeScreen === item.id 
                ? "active text-on-surface font-bold" 
                : "text-on-surface-variant font-medium hover:text-on-surface"
            )}
          >
            <item.icon 
              size={20} 
              className={cn(
                "transition-colors duration-200",
                activeScreen === item.id ? "text-primary" : ""
              )} 
            />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
