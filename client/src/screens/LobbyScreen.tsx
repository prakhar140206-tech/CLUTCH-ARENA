import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { CyberNavBar } from '../components/navigation/CyberNavBar.js';
import { CyberTiltCard } from '../components/ui/CyberTiltCard.js';
import { HoloCore3D } from '../components/arena3d/HoloCore3D.js';
import {
  Swords,
  Users,
  Bot,
  Compass,
  ArrowRight,
  Plus,
  Lock,
  Trophy,
  Flame,
  Clock,
  Sparkles,
  Zap,
  Sliders,
  X,
  Target
} from 'lucide-react';

export const LobbyScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);

  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Custom Arena Configuration State
  const [customMaxPlayers, setCustomMaxPlayers] = useState<number>(70);
  const [customTotalRounds, setCustomTotalRounds] = useState<number>(25);
  const [customRoundSeconds, setCustomRoundSeconds] = useState<number>(20);
  const [customMode, setCustomMode] = useState<any>('mega_arena_100');

  // Launch official 70-Player Tournament Preset (25 Qs, 20s per question)
  const handleStartTournament70 = async () => {
    try {
      soundSynth.airhorn();
      setIsJoining(true);
      await socketService.createRoom(userProfile, {
        mode: 'mega_arena_100',
        maxPlayers: 70,
        roundDurationSeconds: 20, // 20s per question
        totalRounds: 25 // 25 questions (~10 min tournament session)
      });
      setScreen('arena_3d');
    } catch (err: any) {
      alert(`Error launching 70-Player Tournament: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleQuickPlay = async (mode: any, maxPlayers: number = 2) => {
    try {
      soundSynth.click();
      setIsJoining(true);
      const room = await socketService.createRoom(userProfile, {
        mode,
        maxPlayers,
        roundDurationSeconds: 600,
        totalRounds: 5
      });
      if (mode === 'ai_arena') {
        await socketService.addBot(room.id, 'balanced');
      }
      setScreen('arena_3d');
    } catch (err: any) {
      alert(`Error creating match: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    try {
      soundSynth.click();
      setIsJoining(true);
      await socketService.joinRoom(joinCodeInput.trim().toUpperCase(), userProfile);
      setScreen('arena_3d');
    } catch (err: any) {
      alert(`Could not join arena: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateCustom = async () => {
    try {
      soundSynth.levelUp();
      setIsJoining(true);
      await socketService.createRoom(userProfile, {
        mode: customMode,
        maxPlayers: customMaxPlayers,
        roundDurationSeconds: customRoundSeconds,
        totalRounds: customTotalRounds
      });
      setShowCustomModal(false);
      setScreen('arena_3d');
    } catch (err: any) {
      alert(`Error creating custom arena: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-y-auto select-none relative">
      <CyberNavBar activeTab="lobby" />

      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Ambient Lighting Spheres */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col z-10 px-4 sm:px-6 py-6">
        
        {/* ===================================================
            70-PLAYER GRAND TOURNAMENT COMMAND CENTER BANNER
            =================================================== */}
        <div className="w-full bg-gradient-to-r from-amber-950/60 via-[#0a0b18]/95 to-cyan-950/60 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 mb-8 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(245,158,11,0.22)] relative overflow-hidden tech-corner">
          <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-cyber font-black text-[10px] tracking-wider rounded-bl-xl shadow-lg">
            OFFICIAL TOURNAMENT SPEC 🏆
          </div>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-violet-600/30 border border-amber-400/40 flex items-center justify-center p-2.5 shadow-[0_0_30px_rgba(245,158,11,0.3)] shrink-0">
              <img src="/logo.png" alt="Clutch Logo" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="font-cyber font-black text-xl sm:text-2xl text-white tracking-wide">
                  70-PLAYER BLITZ TOURNAMENT
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  25 QUESTIONS • 20s TIMER
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                  ~10 MIN SESSION
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-mono">
                Synchronized question broadcast to all 70 players simultaneously. Winner decided by accuracy + fastest answer speed (least seconds wins!). Authoritative Top 10 Ceremony with Coin rewards!
              </p>
            </div>
          </div>

          <button
            onClick={handleStartTournament70}
            disabled={isJoining}
            className="w-full lg:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 active:scale-95 text-slate-950 font-cyber font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all shrink-0"
          >
            <span>HOST 70-PLAYER TOURNAMENT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Join By Room Code Bar */}
        <div className="w-full bg-slate-900/60 border border-violet-500/30 rounded-xl p-4 mb-8 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cyber font-bold text-white text-xs sm:text-sm">ENTER PRIVATE ROOM CODE</h4>
              <p className="text-slate-400 text-[11px] font-mono">Join an existing match using your host's 6-character room code</p>
            </div>
          </div>

          <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 7X9K2A"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="bg-slate-950/90 border border-slate-700 focus:border-cyan-400 text-cyan-300 font-mono text-center tracking-widest text-sm px-4 py-2 rounded-lg focus:outline-none uppercase w-full sm:w-36"
            />
            <button
              type="submit"
              disabled={isJoining || joinCodeInput.length < 4}
              className="cyber-btn cyber-btn-cyan px-5 py-2 text-xs shrink-0"
            >
              JOIN ROOM
            </button>
          </form>
        </div>

        {/* Game Mode Cards Grid (with 3D Tilt Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Mode 1: 1v1 Ranked Duel */}
          <CyberTiltCard
            glowColor="cyan"
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <Swords className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  COMPETITIVE
                </span>
              </div>
              <h3 className="font-cyber font-bold text-lg text-white mb-1 hover:text-cyan-300 transition-colors">
                1v1 Duel Arena
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
                Direct head-to-head algorithm showdown. Two combatants, identical synchronized questions, instant score updates.
              </p>
            </div>
            <button
              onClick={() => handleQuickPlay('duel_1v1', 2)}
              disabled={isJoining}
              className="w-full cyber-btn cyber-btn-cyan py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <span>FIND DUEL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CyberTiltCard>

          {/* Mode 2: Mega Arena (100 Players) */}
          <CyberTiltCard
            glowColor="violet"
            className="p-5 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-violet-600 to-indigo-600 text-white font-cyber font-bold text-[9px] rounded-bl-lg">
              MEGA BATTLE ROYALE
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  UP TO 100
                </span>
              </div>
              <h3 className="font-cyber font-bold text-lg text-white mb-1 hover:text-violet-300 transition-colors">
                Mega Arena (100 Players)
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
                Massive synchronized arena. 100 simultaneous coders in one 3D field with live leaderboard and 'Last Brain Standing' elimination.
              </p>
            </div>
            <button
              onClick={() => handleQuickPlay('mega_arena_100', 100)}
              disabled={isJoining}
              className="w-full cyber-btn cyber-btn-violet py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <span>ENTER 100-PLAYER ARENA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CyberTiltCard>

          {/* Mode 3: AI Arena Practice */}
          <CyberTiltCard
            glowColor="amber"
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  PRACTICE
                </span>
              </div>
              <h3 className="font-cyber font-bold text-lg text-white mb-1 hover:text-amber-300 transition-colors">
                AI Arena Bots
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
                Train against 6 intelligent bot archetypes (Beginner, Balanced, Speedrunner, Strategist, Advanced, Adaptive).
              </p>
            </div>
            <button
              onClick={() => handleQuickPlay('ai_arena', 2)}
              disabled={isJoining}
              className="w-full cyber-btn cyber-btn-outline py-2.5 text-xs flex items-center justify-center gap-1.5 hover:border-amber-400 hover:text-amber-300"
            >
              <span>CHALLENGE BOT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CyberTiltCard>
        </div>

        {/* Secondary Row: Custom Arena & Global Aura Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Custom Arena Creator */}
          <div className="p-5 rounded-xl bg-slate-900/50 border border-violet-500/20 flex items-center justify-between tech-corner">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-cyber font-bold text-white text-sm mb-1">Custom Private Arena</h4>
                <p className="text-slate-400 text-xs max-w-sm font-mono">Host your match with custom player limits (up to 70-100), round clocks, and elimination rules.</p>
              </div>
            </div>
            <button
              onClick={() => setShowCustomModal(true)}
              className="cyber-btn cyber-btn-outline px-4 py-2 text-xs shrink-0"
            >
              CONFIGURE
            </button>
          </div>

          {/* Hall of Aura Trophy Button */}
          <div className="p-5 rounded-xl bg-slate-900/50 border border-amber-500/20 flex items-center justify-between tech-corner">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-cyber font-bold text-white text-sm mb-1">Hall of Aura</h4>
                <p className="text-slate-400 text-xs max-w-sm font-mono">View the highest-ranked algorithmic combatants across global leaderboards.</p>
              </div>
            </div>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="cyber-btn cyber-btn-amber px-4 py-2 text-xs shrink-0"
            >
              VIEW RANKS
            </button>
          </div>
        </div>
      </div>

      {/* Custom Room Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900/95 border-2 border-violet-500/40 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCustomModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-cyber font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>CUSTOM ARENA CONFIGURATION</span>
            </h3>

            <div className="space-y-4 mb-6 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Match Mode</label>
                <select
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 focus:border-cyan-400 font-mono"
                >
                  <option value="mega_arena_100">Mega Arena / 70-Player Tournament</option>
                  <option value="duel_1v1">1v1 Duel</option>
                  <option value="team_clash">Team Clash (Violet vs Cyan)</option>
                  <option value="last_brain_standing">Last Brain Standing (Elimination)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Max Players ({customMaxPlayers})</label>
                <input
                  type="range"
                  min="2"
                  max="100"
                  value={customMaxPlayers}
                  onChange={(e) => setCustomMaxPlayers(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>2 Players</span>
                  <span className="text-amber-400 font-bold">70 Players (Tournament)</span>
                  <span>100 Max</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Total Questions: <strong className="text-amber-300 font-mono">{customTotalRounds} Questions</strong> (~10 Min Session)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 25].map((rounds) => (
                    <button
                      key={rounds}
                      type="button"
                      onClick={() => setCustomTotalRounds(rounds)}
                      className={`py-1.5 rounded font-mono text-xs border ${
                        customTotalRounds === rounds
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {rounds} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Question Timer: <strong className="text-cyan-300 font-mono">{customRoundSeconds} Seconds</strong> per Question
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 30, 60].map((secs) => (
                    <button
                      key={secs}
                      type="button"
                      onClick={() => setCustomRoundSeconds(secs)}
                      className={`py-1.5 rounded font-mono text-xs border ${
                        customRoundSeconds === secs
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {secs}s {secs === 20 ? '⚡' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustom}
                disabled={isJoining}
                className="cyber-btn cyber-btn-cyan px-5 py-2 text-xs"
              >
                CREATE ARENA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hall of Aura Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-cyber font-black text-lg text-white tracking-wide">
                    HALL OF AURA 👑
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">GLOBAL ESPORTS ALGORITHM STANDINGS</span>
                </div>
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standings List */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 font-mono text-xs">
              {[
                { rank: 1, name: 'FlashBinary_AI', aura: 142800, badge: '👑 GigaChad' },
                { rank: 2, name: 'QuantumTuring', aura: 119500, badge: '⚡ Blitz God' },
                { rank: 3, name: 'AlgoSage_99', aura: 98400, badge: '🔥 Code Demon' },
                { rank: 4, name: 'ByteMaster_X', aura: 87200, badge: '💀 Brainrot Boss' },
                { rank: 5, name: 'RecursionQueen', aura: 76500, badge: '✨ Sigma Solver' },
                { rank: 6, name: userProfile.username, aura: userProfile.auraPoints || 48500, badge: userProfile.equippedTitle || '🔥 Top 10 Contender', isMe: true }
              ].map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    entry.isMe
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 font-bold ${
                      entry.rank === 1 ? 'text-amber-400 text-sm' : entry.rank === 2 ? 'text-slate-300' : entry.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      #{entry.rank}
                    </span>
                    <div>
                      <span className="font-bold text-white flex items-center gap-2">
                        {entry.name}
                        {entry.isMe && <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">YOU</span>}
                      </span>
                      <span className="text-[10px] text-slate-500">{entry.badge}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-cyber font-bold text-amber-300">
                      {entry.aura.toLocaleString()}
                    </span>
                    <span className="block text-[9px] text-slate-500">AURA</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="cyber-btn cyber-btn-outline px-5 py-2 text-xs"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
