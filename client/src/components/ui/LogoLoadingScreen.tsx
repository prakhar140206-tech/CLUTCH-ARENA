import React, { useState, useEffect } from 'react';
import { CLUTCH_LOGO } from '../../config/assets.js';
import { soundSynth } from '../../services/soundSynth.js';
import { Sparkles, Terminal, Shield, Zap, ChevronRight } from 'lucide-react';

interface LogoLoadingScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

const SYSTEM_BOOT_LOGS = [
  { progress: 15, text: 'BOOTING NEURAL EXECUTION ENGINE...' },
  { progress: 38, text: 'CONNECTING WEBSOCKET COMBAT SHARDS...' },
  { progress: 62, text: 'CALIBRATING 13 DSA MASTERY DISCIPLINES...' },
  { progress: 85, text: 'VERIFYING SANDBOX ISOLATION & ANTI-CHEAT...' },
  { progress: 100, text: 'COMBAT GRID ONLINE. WELCOME TO CLUTCH ARENA.' }
];

export const LogoLoadingScreen: React.FC<LogoLoadingScreenProps> = ({
  onFinish,
  durationMs = 2100
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentLog, setCurrentLog] = useState<string>(SYSTEM_BOOT_LOGS[0].text);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      // Find matching boot log
      const matchedLog = SYSTEM_BOOT_LOGS.find((l) => pct <= l.progress) || SYSTEM_BOOT_LOGS[SYSTEM_BOOT_LOGS.length - 1];
      setCurrentLog(matchedLog.text);

      if (pct >= 100) {
        clearInterval(interval);
        try {
          soundSynth.levelUp();
        } catch {
          // Audio optional
        }
        setIsFadingOut(true);
        setTimeout(() => {
          onFinish();
        }, 450);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [durationMs, onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060713] select-none transition-all duration-500 overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 3D Cyber Wireframe Floor */}
      <div className="cyber-grid-floor" />

      {/* Atmospheric Neon Radial Ambient Spotlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-clutch-violet/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Futuristic Corner HUD Bracket Markers */}
      <div className="absolute top-6 left-6 font-mono text-[10px] text-clutch-subtle flex flex-col gap-0.5 pointer-events-none hidden sm:flex">
        <span className="text-clutch-lavender">SYS_BOOT // CLUTCH_v2.4.0</span>
        <span>NODE: ASIA_PACIFIC_01</span>
      </div>
      <div className="absolute top-6 right-6 font-mono text-[10px] text-clutch-subtle text-right pointer-events-none hidden sm:block">
        <span className="text-emerald-400 flex items-center gap-1.5 justify-end">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          SANDBOX SECURE
        </span>
        <span>LATENCY: 12ms</span>
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[10px] text-clutch-subtle pointer-events-none hidden sm:block">
        <span>MEM_ALLOC: 512MB [OPTIMAL]</span>
      </div>
      <div className="absolute bottom-6 right-6">
        <button
          onClick={handleSkip}
          className="text-xs font-mono text-clutch-muted hover:text-white px-3 py-1 rounded-md border border-clutch-border/40 hover:border-clutch-violet/60 bg-clutch-surface/40 backdrop-blur transition-all flex items-center gap-1"
        >
          <span>Skip</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Stage: Holographic Pod & Animated Logo */}
      <div className="relative flex flex-col items-center justify-center z-10 px-4">
        
        {/* Outer Rotating Radar Ring */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-8">
          {/* Reverse Outer Dashed SVG Ring */}
          <svg className="absolute inset-0 w-full h-full animate-radar-reverse pointer-events-none opacity-40" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="0.8"
              strokeDasharray="4 8"
            />
          </svg>

          {/* Forward Inner Cyan Tech Ring */}
          <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-radar-spin pointer-events-none opacity-60" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.2"
              strokeDasharray="12 18 4 10"
            />
          </svg>

          {/* Pulsing Ambient Halo */}
          <div className="absolute inset-4 rounded-3xl bg-clutch-violet/20 border border-clutch-violet/40 animate-pulse-ring blur-[2px]" />

          {/* Glassmorphic Cyber Logo Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-clutch-violet/30 via-clutch-surface-elevated to-clutch-surface p-4 border border-clutch-violet/60 shadow-[0_0_35px_rgba(124,58,237,0.45)] flex items-center justify-center overflow-hidden">
            {/* Holographic Scanline Laser Beam */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#06b6d4] animate-scanline pointer-events-none z-20" />

            {/* CLUTCH Brand Logo */}
            <img
              src={CLUTCH_LOGO}
              alt="CLUTCH Arena"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(167,139,250,0.5)] transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Title with Glowing Cyber Font */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="font-cyber font-black text-2xl sm:text-3xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]">
              CLUTCH
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-clutch-violet/30 text-clutch-lavender border border-clutch-violet/60 font-cyber font-bold tracking-wider shadow-[0_0_10px_rgba(124,58,237,0.4)]">
              ARENA
            </span>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-clutch-muted uppercase">
            Real-Time Algorithmic Esports Platform
          </span>
        </div>

        {/* High-Tech Progress Bar */}
        <div className="w-64 sm:w-80 flex flex-col gap-2">
          {/* Bar track */}
          <div className="w-full h-2 rounded-full bg-clutch-surface-light border border-clutch-border overflow-hidden p-0.5 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-clutch-violet via-clutch-lavender to-cyan-400 transition-all duration-75 relative shadow-[0_0_10px_rgba(124,58,237,0.7)]"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer flare at head of progress */}
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 rounded-full blur-[1px]" />
            </div>
          </div>

          {/* Progress Percent and Status */}
          <div className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-clutch-lavender truncate max-w-[200px] sm:max-w-[240px]">
              <Terminal className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
              <span className="truncate">{currentLog}</span>
            </div>
            <span className="text-white font-bold ml-2 shrink-0">{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );
};
