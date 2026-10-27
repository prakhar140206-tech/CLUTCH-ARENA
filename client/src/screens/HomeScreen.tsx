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
  Users,
  Smartphone
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  const handleNav = (target: any) => {
    soundSynth.click();
    setScreen(target);
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
      {/* Mobile 3D Floating Cyber-Dock (Phones < sm) */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="sm:hidden fixed bottom-2 inset-x-2.5 max-w-lg mx-auto z-50 rounded-2xl bg-gradient-to-b from-[#161a3f]/95 via-[#0d102b]/95 to-[#060818]/98 backdrop-blur-2xl border border-violet-500/30 border-t-violet-400/50 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(124,58,237,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)] p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] grid grid-cols-5 items-end justify-items-center gap-1"
      >
        <button
          onClick={() => handleNav('home' as any)}
          className="w-full flex flex-col items-center justify-center py-1 transition-all duration-200 group relative rounded-xl active:scale-95 active:translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-b from-violet-500 via-purple-600 to-indigo-700 text-white shadow-[0_6px_14px_rgba(124,58,237,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] border-t border-white/40 border-b-2 border-purple-950 -translate-y-1">
            <Home className="w-4 h-4 scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
          </div>
          <span className="text-[9px] font-mono tracking-tight mt-1 text-violet-200 font-bold drop-shadow-[0_0_8px_rgba(196,181,253,0.5)]">
            Home
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse mt-0.5" />
        </button>

        <button
          onClick={() => handleNav('solo_quest')}
          className="w-full flex flex-col items-center justify-center py-1 transition-all duration-200 group relative rounded-xl active:scale-95 active:translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-slate-400 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_5px_rgba(0,0,0,0.4)] group-hover:text-white">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-mono tracking-tight mt-1 text-slate-400 group-hover:text-slate-200">
            Practice
          </span>
        </button>

        {/* Center Hero Action: 3D Elevated Arena Battle Token */}
        <button
          onClick={() => handleNav('lobby')}
          className="flex flex-col items-center justify-end -mt-5 group relative focus:outline-none rounded-xl"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 text-white shadow-[0_8px_20px_rgba(124,58,237,0.7),0_0_16px_rgba(6,182,212,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] border-b-2 border-indigo-950 scale-105 -translate-y-1 active:translate-y-0.5 active:scale-95 transition-all duration-300 relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />
            <Swords className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 border border-slate-900 shadow-[0_0_6px_#22d3ee]"></span>
            </span>
          </div>
          <span className="text-[9.5px] font-cyber font-black tracking-wider mt-1 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            ARENA
          </span>
        </button>

        {/* DSA Blitz Shorts */}
        <button
          onClick={() => handleNav('brainrot_shorts')}
          className="w-full flex flex-col items-center justify-center py-1 transition-all duration-200 group relative rounded-xl active:scale-95 active:translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-slate-400 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_5px_rgba(0,0,0,0.4)] group-hover:text-white relative">
            <Smartphone className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-500 text-[8px] font-black font-mono text-white shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-rose-300/40">
              ⚡
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-tight mt-1 text-slate-400 group-hover:text-slate-200">
            Shorts
          </span>
        </button>

        <button
          onClick={() => handleNav(userProfile.isGuest ? 'auth' : 'dashboard')}
          className="w-full flex flex-col items-center justify-center py-1 transition-all duration-200 group relative rounded-xl active:scale-95 active:translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-slate-400 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_5px_rgba(0,0,0,0.4)] group-hover:text-white">
            {userProfile.isGuest ? <LogIn className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
          </div>
          <span className="text-[9px] font-mono tracking-tight mt-1 text-slate-400 group-hover:text-slate-200">
            {userProfile.isGuest ? 'Sign In' : 'Dash'}
          </span>
        </button>
      </nav>
    </div>
  );
};
