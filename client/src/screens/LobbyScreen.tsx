import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import {
  Users,
  Swords,
  Clock,
  Sparkles,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Bot,
  Sliders,
  UserPlus,
  Play
} from 'lucide-react';

export const LobbyScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const activeRoom = useGameStore((s) => s.activeRoom);
  const selectedMatchDuration = useGameStore((s) => s.selectedMatchDuration);
  const setSelectedMatchDuration = useGameStore((s) => s.setSelectedMatchDuration);
  const selectedQuestionTimer = useGameStore((s) => s.selectedQuestionTimer);
  const setSelectedQuestionTimer = useGameStore((s) => s.setSelectedQuestionTimer);

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'custom_lobby' | 'ai_setup'>('custom_lobby');

  // AI Setup Settings (Image 4 Bottom-Left)
  const [aiDifficulty, setAiDifficulty] = useState<string>('Casual');
  const [selectedBotAvatar, setSelectedBotAvatar] = useState<number>(0);
  const [aiAggression, setAiAggression] = useState<number>(50);
  const [aiSpeed, setAiSpeed] = useState<number>(10);

  const botAvatars = [
    { name: 'Violet Avatar', color: '#8b5cf6', role: 'Balanced' },
    { name: 'Specialist', color: '#10b981', role: 'Speed Demon' },
    { name: 'Cyber Knight', color: '#06b6d4', role: 'Aggressive' },
    { name: 'Best Bot', color: '#eab308', role: 'Grandmaster' }
  ];

  const handleStartMatch = async () => {
    soundSynth.airhorn();
    setIsStarting(true);
    try {
      if (activeRoom) {
        await socketService.startMatch(activeRoom.id, userProfile.id);
      } else {
        await socketService.createRoom(userProfile, {
          mode: 'duel_1v1',
          maxPlayers: 8,
          matchDurationMinutes: selectedMatchDuration || 30,
          questionDurationSeconds: selectedQuestionTimer || 20,
          roundDurationSeconds: selectedQuestionTimer || 20,
          totalRounds: 9999
        });
      }
      setScreen('arena_3d');
    } catch {
      setScreen('arena_3d');
    } finally {
      setIsStarting(false);
    }
  };

  const copyRoomCode = () => {
    const code = activeRoom?.code || 'CLUTCH';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    soundSynth.click();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Team A Slots (Left Column)
  const teamAPlayers = [
    { username: 'cyber_knight', elo: 2690, isReady: true, color: '#06b6d4' },
    { username: 'void_pointer', elo: 2840, isReady: true, color: '#10b981' },
    { username: 'user_name', elo: 2710, isReady: true, color: '#8b5cf6' },
    { username: userProfile.username || 'GR36_99', elo: userProfile.ratingMMR || 3140, isReady: true, color: '#22c55e' }
  ];

  return (
    <AppShell activeScreen="lobby">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans pb-8">
        {/* Sub Navigation Bar: Custom Room Lobby vs AI Setup */}
        <div className="flex items-center gap-2 sm:gap-3 border-b border-white/5 pb-3">
          <button
            onClick={() => setActiveTab('custom_lobby')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider transition-all text-center ${
              activeTab === 'custom_lobby'
                ? 'clutch-nav-active'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            CUSTOM ROOM
          </button>
          <button
            onClick={() => setActiveTab('ai_setup')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl font-cyber font-bold text-xs uppercase tracking-wider transition-all text-center ${
              activeTab === 'ai_setup'
                ? 'clutch-nav-active'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            AI BATTLE SETUP
          </button>
        </div>

        {activeTab === 'custom_lobby' ? (
          /* =========================================================
              CUSTOM ROOM LOBBY (Image 3 Top-Left)
              ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Team A & Team B Split by "VS." */}
            <div className="lg:col-span-8 rounded-2xl bg-[#0f151c]/95 border border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-cyber font-black text-sm sm:text-base text-white tracking-wider uppercase">
                  CUSTOM ROOM LOBBY
                </h3>
                <button
                  onClick={copyRoomCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#141b22] border border-white/10 hover:border-emerald-500/40 text-xs font-mono text-emerald-400"
                >
                  <span>CODE: {activeRoom?.code || 'CLUTCH'}</span>
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* 2 Teams Battlefield Slot Layout */}
              <div className="grid grid-cols-1 md:grid-cols-9 gap-3 items-center mt-2">
                {/* Team A: 4 Slots (4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-2.5">
                  {teamAPlayers.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#141b22] border border-white/10 hover:border-emerald-500/30 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border border-emerald-400/50 shadow shrink-0"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-cyber font-bold text-xs text-white truncate max-w-[110px]">
                            {p.username}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.elo} ELO
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                        READY
                      </span>
                    </div>
                  ))}

                  {/* Empty Slot with Invite */}
                  <button
                    onClick={copyRoomCode}
                    className="flex items-center justify-center p-3 rounded-xl border border-dashed border-white/15 hover:border-emerald-500/40 text-xs font-mono text-slate-400 hover:text-white transition-all gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>INVITE</span>
                  </button>
                </div>

                {/* Center: Stylized VS Separator (1 col) */}
                <div className="md:col-span-1 flex md:flex-col items-center justify-center py-2 md:py-0">
                  <div className="h-8 md:h-16 w-0.5 bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent hidden md:block" />
                  <span className="font-cyber font-black text-sm text-slate-300 px-2">VS.</span>
                  <div className="h-8 md:h-16 w-0.5 bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent hidden md:block" />
                </div>

                {/* Team B: 4 Invite Slots (4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-2.5">
                  {[1, 2, 3, 4].map((slot) => (
                    <button
                      key={slot}
                      onClick={copyRoomCode}
                      className="flex items-center justify-center p-3.5 rounded-xl border border-dashed border-white/15 hover:border-cyan-500/40 text-xs font-mono text-slate-400 hover:text-white transition-all gap-2"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                      <span>INVITE</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Match Duration, Question Timer, START MATCH */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0f151c]/95 border border-white/10 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-5">
                {/* Match Duration Pills */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-cyber font-bold text-slate-300 uppercase tracking-wider">
                    Match Duration
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 30, 45, 60].map((mins) => {
                      const isSelected = (selectedMatchDuration || 30) === mins;
                      return (
                        <button
                          key={mins}
                          onClick={() => {
                            soundSynth.click();
                            setSelectedMatchDuration(mins as any);
                          }}
                          className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                              : 'bg-[#141b22] border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30'
                          }`}
                        >
                          {mins}m
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Timer Pills */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-cyber font-bold text-slate-300 uppercase tracking-wider">
                    Question Timer
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 30].map((secs) => {
                      const isSelected = (selectedQuestionTimer || 20) === secs;
                      return (
                        <button
                          key={secs}
                          onClick={() => {
                            soundSynth.click();
                            setSelectedQuestionTimer(secs as any);
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                              : 'bg-[#141b22] border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30'
                          }`}
                        >
                          {secs}s
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* START MATCH Giant Neon Button */}
              <button
                onClick={handleStartMatch}
                disabled={isStarting}
                className="w-full clutch-btn-neon py-4 text-base font-black tracking-wider flex items-center justify-center gap-2 uppercase shadow-[0_0_25px_rgba(34,197,94,0.45)]"
              >
                <Play className="w-5 h-5 text-slate-950 fill-current" />
                <span>START MATCH</span>
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================
              AI OPPONENT SETUP (Image 4 Bottom-Left)
              ========================================================= */
          <div className="w-full max-w-4xl mx-auto rounded-2xl bg-[#0f151c]/95 border border-white/10 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col gap-6">
            <h3 className="font-cyber font-black text-lg text-white tracking-wider uppercase">
              AI OPPONENT SETUP
            </h3>

            {/* Difficulty Stepper */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Difficulty</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['Novice', 'Casual', 'Hard', 'Expert', 'Grandmaster Bot'].map((diff) => {
                  const isSel = aiDifficulty === diff;
                  const isGm = diff === 'Grandmaster Bot';
                  return (
                    <button
                      key={diff}
                      onClick={() => setAiDifficulty(diff)}
                      className={`py-2.5 px-2 rounded-xl font-mono text-xs font-bold transition-all ${
                        isGm ? 'col-span-2 sm:col-span-1' : ''
                      } ${
                        isSel
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                          : 'bg-[#141b22] border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specialized Bot Avatars Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                Choose Specialized Bot Avatars
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {botAvatars.map((bot, idx) => {
                  const isSel = selectedBotAvatar === idx;
                  return (
                    <button
                      key={bot.name}
                      onClick={() => setSelectedBotAvatar(idx)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        isSel
                          ? 'bg-emerald-950/30 border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                          : 'bg-[#141b22] border-white/10 hover:border-emerald-500/30'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow"
                        style={{ backgroundColor: bot.color }}
                      >
                        <Bot className="w-6 h-6" />
                      </div>
                      <span className="font-cyber font-bold text-xs text-white">{bot.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400">{bot.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Aggression & Speed Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">AI Aggression</span>
                  <span className="text-emerald-400 font-bold">{aiAggression}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={aiAggression}
                  onChange={(e) => setAiAggression(Number(e.target.value))}
                  className="accent-emerald-400 w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">AI Speed</span>
                  <span className="text-cyan-400 font-bold">{aiSpeed}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={aiSpeed}
                  onChange={(e) => setAiSpeed(Number(e.target.value))}
                  className="accent-cyan-400 w-full"
                />
              </div>
            </div>

            {/* START BATTLE Button */}
            <button
              onClick={handleStartMatch}
              className="clutch-btn-neon py-3.5 text-base font-black tracking-wider uppercase mt-2 shadow-[0_0_25px_rgba(34,197,94,0.45)]"
            >
              START BATTLE
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
};
