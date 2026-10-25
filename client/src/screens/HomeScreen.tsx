import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { CyberNavBar } from '../components/navigation/CyberNavBar.js';
import { HoloCore3D } from '../components/arena3d/HoloCore3D.js';
import { CyberTiltCard } from '../components/ui/CyberTiltCard.js';
import {
  Swords,
  Users,
  Compass,
  Sparkles,
  Flame,
  ArrowRight,
  Cpu,
  ShieldCheck,
  Zap,
  TrendingUp,
  LayoutDashboard,
  Trophy,
  Play,
  Terminal,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  const [activeTab, setActiveTab] = useState<'arena' | 'sandbox' | 'social' | 'sound'>('arena');

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-y-auto select-none relative">
      <CyberNavBar activeTab="home" />

      {/* 3D Perspective Wireframe Scrolling Floor */}
      <div className="cyber-grid-floor" />

      {/* Cyber Ambient Lighting Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Esports Live Broadcast Telemetry Ticker */}
      <div className="w-full bg-[#05060f]/90 border-b border-violet-500/20 py-2 px-4 overflow-hidden z-20 shrink-0 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="text-rose-400 font-bold uppercase tracking-wider text-[11px] shrink-0">
              ESPORTS TELEMETRY:
            </span>
            <span className="text-slate-300 truncate text-[11px]">
              ⚡ Tournament #701 Open (70 Players • 20s Clock) • FlashBinary_AI solved Two-Pointer in 2.1s (+2,800 Aura)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-5 text-slate-400 text-[11px] shrink-0">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Combatants: <strong className="text-cyan-400">1,480 Online</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tickrate: <strong className="text-white">60Hz</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section with Interactive 3D HoloCore Stage */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12 flex flex-col items-center text-center z-10 w-full">
        {/* Holographic Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/70 via-slate-900 to-violet-950/70 border border-cyan-400/50 text-cyan-300 text-xs font-mono mb-5 shadow-[0_0_25px_rgba(0,240,255,0.25)] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tracking-wider">SYNCHRONIZED MULTIPLAYER ALGORITHMIC ESPORTS</span>
        </div>

        {/* Platform Brand Logo Hero */}
        <div className="relative mb-3 group">
          <div className="absolute inset-0 bg-violet-600/35 rounded-full blur-2xl group-hover:bg-violet-500/50 transition-all scale-110" />
          <img
            src="/logo.png"
            alt="Clutch Platform Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_35px_rgba(168,85,247,0.75)] relative z-10 transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Big Glitch Hero Heading */}
        <h1 className="font-cyber font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-wider mb-2 leading-none">
          CLUTCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 glow-cyan">ARENA</span>
        </h1>

        <div className="text-xs sm:text-sm font-cyber font-bold tracking-[0.25em] text-violet-300/90 mb-4 uppercase">
          Online Puzzle Game Platform
        </div>

        <p className="max-w-2xl text-slate-300 text-xs sm:text-sm sm:leading-relaxed mb-6 font-mono">
          The ultimate competitive coding battleground. Battle in 70-player synchronized arenas with 20-second blitz countdowns, conquer rapid-fire algorithmic Brainrot shorts reels, level up your 3D Cyber Avatar, and flex your Aura.
        </p>

        {/* Interactive 3D Quantum Core Hero Stage */}
        <div className="w-full max-w-lg h-72 sm:h-80 relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          <HoloCore3D theme="cyan" height="100%" enableControls={true} />
          <div className="absolute bottom-2 text-[10px] font-mono text-cyan-400/80 bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-md pointer-events-none">
            DRAG TO ROTATE 3D HOLO-CORE ⚡
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl my-6">
          <button
            onClick={() => {
              soundSynth.click();
              setScreen('lobby');
            }}
            className="w-full sm:w-1/3 cyber-btn cyber-btn-cyan py-3.5 text-xs flex items-center justify-center gap-2"
          >
            <Swords className="w-4 h-4" />
            <span>ENTER ARENA</span>
          </button>

          <button
            onClick={() => {
              soundSynth.airhorn();
              setScreen('brainrot_shorts');
            }}
            className="w-full sm:w-1/3 py-3.5 px-3 rounded-lg bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:scale-95 text-white font-cyber font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_25px_rgba(244,63,94,0.45)] transition-all"
          >
            <span>BRAINROT SHORTS 📱</span>
          </button>

          <button
            onClick={() => {
              soundSynth.click();
              setScreen('dashboard');
            }}
            className="w-full sm:w-1/3 cyber-btn cyber-btn-outline py-3.5 text-xs flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-violet-400" />
            <span>DASHBOARD</span>
          </button>
        </div>
      </section>

      {/* Featured Game Modes Grid (with 3D Tilt Cards) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 z-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-cyber font-black text-xl sm:text-2xl text-white tracking-wide flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>COMPETITIVE MODES</span>
            </h2>
            <p className="text-slate-400 text-xs font-mono">Select your battleground and enter queue</p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            SEASON 4 ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: 70-Player Grand Tournament */}
          <CyberTiltCard
            glowColor="amber"
            onClick={() => {
              soundSynth.click();
              setScreen('lobby');
            }}
            className="p-5 flex flex-col justify-between h-72 border-2 border-amber-500/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-cyber font-black text-[9px] rounded-bl-lg shadow">
              GRAND TOURNAMENT 👑
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 text-2xl">
                ⚡
              </div>
              <h3 className="font-cyber font-black text-lg text-white mb-1 hover:text-amber-300 transition-colors">
                70-Player Blitz Arena
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                70 players, identical questions, 20-second timer per question (~10 min session). Fastest accurate solvers take the podium with Coin bounties!
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono">
              <span className="text-amber-400 font-bold">25 Qs • 20s Clocks</span>
              <span className="text-cyan-300 flex items-center gap-1">
                <span>QUEUE NOW</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CyberTiltCard>

          {/* Card 2: 1v1 Ranked Duel */}
          <CyberTiltCard
            glowColor="cyan"
            onClick={() => {
              soundSynth.click();
              setScreen('lobby');
            }}
            className="p-5 flex flex-col justify-between h-72"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="font-cyber font-black text-lg text-white mb-1 hover:text-cyan-300 transition-colors">
                1v1 Ranked Duel
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                Head-to-head algorithm face-off. Real-time test-case progression, combo streaks, sabotage debuffs, and instant MMR shifts.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono">
              <span className="text-cyan-400 font-bold">Competitive MMR</span>
              <span className="text-cyan-300 flex items-center gap-1">
                <span>FIND DUEL</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CyberTiltCard>

          {/* Card 3: Brainrot Algorithmic Shorts */}
          <CyberTiltCard
            glowColor="rose"
            onClick={() => {
              soundSynth.airhorn();
              setScreen('brainrot_shorts');
            }}
            className="p-5 flex flex-col justify-between h-72 border-rose-500/30"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-2xl mb-4">
                📱
              </div>
              <h3 className="font-cyber font-black text-lg text-white mb-1 hover:text-rose-300 transition-colors">
                DSA Brainrot Shorts
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                TikTok-style algorithmic swipe reel. Decide CAP 🧢 or NO CAP 🔥 in 12s with synthesized vine booms, speech casting, and Aura streaks.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono">
              <span className="text-rose-400 font-bold">24 Dynamic Cards</span>
              <span className="text-rose-300 flex items-center gap-1">
                <span>WATCH REEL</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CyberTiltCard>
        </div>
      </section>

      {/* Interactive Tech Architecture Showcase (Terminal HUD) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 z-10 w-full">
        <div className="w-full bg-[#070814]/90 border border-violet-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl tech-corner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-cyber font-black text-lg text-white">TECH ARCHITECTURE STACK</h3>
                <span className="text-[10px] font-mono text-slate-400">ISOLATED PROCESSES • 3D SHADERS • WEBSOCKET MESH</span>
              </div>
            </div>

            {/* Showcase Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['arena', 'sandbox', 'social', 'sound'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-xs font-mono capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left items-center">
            {activeTab === 'arena' && (
              <>
                <div>
                  <span className="text-xs font-cyber text-cyan-400 font-bold mb-1 block">SPATIAL THREE.JS ENGINE</span>
                  <h4 className="font-cyber font-extrabold text-xl text-white mb-2">Synchronized 3D Multi-User Field</h4>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Render dozens of concurrent avatars around the arena perimeter with customizable drip aura rings, floating titles, and spatial status indicators (coding, solved, eliminated).
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">WebGL 2.0</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">R3F / Drei</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">60 FPS Hardware Render</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-hidden">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 mb-2">ARENA_SPATIAL_COORDINATES.log</div>
                  <pre className="text-[11px] leading-relaxed text-slate-300">
{`> Initializing 70-Player Arena...
> Mesh: QuantumToroid V4
> Particle Dust Count: 45 nodes
> Synchronized Expiration Clock: 20.00s
> Status: ACTIVE (Tickrate 60Hz)`}
                  </pre>
                </div>
              </>
            )}

            {activeTab === 'sandbox' && (
              <>
                <div>
                  <span className="text-xs font-cyber text-emerald-400 font-bold mb-1 block">SECURITY SANDBOX</span>
                  <h4 className="font-cyber font-extrabold text-xl text-white mb-2">Real Isolated Child Process Execution</h4>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Python code executed in stripped isolated environments with strict memory boundaries, 4-second timeouts, and automatic memory cleanup.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">ChildProcess Spawn</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Stripped ENV</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SIGKILL on Timeout</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-hidden">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 mb-2">ISOLATED_RUNNER.log</div>
                  <pre className="text-[11px] leading-relaxed text-slate-300">
{`> Compiling Python Sandbox...
> TestCase #1: [2, 7, 11, 15], 9 -> [0, 1] [PASSED 18ms]
> TestCase #2: [3, 2, 4], 6       -> [1, 2] [PASSED 14ms]
> Result: 100% Correct. Speed Bonus: +48 pts`}
                  </pre>
                </div>
              </>
            )}

            {activeTab === 'social' && (
              <>
                <div>
                  <span className="text-xs font-cyber text-rose-400 font-bold mb-1 block">AURA ECONOMY</span>
                  <h4 className="font-cyber font-extrabold text-xl text-white mb-2">Aura Points, Memes &amp; Twitch Hype</h4>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Send floating meme reactions (Skull 💀, GigaChad 🗿, Clowns 🤡, Fire 🔥), unleash Sabotage power-ups (Uno Reverse, Sigma Shield), and earn Drip Auras.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Meme Stream</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Sabotage Buffs</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Aura Stacking</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 overflow-hidden">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 mb-2">HYPE_STREAM.log</div>
                  <pre className="text-[11px] leading-relaxed text-slate-300">
{`> Player deployed Uno Reverse card!
> Aura delta: +2,400 (Sigma Streak x4)
> Hype reaction: 🗿 GigaChad emitted
> AuraBot 9000: "W Rizz! Bro solved in 1.4s!"`}
                  </pre>
                </div>
              </>
            )}

            {activeTab === 'sound' && (
              <>
                <div>
                  <span className="text-xs font-cyber text-amber-400 font-bold mb-1 block">SYNTHETIC AUDIO</span>
                  <h4 className="font-cyber font-extrabold text-xl text-white mb-2">Pure Web Audio API Synthesizer</h4>
                  <p className="text-slate-300 text-xs leading-relaxed mb-4">
                    Zero external MP3 dependencies. Generates dynamic frequency ramps, sine/sawtooth vine booms, airhorns, and Web Speech API hype-casting on demand.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">AudioContext</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Oscillator Nodes</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SpeechSynthesis</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 overflow-hidden">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 mb-2">SYNTH_OSCILLATOR.log</div>
                  <pre className="text-[11px] leading-relaxed text-slate-300">
{`> Oscillator: Sine 120Hz -> 30Hz exponential
> GainNode: 1.0 -> 0.01 in 800ms (VineBoom)
> Hype Voice design: Pitch 1.3, Rate 1.15
> Audio Engine: READY`}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Cyber Footer */}
      <footer className="w-full bg-[#020205] border-t border-slate-800/80 py-8 px-4 sm:px-6 z-10 text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Clutch Logo" className="w-6 h-6 object-contain" />
            <span className="text-violet-300 font-cyber font-black text-sm">CLUTCH ARENA</span>
            <span>• Online Puzzle Game Platform v2.4</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setScreen('solo_quest')} className="hover:text-cyan-400 transition-colors">Campaign</button>
            <button onClick={() => setScreen('dashboard')} className="hover:text-cyan-400 transition-colors">Dashboard</button>
            <button onClick={() => setScreen('profile')} className="hover:text-cyan-400 transition-colors">Profile</button>
            <button onClick={() => setScreen('settings')} className="hover:text-cyan-400 transition-colors">Settings</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
