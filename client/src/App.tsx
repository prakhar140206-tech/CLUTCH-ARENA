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
import { DSAOnboardingModal } from './components/onboarding/DSAOnboardingModal.js';

export const App: React.FC = () => {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  useEffect(() => {
    // Connect to real-time multiplayer backend
    socketService.connect();
  }, []);

  // PUBLIC SCREEN:
  // First-time and returning visitors see the Home Page (Landing Page) first.
  if (currentScreen === 'home' || currentScreen === 'cinematic') {
    return (
      <div className="w-screen h-screen h-[100dvh] bg-clutch-bg text-clutch-text flex flex-col overflow-hidden">
        <HomeScreen />
      </div>
    );
  }

  // MANDATORY AUTHENTICATION GATE:
  // If an unauthenticated guest tries to enter the platform, main dashboard, arena, lobby, etc.,
  // they are strictly blocked and presented with the AuthScreen.
  if (userProfile.isGuest) {
    return (
      <div className="w-screen h-screen h-[100dvh] bg-clutch-bg text-clutch-text flex flex-col overflow-hidden">
        <AuthScreen />
        <DSAOnboardingModal />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen h-[100dvh] bg-clutch-bg text-clutch-text flex flex-col overflow-hidden">
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'profile' && <ProfileScreen />}
      {currentScreen === 'settings' && <SettingsScreen />}
      {currentScreen === 'auth' && <AuthScreen />}
      {currentScreen === 'lobby' && <LobbyScreen />}
      {currentScreen === 'solo_quest' && <SoloQuestScreen />}
      {currentScreen === 'arena_3d' && <ArenaScreen />}
      {currentScreen === 'avatar_customizer' && <AvatarCustomizerScreen />}
      {currentScreen === 'brainrot_shorts' && <BrainrotShortsScreen />}
      <DSAOnboardingModal />
    </div>
  );
};


