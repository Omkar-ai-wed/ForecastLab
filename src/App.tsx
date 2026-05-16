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

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('datasets');

  // Helper to render the active screen
  const renderScreen = () => {
    switch (activeScreen) {
      case 'datasets':
        return <DatasetsScreen onNavigateToExplore={() => setActiveScreen('explore')} />;
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
        return <DatasetsScreen onNavigateToExplore={() => setActiveScreen('explore')} />;
    }
  };

  // Profile screen is full-screen, so we wrap it differently
  if (activeScreen === 'profile') {
    return renderScreen();
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen w-[calc(100%-280px)]">
        <TopBar onProfileClick={() => setActiveScreen('profile')} />
        
        <main className="flex-1 p-8 overflow-x-hidden">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
