import React, { useState, useEffect } from 'react';
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
import { LogoLoadingScreen } from './components/ui/LogoLoadingScreen.js';

export const App: React.FC = () => {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const [isBootLoading, setIsBootLoading] = useState<boolean>(true);

  useEffect(() => {
    // Connect to real-time multiplayer backend
    socketService.connect();
  }, []);

  return (
    <>
      {/* Starting Platform Logo Loading Animation */}
      {isBootLoading && (
        <LogoLoadingScreen
          onFinish={() => setIsBootLoading(false)}
          durationMs={2100}
        />
      )}

      {(currentScreen === 'home' || currentScreen === 'cinematic') ? (
        <div className="w-full max-w-full h-screen h-[100dvh] bg-clutch-bg text-clutch-text flex flex-col overflow-x-hidden overflow-y-auto">
          <HomeScreen />
        </div>
      ) : currentScreen === 'auth' ? (
        <div className="w-full max-w-full h-screen h-[100dvh] bg-clutch-bg text-clutch-text flex flex-col overflow-x-hidden overflow-y-auto">
          <AuthScreen />
          <DSAOnboardingModal />
        </div>
      ) : (
        <div className="w-full max-w-full h-screen h-[100dvh] bg-clutch-bg text-clutch-text flex flex-col overflow-x-hidden overflow-y-hidden">
          {currentScreen === 'dashboard' && <DashboardScreen />}
          {currentScreen === 'profile' && <ProfileScreen />}
          {currentScreen === 'settings' && <SettingsScreen />}
          {currentScreen === 'lobby' && <LobbyScreen />}
          {currentScreen === 'solo_quest' && <SoloQuestScreen />}
          {currentScreen === 'arena_3d' && <ArenaScreen />}
          {currentScreen === 'avatar_customizer' && <AvatarCustomizerScreen />}
          {currentScreen === 'brainrot_shorts' && <BrainrotShortsScreen />}
          <DSAOnboardingModal />
        </div>
      )}
    </>
  );
};


