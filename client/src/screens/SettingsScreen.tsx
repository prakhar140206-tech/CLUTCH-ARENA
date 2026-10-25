import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { CyberNavBar } from '../components/navigation/CyberNavBar.js';
import {
  Settings,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Eye,
  Monitor,
  Code2,
  Trash2,
  LogOut,
  Sparkles,
  Check,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const logoutUser = useGameStore((s) => s.logoutUser);
  const is3DFallback = useGameStore((s) => s.is3DFallback);
  const toggle3DFallback = useGameStore((s) => s.toggle3DFallback);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const editorTheme = useGameStore((s) => s.editorTheme);
  const editorFontSize = useGameStore((s) => s.editorFontSize);
  const preferredLanguage = useGameStore((s) => s.preferredLanguage);
  const setEditorSettings = useGameStore((s) => s.setEditorSettings);

  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [voiceOn, setVoiceOn] = useState<boolean>(soundSynth.isVoiceEnabled());

  const handleToggleVoice = () => {
    const next = soundSynth.toggleVoice();
    setVoiceOn(next);
    if (next) soundSynth.speakHype('AI Voice Caster active!', 'hype');
  };

  const handleToggleAudio = () => {
    toggleSfx();
    soundSynth.toggleSfx();
  };

  const handleSave = () => {
    soundSynth.levelUp();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleLogout = () => {
    soundSynth.vineBoom();
    logoutUser();
    setScreen('home');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset combat stats and reload?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-y-auto select-none relative">
      <CyberNavBar activeTab="settings" />

      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 flex flex-col gap-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-violet-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-cyber font-black text-xl text-white tracking-wide">
                SYSTEM & CLIENT SETTINGS
              </h1>
              <p className="text-[11px] font-mono text-slate-400">
                Configure audio synthesis, 3D graphics rendering, and IDE preferences.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="cyber-btn cyber-btn-cyan px-5 py-2 text-xs flex items-center gap-1.5"
          >
            {savedToast ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{savedToast ? 'SAVED' : 'SAVE CHANGES'}</span>
          </button>
        </div>

        {/* Section 1: Audio Synthesizer & Voice Caster */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-violet-500/25 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h2 className="font-cyber font-bold text-sm text-white tracking-wider">
              WEB AUDIO SYNTHESIZER & AI VOICE CASTER
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SFX Synth Toggle */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-cyber font-bold text-white">Audio SFX Engine</div>
                <div className="text-[10px] text-slate-400 font-mono">Procedural waveforms & sub-bass</div>
              </div>
              <button
                onClick={handleToggleAudio}
                className={`p-2 rounded-lg border transition-all ${
                  sfxEnabled
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* AI Voice Caster Toggle */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-cyber font-bold text-white">AuraBot Voice Commentary</div>
                <div className="text-[10px] text-slate-400 font-mono">Speech synthesis esports roasts</div>
              </div>
              <button
                onClick={handleToggleVoice}
                className={`p-2 rounded-lg border transition-all ${
                  voiceOn
                    ? 'bg-violet-600/30 border-violet-400 text-violet-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {voiceOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Audio Test Playground */}
          <div className="pt-2">
            <div className="text-[11px] font-cyber text-slate-400 mb-2">TEST SYNTHETIC AUDIO GENERATION:</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => soundSynth.vineBoom()}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono hover:bg-rose-900/60 transition-colors"
              >
                💀 Vine Boom
              </button>
              <button
                onClick={() => soundSynth.auraGlow()}
                className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono hover:bg-amber-900/60 transition-colors"
              >
                👑 Aura Glow Chime
              </button>
              <button
                onClick={() => soundSynth.airhorn()}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono hover:bg-cyan-900/60 transition-colors"
              >
                🎺 Airhorn Blast
              </button>
              <button
                onClick={() => soundSynth.levelUp()}
                className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono hover:bg-purple-900/60 transition-colors"
              >
                ⭐ 8-Bit Level Up
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: 3D Graphics & Display Settings */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-violet-500/25 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-violet-400" />
            <h2 className="font-cyber font-bold text-sm text-white tracking-wider">
              3D GRAPHICS & VIEWPORT RENDERING
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-cyber font-bold text-white">Three.js 3D Arena Viewport</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Toggle between 3D cyber platform vs high-performance 2D Hologram HUD
              </div>
            </div>
            <button
              onClick={toggle3DFallback}
              className={`px-4 py-2 rounded-lg border text-xs font-cyber font-bold transition-all ${
                is3DFallback
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              }`}
            >
              {is3DFallback ? '2D HUD MODE' : '3D ARENA ACTIVE'}
            </button>
          </div>
        </div>

        {/* Section 3: Code Sprint IDE Preferences */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-violet-500/25 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <h2 className="font-cyber font-bold text-sm text-white tracking-wider">
              CODE SPRINT IDE & COMPILER PREFERENCES
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Language */}
            <div>
              <label className="text-xs font-cyber text-slate-300 block mb-2">
                DEFAULT CODING LANGUAGE
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                {(['python', 'javascript', 'cpp', 'java'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setEditorSettings({ preferredLanguage: lang })}
                    className={`py-2 rounded-lg border uppercase text-center transition-all ${
                      preferredLanguage === lang
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs font-cyber text-slate-300 block mb-2">
                IDE FONT SIZE ({editorFontSize}px)
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                {[12, 14, 16, 18].map((size) => (
                  <button
                    key={size}
                    onClick={() => setEditorSettings({ editorFontSize: size })}
                    className={`py-2 rounded-lg border text-center transition-all ${
                      editorFontSize === size
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Account & Security */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-rose-500/25 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h2 className="font-cyber font-bold text-sm text-white tracking-wider">
              ACCOUNT & SESSION CONTROLS
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <div className="text-xs font-cyber font-bold text-white">
                Active Session: {userProfile.username} ({userProfile.isGuest ? 'Guest' : 'Verified'})
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                MMR: {userProfile.ratingMMR} • Aura: {(userProfile.auraPoints || 48500).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetData}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-400 text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Cache</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-300 hover:bg-rose-900/80 text-xs font-cyber font-bold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{userProfile.isGuest ? 'SWITCH ACCOUNT' : 'SIGN OUT'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
