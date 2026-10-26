import React from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { ArenaHero3D } from '../components/arena3d/ArenaHero3D.js';
import {
  Swords,
  Compass,
  Trophy,
  Zap,
  TrendingUp,
  Shield,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Bot,
  Users,
  Smartphone,
  ChevronRight,
  LogIn
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  return (
    <div className="w-screen h-screen flex flex-col bg-clutch-bg text-clutch-text overflow-y-auto select-none relative font-sans">
      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Subtle Violet Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-clutch-violet/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full bg-clutch-surface/90 border-b border-clutch-border backdrop-blur-xl px-4 sm:px-8 py-3.5 z-40 sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-clutch-violet/30 to-clutch-surface-elevated border border-clutch-violet/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <img src="/logo.png" alt="CLUTCH Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-cyber font-black text-sm tracking-wider text-white flex items-center gap-1.5">
                CLUTCH <span className="text-[10px] px-1.5 py-0.2 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30">ARENA</span>
              </span>
              <span className="text-[9px] font-mono text-clutch-muted tracking-tight">Competitive DSA Gaming</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundSynth.click();
                setScreen('dashboard');
              }}
              className="clutch-btn-ghost text-xs"
            >
              Dashboard
            </button>

            {userProfile.isGuest ? (
              <button
                onClick={() => {
                  soundSynth.click();
                  setScreen('auth');
                }}
                className="clutch-btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundSynth.click();
                  setScreen('profile');
                }}
                className="clutch-btn-secondary py-1.5 px-3 text-xs flex items-center gap-2"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: userProfile.avatar.color }}
                >
                  {userProfile.username.charAt(0)}
                </div>
                <span>{userProfile.username}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Arena Focal Point */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 flex flex-col items-center text-center z-10 w-full">
        {/* Holographic Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-clutch-violet/15 border border-clutch-violet/30 text-clutch-lavender text-xs font-mono mb-6">
          <Sparkles className="w-3.5 h-3.5 text-clutch-lavender" />
          <span>REAL-TIME MULTIPLAYER ALGORITHMIC ESPORTS</span>
        </div>

        <h1 className="font-cyber font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-wide mb-4 leading-tight">
          MASTER DSA <span className="text-transparent bg-clip-text bg-gradient-to-r from-clutch-lavender via-clutch-violet-light to-white">UNDER FIRE</span>
        </h1>

        <p className="max-w-2xl text-clutch-muted text-sm sm:text-base leading-relaxed mb-8 font-normal">
          Tired of boring LeetCode drills? Battle real developers in 70-player synchronized arenas, challenge adaptive AI bots, and conquer interactive data structure puzzles.
        </p>

        {/* 3D Focal Point Arena Scene */}
        <div className="w-full max-w-xl h-72 sm:h-80 relative my-2 flex items-center justify-center">
          <ArenaHero3D height="100%" />
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md my-8">
          <button
            onClick={() => {
              soundSynth.click();
              setScreen('lobby');
            }}
            className="w-full sm:w-1/2 clutch-btn-primary py-3.5 text-sm flex items-center justify-center gap-2"
          >
            <Swords className="w-4 h-4" />
            <span>Enter Arena</span>
          </button>

          <button
            onClick={() => {
              soundSynth.click();
              setScreen('solo_quest');
            }}
            className="w-full sm:w-1/2 clutch-btn-secondary py-3.5 text-sm flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-clutch-lavender" />
            <span>Practice Solo</span>
          </button>
        </div>
      </section>

      {/* Feature Breakdown: Practice, Compete, Progress */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 z-10 w-full border-t border-clutch-border/60">
        <div className="text-center mb-10">
          <h2 className="font-cyber font-bold text-2xl text-white mb-2">ENGINEERED FOR MASTERY</h2>
          <p className="text-xs font-mono text-clutch-muted">Three pillars that turn theory into reflex</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="clutch-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-5">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-cyber font-bold text-lg text-white mb-2">1. Practice</h3>
              <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                Explore curated topics spanning Arrays, Trees, Graphs, and DP with adaptive time limits, hints, and automated sandbox validation.
              </p>
            </div>
            <div className="pt-3 border-t border-clutch-border text-[11px] font-mono text-clutch-lavender flex items-center gap-1">
              <span>Interactive Workspaces</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="clutch-panel rounded-2xl p-6 flex flex-col justify-between border-clutch-violet/40 shadow-lg">
            <div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-clutch-violet/30 to-clutch-surface-elevated border border-clutch-violet/50 flex items-center justify-center text-white mb-5">
                <Swords className="w-6 h-6 text-clutch-lavender" />
              </div>
              <h3 className="font-cyber font-bold text-lg text-white mb-2">2. Compete</h3>
              <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                Enter synchronized multiplayer rounds with authoritative timers, real-time participant leaderboards, and instant execution results.
              </p>
            </div>
            <div className="pt-3 border-t border-clutch-border text-[11px] font-mono text-clutch-lavender flex items-center gap-1">
              <span>Synchronized WebSockets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="clutch-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-cyber font-bold text-lg text-white mb-2">3. Progress</h3>
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

      {/* Footer */}
      <footer className="w-full bg-clutch-surface/90 border-t border-clutch-border py-8 px-4 sm:px-8 z-10 text-xs font-mono text-clutch-subtle mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CLUTCH" className="w-6 h-6 object-contain" />
            <span className="text-white font-cyber font-bold">CLUTCH ARENA</span>
            <span>• Online DSA Puzzle & Gaming Platform</span>
          </div>

          <div className="flex items-center gap-4 text-clutch-muted">
            <button onClick={() => setScreen('dashboard')} className="hover:text-white transition-colors">Dashboard</button>
            <button onClick={() => setScreen('solo_quest')} className="hover:text-white transition-colors">Solo Quest</button>
            <button onClick={() => setScreen('lobby')} className="hover:text-white transition-colors">Arena</button>
            <button onClick={() => setScreen('settings')} className="hover:text-white transition-colors">Settings</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
