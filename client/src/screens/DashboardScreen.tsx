import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { GrandmasterBadge } from '../components/ui/GrandmasterBadge.js';
import { API_BASE_URL } from '../config/api.js';
import {
  Swords,
  Compass,
  Bot,
  Users,
  Trophy,
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  Shield,
  Activity,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { FriendsModal } from '../components/friends/FriendsModal.js';

export const DashboardScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const selectedMatchDuration = useGameStore((s) => s.selectedMatchDuration);
  const selectedQuestionTimer = useGameStore((s) => s.selectedQuestionTimer);

  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  const [friendsModalOpen, setFriendsModalOpen] = useState<boolean>(false);
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          if (data.leaderboard && isMounted) {
            setLiveLeaderboard(data.leaderboard);
          }
        }
      } catch {
        // Fallback default mock ranking matching the screenshots
      }
    };
    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLaunch1v1 = async () => {
    soundSynth.airhorn();
    setIsJoining(true);
    try {
      await socketService.createRoom(userProfile, {
        mode: 'duel_1v1',
        maxPlayers: 2,
        matchDurationMinutes: selectedMatchDuration || 25,
        questionDurationSeconds: selectedQuestionTimer || 20,
        roundDurationSeconds: selectedQuestionTimer || 20,
        totalRounds: 9999
      });
      setScreen('arena_3d');
    } catch {
      setScreen('lobby');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    soundSynth.click();
    setIsJoining(true);
    try {
      await socketService.joinRoom(roomCodeInput.trim().toUpperCase(), userProfile);
      setScreen('arena_3d');
    } catch {
      setScreen('lobby');
    } finally {
      setIsJoining(false);
    }
  };

  // Top leaderboard entries fallback to mock from screenshot if empty
  const defaultTopLeaderboard = [
    { rank: 1, username: 'cyber_knight', ratingMMR: 2890, rankTier: 'Grandmaster' },
    { rank: 2, username: 'void_pointer', ratingMMR: 2840, rankTier: 'Master Mind' },
    { rank: 3, username: 'user_name', ratingMMR: 2710, rankTier: 'Apex Solver' }
  ];

  const displayLeaderboard =
    liveLeaderboard && liveLeaderboard.length >= 3
      ? liveLeaderboard.slice(0, 3)
      : defaultTopLeaderboard;

  return (
    <AppShell activeScreen="dashboard">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans pb-8">
        {/* =========================================================
            1. HERO BANNER: "PREPARE FOR BATTLE"
            ========================================================= */}
        <div className="relative rounded-2xl bg-gradient-to-r from-[#0d161a] via-[#111c22] to-[#0d161a] border border-emerald-500/25 p-6 sm:p-8 overflow-hidden shadow-[0_10px_35px_-5px_rgba(0,0,0,0.8),0_0_25px_rgba(34,197,94,0.15)]">
          {/* Cyber Horizon Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.06)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          {/* Central Green Flare */}
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Header & Call to Action */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-xl w-full">
              <h2 className="font-cyber font-black text-2xl sm:text-4xl text-white tracking-wider uppercase mb-3 sm:mb-5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                PREPARE FOR BATTLE
              </h2>

              <button
                onClick={handleLaunch1v1}
                disabled={isJoining}
                className="w-full sm:w-auto clutch-btn-neon text-sm sm:text-base py-3.5 sm:py-3.5 px-8 sm:px-10 flex items-center justify-center gap-3 group active:scale-95 transition-transform"
              >
                <Swords className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>PLAY 1v1 RANKED</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right: Grandmaster 3D Winged Badge */}
            <div className="shrink-0 p-2 scale-90 sm:scale-100">
              <GrandmasterBadge
                elo={userProfile.ratingMMR || 2140}
                rankTitle={userProfile.rankTier || 'GRANDMASTER'}
                size="hero"
              />
            </div>
          </div>
        </div>

        {/* =========================================================
            2. MIDDLE ROW: QUICK STATS & DAILY CODING CHALLENGE
            ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Quick Stats 1: WIN RATE (4 cols) */}
          <div className="md:col-span-3 rounded-2xl bg-[#11171d]/90 border border-white/10 p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
              <span className="font-bold tracking-wider uppercase">Quick Stats</span>
              <span>•••</span>
            </div>

            <div className="flex items-center gap-4 my-auto">
              {/* Circular Gauge */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    strokeDasharray="88.4, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-cyber font-black text-xs text-white">88.4%</span>
              </div>

              {/* Title & Equalizer Chart */}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">WIN RATE:</span>
                {/* Simulated Neon Equalizer Bars */}
                <div className="flex items-end gap-1 h-7 mt-1">
                  {[40, 65, 85, 55, 95, 75, 90, 85, 100].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-emerald-400 rounded-t-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats 2: ACCURACY (4 cols) */}
          <div className="md:col-span-3 rounded-2xl bg-[#11171d]/90 border border-white/10 p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
              <span className="font-bold tracking-wider uppercase">Quick Stats</span>
              <span>•••</span>
            </div>

            <div className="flex items-center gap-4 my-auto">
              {/* Circular Gauge */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]"
                    strokeDasharray="92.1, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-cyber font-black text-xs text-white">92.1%</span>
              </div>

              {/* Title & Equalizer Chart */}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">ACCURACY:</span>
                <div className="flex items-end gap-1 h-7 mt-1">
                  {[50, 70, 60, 85, 90, 80, 95, 100, 92].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-lime-400 rounded-t-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Coding Challenge (6 cols) */}
          <div className="md:col-span-6 rounded-2xl bg-[#11171d]/90 border border-white/10 p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
              <span className="font-bold tracking-wider uppercase text-emerald-400">Daily Coding Challenge</span>
              <span>•••</span>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-white truncate">
                  DAILY BOSS: <span className="text-emerald-400">invert-binary-tree.py</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  ⏱ 14h 22m remaining
                </span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Reward: <strong className="text-amber-300">150 EXP + 50 Credits</strong>
                </span>

                <button
                  onClick={() => setScreen('solo_quest')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all"
                >
                  START BOSS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            3. BOTTOM ROW: GAME MODES & GLOBAL LEADERBOARD
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* GAME MODES (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-cyber font-bold text-sm uppercase tracking-wider text-white">
                GAME MODES
              </h3>
            </div>

            {/* 5 Game Mode Cards matching the screenshot with mobile balance */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Card 1: SOLO QUEST */}
              <button
                onClick={() => setScreen('solo_quest')}
                className="group p-3.5 sm:p-4 rounded-2xl bg-[#11171d]/90 border border-white/10 hover:border-emerald-500/40 text-left transition-all hover:-translate-y-1 active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between h-36 sm:h-44"
              >
                <div className="w-full h-16 sm:h-20 rounded-xl bg-gradient-to-tr from-emerald-950/60 to-[#162128] border border-emerald-500/20 flex items-center justify-center overflow-hidden relative">
                  <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="font-cyber font-bold text-xs text-white tracking-wide uppercase truncate">
                    SOLO QUEST
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    leveling &amp; adventure
                  </p>
                </div>
              </button>

              {/* Card 2: 1v1 DUEL (Featured) */}
              <button
                onClick={handleLaunch1v1}
                className="group p-3.5 sm:p-4 rounded-2xl bg-[#11171d]/90 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all hover:-translate-y-1 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.15)] relative overflow-hidden flex flex-col justify-between h-36 sm:h-44"
              >
                <div className="w-full h-16 sm:h-20 rounded-xl bg-gradient-to-tr from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 flex items-center justify-center overflow-hidden relative">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Swords className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400 group-hover:rotate-12 transition-transform" />
                    <span className="font-cyber font-black text-xs sm:text-sm text-cyan-400">VS</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-cyber font-bold text-xs text-white tracking-wide uppercase truncate">
                    1v1 DUEL
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-emerald-400 mt-0.5 truncate font-semibold">
                    live match queue
                  </p>
                </div>
              </button>

              {/* Card 3: AI BATTLE */}
              <button
                onClick={() => setScreen('lobby')}
                className="group p-3.5 sm:p-4 rounded-2xl bg-[#11171d]/90 border border-white/10 hover:border-emerald-500/40 text-left transition-all hover:-translate-y-1 active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between h-36 sm:h-44"
              >
                <div className="w-full h-16 sm:h-20 rounded-xl bg-gradient-to-tr from-[#142028] to-[#121c22] border border-white/10 flex items-center justify-center overflow-hidden relative">
                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="font-cyber font-bold text-xs text-white tracking-wide uppercase truncate">
                    AI BATTLE
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    boss rush &amp; speed
                  </p>
                </div>
              </button>

              {/* Card 4: CUSTOM ROOM */}
              <button
                onClick={() => setShowRoomModal(true)}
                className="group p-3.5 sm:p-4 rounded-2xl bg-[#11171d]/90 border border-white/10 hover:border-emerald-500/40 text-left transition-all hover:-translate-y-1 active:scale-95 shadow-lg relative overflow-hidden flex flex-col justify-between h-36 sm:h-44"
              >
                <div className="w-full h-16 sm:h-20 rounded-xl bg-gradient-to-tr from-[#121c22] to-emerald-950/40 border border-white/10 flex items-center justify-center overflow-hidden relative">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="font-cyber font-bold text-xs text-white tracking-wide uppercase truncate">
                    CUSTOM ROOM
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    private lobbies
                  </p>
                </div>
              </button>

              {/* Card 5: TOURNAMENT (Spans 2 columns on mobile for perfect 2x2+1 grid balance) */}
              <button
                onClick={() => setScreen('lobby')}
                className="col-span-2 sm:col-span-1 group p-3.5 sm:p-4 rounded-2xl bg-[#11171d]/90 border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:-translate-y-1 active:scale-95 shadow-lg relative overflow-hidden flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 sm:gap-0 h-24 sm:h-44"
              >
                <div className="w-20 sm:w-full h-16 sm:h-20 rounded-xl bg-gradient-to-tr from-[#1c1810] to-[#141b22] border border-amber-500/20 flex items-center justify-center overflow-hidden relative shrink-0">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-cyber font-bold text-xs text-white tracking-wide uppercase truncate flex items-center gap-1.5">
                    <span>TOURNAMENT</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 sm:hidden">BRACKET</span>
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    timed bracket esports events
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* GLOBAL LEADERBOARD (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#11171d]/90 border border-white/10 p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cyber font-bold text-sm uppercase tracking-wider text-white">
                GLOBAL LEADERBOARD
              </h3>
              <button
                onClick={() => setScreen('leaderboard')}
                className="text-[11px] font-mono text-emerald-400 hover:underline"
              >
                VIEW ALL
              </button>
            </div>

            <div className="space-y-2.5">
              {displayLeaderboard.map((item, idx) => {
                const rankIcons = ['🥇', '🥈', '🥉'];
                const rankBorderColors = [
                  'border-amber-500/40 bg-amber-950/20',
                  'border-slate-400/30 bg-slate-800/20',
                  'border-amber-700/30 bg-amber-950/10'
                ];

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${rankBorderColors[idx] || 'border-white/5 bg-[#141b22]'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-cyber font-black text-xs text-amber-400 w-5 text-center">
                        #{idx + 1}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {item.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-cyber font-bold text-xs text-white truncate max-w-[110px]">
                        {item.username}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-slate-300 shrink-0">
                      {item.ratingMMR} ELO
                    </span>
                  </div>
                );
              })}

              {/* Current User Row (e.g. #71 GR36_99) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 mt-4 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-cyber font-bold text-xs text-slate-400 w-5 text-center">
                    71
                  </span>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center font-bold text-xs text-white shadow">
                    {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-cyber font-bold text-xs text-white truncate max-w-[100px]">
                      {userProfile.username || 'GR36_99'}
                    </span>
                    <span className="text-[8px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" /> ONLINE
                    </span>
                  </div>
                </div>

                <span className="font-mono text-xs font-black text-emerald-400 shrink-0">
                  {userProfile.ratingMMR || 2140} ELO
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-2xl bg-[#11171d] border border-emerald-500/30 p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-cyber font-bold text-base text-white tracking-wider">
              ENTER CUSTOM ROOM
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Join an existing private arena or create a custom match lobby with your friends.
            </p>

            <form onSubmit={handleJoinByCode} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="ENTER 6-DIGIT ROOM CODE"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-[#162029] border border-white/10 rounded-xl px-4 py-3 font-mono text-center font-bold text-sm tracking-widest text-emerald-400 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
              />

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!roomCodeInput.trim() || isJoining}
                  className="flex-1 clutch-btn-neon py-2.5 text-xs font-bold"
                >
                  JOIN ROOM
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Want to host?</span>
              <button
                onClick={() => {
                  setShowRoomModal(false);
                  setScreen('lobby');
                }}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                Create Custom Lobby &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friends Comms Modal */}
      <FriendsModal
        isOpen={friendsModalOpen}
        onClose={() => setFriendsModalOpen(false)}
      />
    </AppShell>
  );
};
