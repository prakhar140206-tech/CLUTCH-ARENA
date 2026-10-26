import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { CLUTCH_LOGO } from '../config/assets.js';
import { API_BASE_URL } from '../config/api.js';
import { Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const loginUser = useGameStore((s) => s.loginUser);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [emailOrHandle, setEmailOrHandle] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrHandle.trim()) {
      setErrorMsg('Please enter your email or player callsign');
      soundSynth.vineBoom();
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your account password');
      soundSynth.vineBoom();
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const cleanInput = emailOrHandle.trim();
      const bodyPayload = isRegister
        ? {
            username: cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput,
            email: cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@clutch.gg`,
            password: password.trim()
          }
        : {
            username: cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput,
            password: password.trim()
          };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication error. Please check your credentials.');
        soundSynth.vineBoom();
        return;
      }

      loginUser(data.profile.username, data.profile.email);
      updateUserProfile(data.profile);
      soundSynth.levelUp();
      setScreen('dashboard');
    } catch {
      // Local fallback
      loginUser(emailOrHandle.trim(), `${emailOrHandle.toLowerCase()}@clutch.gg`);
      soundSynth.levelUp();
      setScreen('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    soundSynth.click();
    const guestCallsign = `${provider}_pilot_${Math.floor(100 + Math.random() * 900)}`;
    loginUser(guestCallsign, `${guestCallsign}@clutch.gg`);
    soundSynth.levelUp();
    setScreen('dashboard');
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#090d10] text-slate-100 p-4 select-none relative font-sans overflow-y-auto">
      {/* Background Perspective Ground Grid */}
      <div className="cyber-grid-floor opacity-50" />

      {/* Ambient Neon Atmosphere Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Authentication Card matching Image 4 Top-Left */}
      <div className="w-full max-w-md rounded-2xl bg-[#0f151c]/95 border border-white/10 p-8 sm:p-10 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(34,197,94,0.15)] relative z-10 flex flex-col items-center text-center my-auto">
        {/* Emblem Logo */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 p-2.5 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.35)]">
          <img src={CLUTCH_LOGO} alt="CLUTCH" className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
        </div>

        <span className="font-cyber font-black text-sm tracking-wider text-emerald-400 mb-1">
          CLUTCH-ARENA
        </span>

        <h2 className="font-cyber font-black text-xl sm:text-2xl text-white tracking-wider uppercase mb-6">
          {isRegister ? 'CREATE ACCOUNT' : 'LOGIN / REGISTER'}
        </h2>

        {errorMsg && (
          <div className="w-full p-2.5 mb-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Email Address"
              value={emailOrHandle}
              onChange={(e) => setEmailOrHandle(e.target.value)}
              className="w-full bg-[#141b22] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
          </div>

          <div className="relative flex items-center gap-2">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-[#141b22] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />

            {/* Neon SIGN IN Button */}
            <button
              type="submit"
              disabled={loading}
              className="clutch-btn-neon px-5 py-3 text-xs font-black tracking-wider uppercase shrink-0"
            >
              {isRegister ? 'SIGN UP' : 'SIGN IN'}
            </button>
          </div>
        </form>

        {/* OR CONTINUE WITH Divider */}
        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
            OR CONTINUE WITH
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social Authentication Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => handleSocialAuth('github')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#141b22] border border-white/10 hover:border-slate-400 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Github className="w-4 h-4 text-white" />
            <span>GitHub</span>
          </button>

          <button
            onClick={() => handleSocialAuth('google')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#141b22] border border-white/10 hover:border-slate-400 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Chrome className="w-4 h-4 text-emerald-400" />
            <span>Google</span>
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="mt-6 text-xs font-mono text-slate-400">
          <span>{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
          <button
            onClick={() => {
              soundSynth.click();
              setIsRegister(!isRegister);
            }}
            className="text-emerald-400 font-bold hover:underline"
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};
