import React from 'react';
import { useGameStore } from '../store/gameStore.js';
import { CLUTCH_LOGO } from '../config/assets.js';
import { Swords, Compass, ShieldAlert, Cpu, Sparkles, ChevronRight, UserPlus } from 'lucide-react';

export const CinematicScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  return (
    <div className="relative w-full max-w-full min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-[#080811] overflow-hidden select-none px-4">
      {/* Background Cyber Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber Grid Lines Effect */}
      <div className="scanline-effect" />

      {/* Hero Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-4 animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>NEXT-GEN 3D MULTIPLAYER DSA ESPORTS</span>
      </div>

      {/* Platform Brand Logo Hero */}
      <div className="relative mb-3 group">
        <div className="absolute inset-0 bg-violet-600/40 rounded-full blur-2xl group-hover:bg-violet-500/60 transition-all scale-125" />
        <img
          src={CLUTCH_LOGO}
          alt="Clutch Platform Logo"
          className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-[0_0_35px_rgba(168,85,247,0.8)] relative z-10 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Main Title */}
      <h1 className="font-cyber font-black text-4xl sm:text-6xl md:text-7xl text-center text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 tracking-wider mb-2">
        CLUTCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400">ARENA</span>
      </h1>

      <div className="text-xs sm:text-sm font-cyber font-bold tracking-[0.25em] text-violet-300/90 mb-4 uppercase">
        Online Puzzle Game Platform
      </div>

      <p className="max-w-xl text-center text-slate-400 text-xs sm:text-sm mb-8 leading-relaxed font-normal">
        Compete in synchronized 3D cyber arenas. Master Data Structures and Algorithms through real code execution, interactive visual puzzles, and competitive 100-player battles.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl mb-10 z-10">
        <button
          onClick={() => setScreen('lobby')}
          className="w-full sm:w-1/3 cyber-btn cyber-btn-cyan py-3.5 text-xs flex items-center justify-center gap-2 font-bold"
        >
          <Swords className="w-4 h-4" />
          <span>ENTER ARENA</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setScreen('brainrot_shorts')}
          className="w-full sm:w-1/3 py-3.5 px-3 rounded-md bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:scale-95 text-white font-cyber font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all"
        >
          <span>BRAINROT SHORTS 📱</span>
        </button>

        <button
          onClick={() => setScreen('solo_quest')}
          className="w-full sm:w-1/3 cyber-btn cyber-btn-outline py-3.5 text-xs flex items-center justify-center gap-2 font-bold"
        >
          <Compass className="w-4 h-4 text-violet-400" />
          <span>SOLO QUEST</span>
        </button>
      </div>


      {/* Feature Tickers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full z-10">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-violet-500/20 backdrop-blur-md flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-cyber font-bold text-slate-200">Real Code Runner</div>
            <div className="text-[10px] text-slate-400">Python, JS, C++, Java</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-violet-500/20 backdrop-blur-md flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-violet-400 shrink-0" />
          <div>
            <div className="text-xs font-cyber font-bold text-slate-200">100-Player Arena</div>
            <div className="text-[10px] text-slate-400">Shared match clock</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-violet-500/20 backdrop-blur-md flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-cyber font-bold text-slate-200">Visual Puzzles</div>
            <div className="text-[10px] text-slate-400">BST, Heaps, Pointers</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-violet-500/20 backdrop-blur-md flex items-center gap-3">
          <Swords className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-cyber font-bold text-slate-200">6 AI Bots</div>
            <div className="text-[10px] text-slate-400">Adaptive skill policies</div>
          </div>
        </div>
      </div>

      {/* Guest Profile Indicator */}
      <div className="absolute bottom-4 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
        <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
        <span>Playing as guest: <strong className="text-slate-300">{userProfile.username}</strong></span>
      </div>
    </div>
  );
};
