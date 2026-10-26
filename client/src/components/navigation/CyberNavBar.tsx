import React, { useState } from 'react';
import { useGameStore, ScreenState } from '../../store/gameStore.js';
import { soundSynth } from '../../services/soundSynth.js';
import { CLUTCH_LOGO } from '../../config/assets.js';
import {
  Swords,
  LayoutDashboard,
  User,
  Settings,
  Sparkles,
  Flame,
  LogIn,
  Home,
  Palette,
  Compass,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  Activity
} from 'lucide-react';

export const CyberNavBar: React.FC<{ activeTab?: ScreenState }> = ({ activeTab }) => {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const active = activeTab || currentScreen;

  const handleTabClick = (screen: ScreenState) => {
    if (soundEnabled) soundSynth.click();
    setScreen(screen);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) soundSynth.airhorn();
  };

  const NAV_ITEMS: Array<{ id: ScreenState; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    { id: 'home', label: 'HOME', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'lobby', label: 'ARENA', icon: <Swords className="w-3.5 h-3.5" /> },
    { id: 'brainrot_shorts', label: 'SHORTS', icon: <span className="text-xs">📱</span>, badge: 'VIRAL', badgeColor: 'from-rose-500 to-amber-500' },
    { id: 'dashboard', label: 'DASHBOARD', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'solo_quest', label: 'ODYSSEY', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'profile', label: 'PROFILE', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'SETTINGS', icon: <Settings className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="w-full bg-[#040409]/95 border-b border-violet-500/25 backdrop-blur-2xl px-4 sm:px-6 py-2.5 z-40 select-none shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.8)] relative">
      <div className="scanline-effect opacity-40" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo & Telemetry */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-md group-hover:bg-violet-400/60 transition-colors" />
              <img
                src={CLUTCH_LOGO}
                alt="Clutch Logo"
                className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] relative z-10"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-cyber font-black text-sm tracking-widest text-white group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                CLUTCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 text-xs">ARENA</span>
              </span>
              <span className="text-[8.5px] font-mono text-slate-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE PUZZLE PLATFORM
              </span>
            </div>
          </button>
        </div>

        {/* Center Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isCurrent = active === item.id || (item.id === 'home' && active === 'cinematic');
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-cyber font-bold transition-all flex items-center gap-1.5 whitespace-nowrap relative group ${
                  isCurrent
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full bg-gradient-to-r ${item.badgeColor || 'from-violet-500 to-cyan-500'} text-[8px] font-mono font-black text-black shadow-sm`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right HUD Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Synthesizer Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center justify-center ${
              soundEnabled
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Sound Synth Engaged (Click to Mute)' : 'Sound Synth Muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Aura Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/35 text-amber-300 text-xs font-cyber font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
            <span>{(userProfile.auraPoints || 48500).toLocaleString()}</span>
            <span className="text-[8.5px] text-amber-400/80 font-mono">AURA</span>
          </div>

          {/* User Profile or Sign In */}
          {userProfile.isGuest ? (
            <button
              onClick={() => handleTabClick('auth')}
              className="cyber-btn cyber-btn-cyan px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <LogIn className="w-3 h-3" />
              <span className="hidden sm:inline">SIGN IN</span>
            </button>
          ) : (
            <button
              onClick={() => handleTabClick('profile')}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400 transition-colors"
            >
              <div
                className="w-5 h-5 rounded-full border border-cyan-400 shadow-sm"
                style={{ backgroundColor: userProfile.avatar.color }}
              />
              <span className="text-xs font-cyber font-bold text-white max-w-[90px] truncate">
                {userProfile.username}
              </span>
            </button>
          )}

          {/* Avatar Customizer Quick Access */}
          <button
            onClick={() => handleTabClick('avatar_customizer')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-violet-400 text-slate-400 hover:text-violet-300 transition-colors"
            title="Customizer Studio"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
