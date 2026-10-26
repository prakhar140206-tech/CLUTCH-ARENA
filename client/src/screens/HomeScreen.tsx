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
  Users,
  ChevronRight,
  LogIn,
  Home,
  User,
  Radio,
  Flame,
  Code2
} from 'lucide-react';
import { CyberTiltCard } from '../components/ui/CyberTiltCard.js';

export const HomeScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  const handleNav = (target: 'auth' | 'lobby' | 'solo_quest' | 'leaderboard' | 'dashboard' | 'profile' | 'settings') => {
    soundSynth.click();
    if (userProfile.isGuest && target !== 'solo_quest' && target !== 'leaderboard') {
      setScreen('auth');
    } else {
      setScreen(target);
    }
  };

  return (
    <div className="w-full max-w-full min-h-screen min-h-[100dvh] flex flex-col bg-[#070a0e] text-slate-100 overflow-x-hidden overflow-y-auto select-none relative font-sans pb-28 md:pb-10">
      {/* 3D Perspective Ground Grid - Constrained to screen */}
      <div className="cyber-grid-floor opacity-40 pointer-events-none" />

      {/* Subtle Violet & Emerald Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[650px] h-[340px] sm:h-[650px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[240px] sm:w-[450px] h-[240px] sm:h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* =========================================================
          ANDROID-STYLE TOP APP BAR (56dp standard mobile height)
          ========================================================= */}
      <header className="w-full bg-[#0c1017]/95 border-b border-slate-800/80 backdrop-blur-xl px-3 sm:px-8 h-14 sm:h-16 z-40 sticky top-0 shrink-0 flex items-center shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Left */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-violet-600/30 to-[#141b24] border border-violet-500/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(124,58,237,0.35)] shrink-0">
              <img src={CLUTCH_LOGO} alt="CLUTCH" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-cyber font-black text-xs sm:text-sm tracking-wider text-white">
                  CLUTCH
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono font-semibold">
                  ARENA
                </span>
              </div>
              {/* Online live pulse */}
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="hidden xs:inline tracking-tight text-slate-400">1,420 ONLINE</span>
              </div>
            </div>
          </div>

          {/* Actions Right - Guaranteed No Overflow on 320px+ Screens */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Dashboard Link */}
            <button
              onClick={() => handleNav('dashboard')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-slate-700"
            >
              Dashboard
            </button>

            {userProfile.isGuest ? (
              <button
                onClick={() => {
                  soundSynth.click();
                  setScreen('auth');
                }}
                className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-[0_0_18px_rgba(124,58,237,0.4)] border border-violet-400/30 transition-all touch-manipulation"
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
                className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 active:scale-95 text-xs flex items-center gap-2 transition-all touch-manipulation"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: userProfile.avatar.color }}
                >
                  {userProfile.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-slate-200 hidden xs:inline">{userProfile.username}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO SECTION - RESPONSIVE & MOBILE ANDROID APP FEEL
          ========================================================= */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12 flex flex-col items-center text-center z-10">
        {/* Holographic Android Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/40 text-violet-300 text-[10px] sm:text-xs font-mono mb-3 sm:mb-5 max-w-[92vw] shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400 shrink-0 animate-pulse" />
          <span className="truncate">REAL-TIME MULTIPLAYER ALGORITHMIC ESPORTS</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-cyber font-black text-2xl xs:text-3xl sm:text-6xl md:text-7xl text-white tracking-wide mb-3 leading-tight px-1">
          MASTER DSA <br className="xs:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300">
            UNDER FIRE
          </span>
        </h1>

        <p className="max-w-xl text-slate-400 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 font-normal px-2">
          Battle real developers in synchronized arenas, challenge adaptive AI bots, and conquer interactive data structure puzzles.
        </p>

        {/* Android Stat Chips Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 text-[10px] sm:text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <Users className="w-3 h-3 text-cyan-400" />
            <span>70-Player Arenas</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>&lt;20ms WebSockets</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <Code2 className="w-3 h-3 text-violet-400" />
            <span>Python &bull; C++ &bull; Java &bull; JS</span>
          </div>
        </div>

        {/* 3D Focal Point Arena Scene - Contained to prevent mobile overflow */}
        <div className="w-full max-w-sm sm:max-w-lg h-52 sm:h-72 relative my-2 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
          <ArenaHero3D height="100%" />
        </div>

        {/* Primary Android Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md my-4 px-2">
          <button
            onClick={() => handleNav('lobby')}
            className="w-full sm:w-1/2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] active:brightness-110 text-white font-cyber font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(124,58,237,0.5)] border border-violet-400/40 transition-all touch-manipulation"
          >
            <Swords className="w-4 h-4 text-violet-200" />
            <span>ENTER ARENA</span>
          </button>

          <button
            onClick={() => handleNav('solo_quest')}
            className="w-full sm:w-1/2 py-3.5 px-5 rounded-xl bg-[#0f151e] hover:bg-[#151c27] active:scale-[0.98] text-slate-200 hover:text-white font-cyber font-bold text-sm flex items-center justify-center gap-2 border border-slate-700/80 transition-all touch-manipulation shadow-md"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>PRACTICE SOLO</span>
          </button>
        </div>
      </section>

      {/* =========================================================
          FEATURE BREAKDOWN - ANDROID MATERIAL CARDS
          ========================================================= */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 z-10 border-t border-slate-800/60">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="font-cyber font-bold text-xl sm:text-2xl text-white mb-1.5">
            ENGINEERED FOR MASTERY
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Three pillars that transform theory into muscle memory
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <CyberTiltCard
            glowColor="cyan"
            className="p-5 sm:p-6 flex flex-col justify-between rounded-2xl bg-[#0d1219]/90 border border-slate-800"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-cyber font-bold text-base sm:text-lg text-white mb-1.5">1. Practice</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Explore curated topics spanning Arrays, Trees, Graphs, and DP with adaptive time limits, hints, and automated sandbox validation.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-cyan-300 flex items-center gap-1">
              <span>Interactive Workspaces</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </CyberTiltCard>

          <CyberTiltCard
            glowColor="violet"
            className="p-5 sm:p-6 flex flex-col justify-between rounded-2xl bg-[#0d1219]/90 border border-slate-800"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Swords className="w-5 h-5" />
              </div>
              <h3 className="font-cyber font-bold text-base sm:text-lg text-white mb-1.5">2. Compete</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Enter synchronized multiplayer rounds with authoritative timers, real-time participant leaderboards, and instant execution results.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-violet-300 flex items-center gap-1">
              <span>Synchronized WebSockets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </CyberTiltCard>

          <CyberTiltCard
            glowColor="emerald"
            className="p-5 sm:p-6 flex flex-col justify-between rounded-2xl bg-[#0d1219]/90 border border-slate-800"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-cyber font-bold text-base sm:text-lg text-white mb-1.5">3. Progress</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Level up your rating MMR, unlock custom 3D avatar loadouts, and track your topic mastery across every data structure category.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-emerald-300 flex items-center gap-1">
              <span>Verifiable Elo Ratings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </CyberTiltCard>
        </div>
      </section>

      {/* =========================================================
          DESKTOP FOOTER
          ========================================================= */}
      <footer className="w-full bg-[#090d13]/90 border-t border-slate-800/80 py-6 px-4 sm:px-8 z-10 text-xs font-mono text-slate-500 mt-auto hidden md:block">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={CLUTCH_LOGO} alt="CLUTCH" className="w-5 h-5 object-contain" />
            <span className="text-white font-cyber font-bold">CLUTCH ARENA</span>
            <span className="text-slate-500">• Online Competitive DSA Gaming</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => handleNav('dashboard')} className="hover:text-white transition-colors">Dashboard</button>
            <button onClick={() => handleNav('solo_quest')} className="hover:text-white transition-colors">Solo Quest</button>
            <button onClick={() => handleNav('lobby')} className="hover:text-white transition-colors">Arena</button>
            <button onClick={() => handleNav('leaderboard')} className="hover:text-white transition-colors">Leaderboard</button>
            <button onClick={() => handleNav('settings')} className="hover:text-white transition-colors">Settings</button>
          </div>
        </div>
      </footer>

      {/* =========================================================
          MOBILE ANDROID BOTTOM NAVIGATION DOCK (Native App Experience)
          ========================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c1017]/95 backdrop-blur-2xl border-t border-slate-800/90 pb-[calc(env(safe-area-inset-bottom,0px)+4px)] pt-1.5 px-3 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {/* Home Tab (Active) */}
          <button
            onClick={() => soundSynth.click()}
            className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-violet-400 group relative touch-manipulation"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />
              <Home className="w-5 h-5 mb-0.5" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-tight">Home</span>
          </button>

          {/* Practice Tab */}
          <button
            onClick={() => handleNav('solo_quest')}
            className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-slate-400 hover:text-slate-200 active:scale-95 transition-all touch-manipulation"
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-mono font-semibold tracking-tight">Practice</span>
          </button>

          {/* CENTER ELEVATED ACTION BUTTON (Arena 1v1) */}
          <div className="relative -top-3 flex flex-col items-center">
            <button
              onClick={() => handleNav('lobby')}
              className="w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_4px_20px_rgba(124,58,237,0.6)] active:scale-90 transition-all touch-manipulation flex items-center justify-center"
              aria-label="Enter Arena"
            >
              <div className="w-full h-full rounded-[14px] bg-[#0c1017]/40 flex items-center justify-center text-white">
                <Swords className="w-6 h-6 animate-pulse" />
              </div>
            </button>
            <span className="text-[9.5px] font-cyber font-bold text-violet-300 mt-0.5 tracking-wider">
              ARENA
            </span>
          </div>

          {/* Leaderboard Tab */}
          <button
            onClick={() => handleNav('leaderboard')}
            className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-slate-400 hover:text-slate-200 active:scale-95 transition-all touch-manipulation"
          >
            <Trophy className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-mono font-semibold tracking-tight">Ranks</span>
          </button>

          {/* Account / Dashboard Tab */}
          <button
            onClick={() => {
              if (userProfile.isGuest) {
                handleNav('auth');
              } else {
                handleNav('profile');
              }
            }}
            className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-slate-400 hover:text-slate-200 active:scale-95 transition-all touch-manipulation"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-mono font-semibold tracking-tight">
              {userProfile.isGuest ? 'Sign In' : 'Account'}
            </span>
          </button>
        </div>

        {/* Android Home Gesture Indicator Bar */}
        <div className="w-28 h-1 bg-white/20 rounded-full mx-auto mt-1" />
      </nav>
    </div>
  );
};
