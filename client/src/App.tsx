import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore.js';
import { socketService } from './services/socketService.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { ProfileScreen } from './screens/ProfileScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { AuthScreen } from './screens/AuthScreen.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { SoloQuestScreen } from './screens/SoloQuestScreen.js';
import { ArenaScreen } from './screens/ArenaScreen.js';
import { AvatarCustomizerScreen } from './screens/AvatarCustomizerScreen.js';
import { BrainrotShortsScreen } from './screens/BrainrotShortsScreen.js';

export const App: React.FC = () => {
  const currentScreen = useGameStore((s) => s.currentScreen);

  useEffect(() => {
    // Connect to real-time multiplayer backend
    socketService.connect();
  }, []);

  return (
    <div className="w-screen h-screen bg-clutch-bg text-clutch-text flex flex-col overflow-hidden">
      {(currentScreen === 'home' || currentScreen === 'cinematic') && <HomeScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'profile' && <ProfileScreen />}
      {currentScreen === 'settings' && <SettingsScreen />}
      {currentScreen === 'auth' && <AuthScreen />}
      {currentScreen === 'lobby' && <LobbyScreen />}
      {currentScreen === 'solo_quest' && <SoloQuestScreen />}
      {currentScreen === 'arena_3d' && <ArenaScreen />}
      {currentScreen === 'avatar_customizer' && <AvatarCustomizerScreen />}
      {currentScreen === 'brainrot_shorts' && <BrainrotShortsScreen />}
    </div>
  );
};


