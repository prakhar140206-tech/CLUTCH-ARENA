import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { CyberNavBar } from '../components/navigation/CyberNavBar.js';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Code2,
  Zap,
  CheckCircle2,
  Terminal
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const loginUser = useGameStore((s) => s.loginUser);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [handle, setHandle] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [selectedTitle, setSelectedTitle] = useState<string>('Dijkstra’s Favorite Child 👑');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setErrorMsg('Please enter your gamer handle or email');
      soundSynth.vineBoom();
      return;
    }
    soundSynth.levelUp();
    loginUser(handle.trim(), email.trim() || undefined);
    setSuccessMsg('Authentication successful! Loading Cyber Arena...');
    soundSynth.speakHype(`Welcome back, ${handle}! Lock in!`, 'hype');
    setTimeout(() => {
      setScreen('dashboard');
    }, 1200);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setErrorMsg('Please choose an esports callsign handle');
      soundSynth.vineBoom();
      return;
    }
    soundSynth.airhorn();
    loginUser(handle.trim(), email.trim() || `${handle.toLowerCase()}@cyber.arena`);
    updateUserProfile({
      equippedTitle: selectedTitle,
      preferredLanguage: selectedLanguage,
      auraPoints: 50000,
      auraTitle: 'Algorithm Rizzler'
    });
    setSuccessMsg('Account minted on the algorithm chain! +50,000 Starting Aura awarded!');
    soundSynth.speakHype(`Welcome to the battle arena, ${handle}! Let him cook!`, 'hype');
    setTimeout(() => {
      setScreen('dashboard');
    }, 1400);
  };

  const handleGuestQuickplay = () => {
    soundSynth.click();
    soundSynth.speakHype('Guest access granted! Initializing dashboard!', 'normal');
    setScreen('dashboard');
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-y-auto select-none relative">
      <CyberNavBar activeTab="auth" />

      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Cyber Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 border-2 border-violet-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center group">
              <div className="absolute inset-0 bg-violet-600/40 rounded-full blur-xl group-hover:bg-violet-500/60 transition-all scale-110" />
              <img
                src="/logo.png"
                alt="Clutch Logo"
                className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.7)] relative z-10"
              />
            </div>
            <h2 className="font-cyber font-black text-2xl text-white tracking-wider">
              CLUTCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">PASSPORT</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-mono">
              Authenticate to synchronize your Aura, MMR, and 3D Loadouts.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6 text-xs font-cyber">
            <button
              onClick={() => {
                soundSynth.click();
                setTab('login');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg font-bold transition-all ${
                tab === 'login'
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => {
                soundSynth.click();
                setTab('signup');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg font-bold transition-all ${
                tab === 'signup'
                  ? 'bg-violet-600/30 border border-violet-400 text-violet-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              REGISTER (+50K AURA)
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-rose-950/70 border border-rose-500 text-rose-300 text-xs font-mono animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-950/70 border border-emerald-400 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-cyber font-bold text-slate-300 block mb-1">
                  CALLSIGN HANDLE OR EMAIL
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CyberNinja_42"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-cyber font-bold text-slate-300 block mb-1">
                  CYBER KEY (PASSWORD)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full cyber-btn cyber-btn-cyan py-3 text-xs flex items-center justify-center gap-2 font-bold shadow-lg"
              >
                <span>ENTER ARENA GATE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-xs font-cyber font-bold text-slate-300 block mb-1">
                  CHOOSE ESPORTS CALLSIGN
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. AlgorithmDemon"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-violet-400 text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-cyber font-bold text-slate-300 block mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="coder@algo.esports"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-violet-400 text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-cyber font-bold text-slate-300 block mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-violet-400 text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Starter Weapon / Language */}
              <div>
                <label className="text-xs font-cyber font-bold text-amber-300 block mb-1">
                  PREFERRED CODING ENGINE
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                  {(['python', 'javascript', 'cpp', 'java'] as const).map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`py-1.5 rounded border uppercase text-center transition-all ${
                        selectedLanguage === lang
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full cyber-btn cyber-btn-violet py-3 text-xs flex items-center justify-center gap-2 font-bold shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>CREATE ACCOUNT (+50K AURA)</span>
              </button>
            </form>
          )}

          {/* Guest Shortcut */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              onClick={handleGuestQuickplay}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Or continue as instant guest ({userProfile.username})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
