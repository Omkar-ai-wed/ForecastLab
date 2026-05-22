/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DatasetsScreen } from './components/DatasetsScreen';
import { ExploreScreen } from './components/ExploreScreen';
import { TrainingScreen } from './components/TrainingScreen';
import { ForecastResultScreen } from './components/ForecastResultScreen';
import { CreateProfileScreen } from './components/CreateProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Screen } from './types';
import { X, HelpCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('datasets');
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Helper to render the active screen
  const renderScreen = () => {
    switch (activeScreen) {
      case 'datasets':
        return (
          <DatasetsScreen 
            onNavigateToExplore={() => setActiveScreen('explore')} 
            openUploadModal={openUploadModal}
            onClearUploadModalFlag={() => setOpenUploadModal(false)}
          />
        );
      case 'explore':
        return <ExploreScreen />;
      case 'train':
        return <TrainingScreen />;
      case 'forecasts':
        return <ForecastResultScreen />;
      case 'profile':
        return (
          <CreateProfileScreen 
            onCancel={() => setActiveScreen('datasets')} 
            onSave={() => setActiveScreen('datasets')} 
          />
        );
      case 'settings':
        return <SettingsScreen />;
      default:
        return (
          <DatasetsScreen 
            onNavigateToExplore={() => setActiveScreen('explore')} 
            openUploadModal={openUploadModal}
            onClearUploadModalFlag={() => setOpenUploadModal(false)}
          />
        );
    }
  };

  // Profile screen is full-screen, so we wrap it differently
  if (activeScreen === 'profile') {
    return renderScreen();
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0e17' }}>
      <Sidebar 
        activeScreen={activeScreen} 
        onScreenChange={setActiveScreen} 
        onNewProjectClick={() => {
          setActiveScreen('datasets');
          setOpenUploadModal(true);
        }}
        onSupportClick={() => setIsSupportOpen(true)}
      />
      
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen w-[calc(100%-280px)]">
        <TopBar 
          onProfileClick={() => setActiveScreen('profile')} 
          onRunForecast={() => setActiveScreen('forecasts')}
        />
        
        <main className="flex-1 p-8 overflow-x-hidden">
          {renderScreen()}
        </main>
      </div>

      {isSupportOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111827] border border-outline rounded-3xl w-full max-w-md p-6 relative shadow-2xl flex flex-col gap-6">
            <button 
              onClick={() => setIsSupportOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <HelpCircle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Help & Support</h2>
                <p className="text-xs text-on-surface-variant">Resources, documentation and feedback</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider opacity-60">Documentation Links</h3>
              <div className="grid grid-cols-1 gap-2">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-sm text-on-surface transition-all">
                  <span>Model Training & Tuning Guide</span>
                  <ExternalLink size={14} className="opacity-60" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-sm text-on-surface transition-all">
                  <span>CSV File Formatting Guide</span>
                  <ExternalLink size={14} className="opacity-60" />
                </a>
              </div>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for your feedback! Our support team will review it.");
              setIsSupportOpen(false);
            }} className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider opacity-60">Send Us Feedback</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-bold">Category</label>
                <select className="w-full px-4 py-2.5 bg-[#1f2937] border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all text-sm">
                  <option>General Feedback</option>
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-bold">Message</label>
                <textarea required placeholder="Let us know what you think..." className="w-full px-4 py-2.5 bg-[#1f2937] border border-outline text-white rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all h-24 resize-none placeholder:text-on-surface-variant text-sm"></textarea>
              </div>
              <button type="submit" className="btn-primary-glow h-11 w-full text-sm font-bold mt-2">
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
