import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
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
    if (confirm('Are you sure you want to reset local settings and combat stats?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <AppShell activeScreen="settings">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-clutch-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-cyber font-bold text-xl text-white">
                CLIENT SETTINGS
              </h1>
              <p className="text-xs font-mono text-clutch-muted">
                Configure audio synthesis, 3D graphics rendering, and IDE preferences
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="clutch-btn-primary px-5 py-2 text-xs flex items-center gap-1.5"
          >
            {savedToast ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{savedToast ? 'Saved ✔' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Section 1: Audio Engine */}
        <div className="clutch-panel rounded-2xl p-6">
          <h2 className="font-cyber font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-clutch-lavender" />
            <span>SYNTHETIC AUDIO ENGINE</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-clutch-border">
              <div>
                <div className="text-sm font-semibold text-white">Synthesizer Sound Effects</div>
                <div className="text-xs font-mono text-clutch-muted">Web Audio API procedural sound cues (clicks, vine booms, level-ups)</div>
              </div>
              <button
                onClick={handleToggleAudio}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  sfxEnabled ? 'bg-clutch-violet' : 'bg-clutch-surface-light border border-clutch-border'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${sfxEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-semibold text-white">Speech Synthesis Hype Caster</div>
                <div className="text-xs font-mono text-clutch-muted">Speech synthesis caster announcing streaks and round results</div>
              </div>
              <button
                onClick={handleToggleVoice}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  voiceOn ? 'bg-clutch-violet' : 'bg-clutch-surface-light border border-clutch-border'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${voiceOn ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Graphics & Rendering */}
        <div className="clutch-panel rounded-2xl p-6">
          <h2 className="font-cyber font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-clutch-lavender" />
            <span>GRAPHICS & 3D HARDWARE</span>
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-semibold text-white">Low-Power 2D Fallback Mode</div>
              <div className="text-xs font-mono text-clutch-muted">Bypasses WebGL 3D rendering to save GPU and battery on low-end hardware</div>
            </div>
            <button
              onClick={toggle3DFallback}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                is3DFallback ? 'bg-clutch-amber' : 'bg-clutch-surface-light border border-clutch-border'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${is3DFallback ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section 3: Code Editor Preferences */}
        <div className="clutch-panel rounded-2xl p-6">
          <h2 className="font-cyber font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-clutch-lavender" />
            <span>CODE SPRINT PREFERENCES</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-1.5">DEFAULT PROGRAMMING LANGUAGE</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setEditorSettings({ preferredLanguage: e.target.value as any })}
                className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node)</option>
                <option value="cpp">C++ (G++17)</option>
                <option value="java">Java 21</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-1.5">EDITOR FONT SIZE</label>
              <select
                value={editorFontSize}
                onChange={(e) => setEditorSettings({ editorFontSize: Number(e.target.value) })}
                className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
              >
                <option value={12}>12px (Compact)</option>
                <option value={14}>14px (Standard)</option>
                <option value={16}>16px (Comfortable)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Account Actions */}
        <div className="clutch-panel rounded-2xl p-6 border-clutch-rose/30">
          <h2 className="font-cyber font-bold text-sm text-clutch-rose mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>ACCOUNT & STORAGE</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-clutch-muted">
              Pilot session: <strong className="text-white">{userProfile.username}</strong> ({userProfile.isGuest ? 'Guest' : 'Authenticated'})
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleResetData}
                className="clutch-btn-ghost text-xs text-clutch-muted hover:text-white"
              >
                Reset Combat Cache
              </button>

              <button
                onClick={handleLogout}
                className="clutch-btn-secondary py-2 px-4 text-xs text-clutch-rose hover:border-clutch-rose"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
