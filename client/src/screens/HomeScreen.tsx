import React from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { ArenaHero3D } from '../components/arena3d/ArenaHero3D.js';
import { CLUTCH_LOGO } from '../config/assets.js';
import {
  Swords,
  Compass,
  Trophy,
  Zap,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
  ChevronRight,
  LogIn,
  Home,
  LayoutDashboard,
  User,
  Radio,
  Code2,
  Users
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  const handleNav = (target: 'auth' | 'lobby' | 'solo_quest' | 'dashboard' | 'profile' | 'settings') => {
    soundSynth.click();
    if (userProfile.isGuest && target !== 'solo_quest') {
      setScreen('auth');
    } else {
      setScreen(target);
    }
  };

  return (
    <div className="w-full max-w-full min-h-screen min-h-[100dvh] flex flex-col bg-clutch-bg text-clutch-text overflow-x-hidden select-none relative font-sans pb-16 sm:pb-0">
      {/* 3D Perspective Ground Grid - Strictly contained */}
      <div className="cyber-grid-floor" />

      {/* Subtle Violet Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[700px] h-[340px] sm:h-[700px] bg-clutch-violet/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar - Mobile Friendly & Guaranteed Zero Overflow */}
      <header className="w-full bg-clutch-surface/95 border-b border-clutch-border backdrop-blur-xl px-3 sm:px-8 py-3 z-40 sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-clutch-violet/30 to-clutch-surface-elevated border border-clutch-violet/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(124,58,237,0.3)] shrink-0">
              <img src={CLUTCH_LOGO} alt="CLUTCH Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-cyber font-black text-xs sm:text-sm tracking-wider text-white">
                  CLUTCH
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30">
                  ARENA
                </span>
              </div>
              <span className="text-[8.5px] font-mono text-clutch-muted tracking-tight hidden sm:inline">
                Competitive DSA Gaming
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Dashboard Link */}
            <button
              onClick={() => handleNav('dashboard')}
              className="hidden sm:inline-flex clutch-btn-ghost text-xs px-2.5 py-1.5"
            >
              Dashboard
            </button>

            {userProfile.isGuest ? (
              <button
                onClick={() => {
                  soundSynth.click();
                  setScreen('auth');
                }}
                className="clutch-btn-primary py-1.5 sm:py-2 px-3 sm:px-4 text-xs flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In<span className="hidden sm:inline"> / Register</span></span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundSynth.click();
                  setScreen('profile');
                }}
                className="clutch-btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 shrink-0"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: userProfile.avatar.color }}
                >
                  {userProfile.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden xs:inline">{userProfile.username}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-10 sm:pb-16 flex flex-col items-center text-center z-10 w-full">
        {/* Holographic Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clutch-violet/15 border border-clutch-violet/30 text-clutch-lavender text-[10px] sm:text-xs font-mono mb-3 sm:mb-5 max-w-[90vw]">
          <Sparkles className="w-3.5 h-3.5 text-clutch-lavender shrink-0" />
          <span className="truncate">REAL-TIME MULTIPLAYER DSA ESPORTS</span>
        </div>

        {/* Heading */}
        <h1 className="font-cyber font-black text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-white tracking-wide mb-3 sm:mb-4 leading-tight px-1 text-center">
          MASTER DSA <br className="hidden xs:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-clutch-lavender via-clutch-violet-light to-white">
            UNDER FIRE
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl text-clutch-muted text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 font-normal px-2 text-center">
          Tired of boring LeetCode drills? Battle real developers in 70-player synchronized arenas, challenge adaptive AI bots, and conquer interactive data structure puzzles.
        </p>

        {/* Mobile Stats Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3 text-[10px] sm:text-xs font-mono text-clutch-lavender">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-clutch-surface/80 border border-clutch-border">
            <Users className="w-3 h-3 text-cyan-400" />
            <span>70-Player Arenas</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-clutch-surface/80 border border-clutch-border">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>&lt;20ms Latency</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-clutch-surface/80 border border-clutch-border">
            <Code2 className="w-3 h-3 text-violet-400" />
            <span>Python &bull; C++ &bull; Java &bull; JS</span>
          </div>
        </div>

        {/* 3D Focal Point Arena Scene - Contained & touch-friendly */}
        <div className="w-full max-w-sm sm:max-w-xl h-56 sm:h-76 relative my-1 flex items-center justify-center overflow-hidden">
          <ArenaHero3D height="100%" />
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md my-6 px-2">
          <button
            onClick={() => handleNav('lobby')}
            className="w-full sm:w-1/2 clutch-btn-primary py-3.5 text-sm flex items-center justify-center gap-2 rounded-xl"
          >
            <Swords className="w-4 h-4" />
            <span>Enter Arena</span>
          </button>

          <button
            onClick={() => handleNav('solo_quest')}
            className="w-full sm:w-1/2 clutch-btn-secondary py-3.5 text-sm flex items-center justify-center gap-2 rounded-xl"
          >
            <Compass className="w-4 h-4 text-clutch-lavender" />
            <span>Practice Solo</span>
          </button>
        </div>
      </section>

      {/* Feature Breakdown: Practice, Compete, Progress */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 z-10 w-full border-t border-clutch-border/60">
        <div className="text-center mb-8">
          <h2 className="font-cyber font-bold text-xl sm:text-2xl text-white mb-1.5">
            ENGINEERED FOR MASTERY
          </h2>
          <p className="text-xs font-mono text-clutch-muted">
            Three pillars that turn theory into reflex
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="clutch-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-4 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-cyber font-bold text-base sm:text-lg text-white mb-1.5">1. Practice</h3>
              <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                Explore curated topics spanning Arrays, Trees, Graphs, and DP with adaptive time limits, hints, and automated sandbox validation.
              </p>
            </div>
            <div className="pt-3 border-t border-clutch-border text-[11px] font-mono text-clutch-lavender flex items-center gap-1">
              <span>Interactive Workspaces</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="clutch-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between border-clutch-violet/40 shadow-lg">
            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-clutch-violet/30 to-clutch-surface-elevated border border-clutch-violet/50 flex items-center justify-center text-white mb-4 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <Swords className="w-5 h-5 text-clutch-lavender" />
              </div>
              <h3 className="font-cyber font-bold text-base sm:text-lg text-white mb-1.5">2. Compete</h3>
              <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                Enter synchronized multiplayer rounds with authoritative timers, real-time participant leaderboards, and instant execution results.
              </p>
            </div>
            <div className="pt-3 border-t border-clutch-border text-[11px] font-mono text-clutch-lavender flex items-center gap-1">
              <span>Synchronized WebSockets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="clutch-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-4 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-cyber font-bold text-base sm:text-lg text-white mb-1.5">3. Progress</h3>
              <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                Level up your rating MMR, unlock custom 3D avatar loadouts, and track your topic mastery across every data structure category.
              </p>
            </div>
            <div className="pt-3 border-t border-clutch-border text-[11px] font-mono text-clutch-lavender flex items-center gap-1">
              <span>Verifiable Elo Ratings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Footer */}
      <footer className="w-full bg-clutch-surface/90 border-t border-clutch-border py-6 px-4 sm:px-8 z-10 text-xs font-mono text-clutch-subtle mt-auto hidden sm:block">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={CLUTCH_LOGO} alt="CLUTCH" className="w-5 h-5 object-contain" />
            <span className="text-white font-cyber font-bold">CLUTCH ARENA</span>
            <span>&bull; Online DSA Puzzle &amp; Gaming Platform</span>
          </div>

          <div className="flex items-center gap-4 text-clutch-muted">
            <button onClick={() => handleNav('dashboard')} className="hover:text-white transition-colors">Dashboard</button>
            <button onClick={() => handleNav('solo_quest')} className="hover:text-white transition-colors">Solo Quest</button>
            <button onClick={() => handleNav('lobby')} className="hover:text-white transition-colors">Arena</button>
            <button onClick={() => handleNav('settings')} className="hover:text-white transition-colors">Settings</button>
          </div>
        </div>
      </footer>

      {/* Mobile Android Bottom Dock (Only on phones < sm) */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-clutch-surface/95 border-t border-clutch-border backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.6)] pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      >
        <button
          onClick={() => handleNav('home' as any)}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-clutch-lavender font-bold"
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-mono">Home</span>
        </button>

        <button
          onClick={() => handleNav('solo_quest')}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-clutch-muted hover:text-white transition-colors"
        >
          <Compass className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-mono">Practice</span>
        </button>

        {/* Center Action: Enter Arena */}
        <button
          onClick={() => handleNav('lobby')}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-clutch-violet-light font-bold"
        >
          <div className="w-8 h-8 rounded-xl bg-clutch-violet/30 border border-clutch-violet/50 flex items-center justify-center text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]">
            <Swords className="w-4 h-4 text-clutch-lavender" />
          </div>
          <span className="text-[9.5px] font-cyber mt-0.5">ARENA</span>
        </button>

        <button
          onClick={() => handleNav(userProfile.isGuest ? 'auth' : 'dashboard')}
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-clutch-muted hover:text-white transition-colors"
        >
          {userProfile.isGuest ? (
            <>
              <LogIn className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-mono">Sign In</span>
            </>
          ) : (
            <>
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-mono">Dash</span>
            </>
          )}
        </button>
      </nav>
    </div>
  );
};
