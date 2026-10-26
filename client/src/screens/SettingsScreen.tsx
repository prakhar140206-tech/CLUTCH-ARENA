import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { soundSynth } from '../services/soundSynth.js';
import {
  User,
  Volume2,
  VolumeX,
  Bell,
  Shield,
  Sliders,
  Check,
  X,
  Sparkles,
  Smartphone,
  Flame,
  Award
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const toggleSfx = useGameStore((s) => s.toggleSfx);

  const [callsignInput, setCallsignInput] = useState<string>(userProfile.username || 'GR36_99');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Audio & Gameplay Switches
  const [touchControls, setTouchControls] = useState<boolean>(true);
  const [gameStartSound, setGameStartSound] = useState<boolean>(true);
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [gameplayControl, setGameplayControl] = useState<boolean>(true);
  const [gameScenarios, setGameScenarios] = useState<boolean>(true);
  const [aiAggression, setAiAggression] = useState<number>(30);
  const [speedVal, setSpeedVal] = useState<number>(160);

  // Match Invites State
  const [invites, setInvites] = useState<any[]>([
    { id: 'inv-1', from: 'cyber_knight', elo: 2000, time: '5 hours ago' }
  ]);

  const handleSaveProfile = () => {
    soundSynth.levelUp();
    updateUserProfile({ username: callsignInput.trim() });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRespondInvite = (id: string, accept: boolean) => {
    if (accept) {
      soundSynth.airhorn();
    } else {
      soundSynth.click();
    }
    setInvites(invites.filter((inv) => inv.id !== id));
  };

  return (
    <AppShell activeScreen="settings">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans pb-8">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="font-cyber font-black text-xl sm:text-2xl text-white tracking-wider uppercase">
            SETTINGS &amp; NOTIFICATION CENTER
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            SYSTEM PREFERENCES
          </span>
        </div>

        {/* =========================================================
            THREE-COLUMN SETTINGS GRID (Matching Image 4 Bottom-Right)
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Profile Preferences (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0f151c]/95 border border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col gap-5">
            <span className="text-xs font-cyber font-bold text-slate-300 uppercase tracking-wider">
              Profile Preferences
            </span>

            {/* User Avatar with Green Glow */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white border-2 border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] shrink-0"
                style={{ backgroundColor: userProfile.avatar?.color || '#10b981' }}
              >
                {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'G'}
              </div>

              <div className="flex flex-col">
                <span className="font-cyber font-bold text-base text-white">
                  {userProfile.username || 'GR36_99'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>
            </div>

            {/* Callsign Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Callsign Username</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={callsignInput}
                  onChange={(e) => setCallsignInput(e.target.value)}
                  className="flex-1 bg-[#141b22] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all shrink-0"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#141b22] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* ELO Telemetry Preview */}
            <div className="p-3 rounded-xl bg-[#141b22] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">ELO Rating</span>
                <div className="font-cyber font-black text-sm text-emerald-400">
                  {userProfile.ratingMMR || 2890} ELO
                </div>
              </div>
              {/* Mini Sparkline Chart */}
              <div className="flex items-end gap-1 h-6">
                {[30, 50, 45, 70, 85, 80, 100].map((h, i) => (
                  <div key={i} className="w-1 bg-emerald-400 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Audio & Gameplay Toggles (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0f151c]/95 border border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col gap-4">
            <span className="text-xs font-cyber font-bold text-slate-300 uppercase tracking-wider">
              Audio &amp; Gameplay Toggles
            </span>

            {/* Toggle Switches */}
            <div className="flex flex-col gap-3">
              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <span className="text-xs font-mono text-slate-300">Audio Toggles</span>
                <button
                  onClick={() => {
                    toggleSfx();
                    soundSynth.toggleSfx();
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    sfxEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      sfxEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Touch Controls */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <span className="text-xs font-mono text-slate-300">Touch Controls</span>
                <button
                  onClick={() => setTouchControls(!touchControls)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    touchControls ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      touchControls ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Game Start Sound */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <span className="text-xs font-mono text-slate-300">Game Start Audio</span>
                <button
                  onClick={() => setGameStartSound(!gameStartSound)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    gameStartSound ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      gameStartSound ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <span className="text-xs font-mono text-slate-300">Push Alerts</span>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    pushNotifications ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      pushNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Gameplay Sliders */}
            <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>AI Aggression</span>
                  <span className="text-emerald-400 font-bold">{aiAggression}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiAggression}
                  onChange={(e) => setAiAggression(Number(e.target.value))}
                  className="accent-emerald-400 w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Speed Sensitivity</span>
                  <span className="text-cyan-400 font-bold">{speedVal}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  value={speedVal}
                  onChange={(e) => setSpeedVal(Number(e.target.value))}
                  className="accent-cyan-400 w-full"
                />
              </div>
            </div>
          </div>

          {/* Column 3: Notification Center (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0f151c]/95 border border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col gap-4">
            <span className="text-xs font-cyber font-bold text-slate-300 uppercase tracking-wider">
              Notification Center
            </span>

            {/* Recent Match Invites Card */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                Recent Match Invites
              </span>

              {invites.length > 0 ? (
                invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl bg-[#141b22] border border-emerald-500/30 flex flex-col gap-2.5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center font-bold text-xs text-cyan-300">
                        {inv.from.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-cyber font-bold text-xs text-white">
                          {inv.from}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {inv.elo} ELO
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleRespondInvite(inv.id, true)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-cyber font-black text-xs hover:bg-emerald-400 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondInvite(inv.id, false)}
                        className="flex-1 py-1.5 rounded-lg border border-white/15 text-slate-400 font-cyber font-bold text-xs hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-[#141b22] border border-white/5 text-center text-xs font-mono text-slate-500">
                  No pending match invites
                </div>
              )}
            </div>

            {/* System Alerts */}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                System Alerts
              </span>

              <div className="p-3 rounded-xl bg-[#141b22] border border-white/5 flex flex-col gap-1 text-xs font-mono">
                <span className="font-bold text-emerald-400">Round Match Updates</span>
                <span className="text-slate-400 text-[11px]">
                  Provenance validation completed for Match 4408.
                </span>
                <span className="text-[9px] text-slate-600">5 hours ago</span>
              </div>

              <div className="p-3 rounded-xl bg-[#141b22] border border-white/5 flex flex-col gap-1 text-xs font-mono">
                <span className="font-bold text-cyan-400">System Broadcast</span>
                <span className="text-slate-400 text-[11px]">
                  Season 4 Ranked ladder rewards unlocked.
                </span>
                <span className="text-[9px] text-slate-600">2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
