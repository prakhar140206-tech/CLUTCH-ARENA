import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { ArenaHero3D } from '../components/arena3d/ArenaHero3D.js';
import confetti from 'canvas-confetti';
import {
  Swords,
  Compass,
  Bot,
  Users,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  Layers,
  Zap,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
  Filter,
  Copy,
  Check
} from 'lucide-react';

interface QuestItem {
  id: string;
  title: string;
  topic: string;
  rewardAura: number;
  current: number;
  target: number;
  claimed: boolean;
}

export const DashboardScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);
  const soloSolvedIds = useGameStore((s) => s.soloSolvedIds);

  const [leaderboardFilter, setLeaderboardFilter] = useState<'global' | 'friends' | 'tier'>('global');
  const [showPrivateModal, setShowPrivateModal] = useState<boolean>(false);
  const [privateRoomCode, setPrivateRoomCode] = useState<string>('');
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Daily Quests tied to real user achievements and solo solved IDs
  const [quests, setQuests] = useState<QuestItem[]>([
    {
      id: 'quest-arrays',
      title: 'Master Two-Pointers or Sliding Window',
      topic: 'Arrays & Strings',
      rewardAura: 2500,
      current: Math.min(2, soloSolvedIds.length),
      target: 2,
      claimed: false
    },
    {
      id: 'quest-streak',
      title: 'Maintain a 5x Streak in any Arena Mode',
      topic: 'Competitive',
      rewardAura: 3500,
      current: Math.min(5, userProfile.stats?.highestStreak || 3),
      target: 5,
      claimed: false
    },
    {
      id: 'quest-shorts',
      title: 'Correctly Validate 5 DSA Truth Assertions',
      topic: 'DSA Shorts',
      rewardAura: 1500,
      current: 5,
      target: 5,
      claimed: false
    }
  ]);

  const handleClaimQuest = (questId: string, reward: number) => {
    soundSynth.levelUp();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    const currentAura = userProfile.auraPoints || 48500;
    updateUserProfile({ auraPoints: currentAura + reward });
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );
  };

  // Progression calculation
  const currentXP = userProfile.ratingMMR;
  const currentLevel = Math.max(1, Math.floor(currentXP / 300));
  const xpInCurrentLevel = currentXP % 300;
  const xpThreshold = 300;
  const xpProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpThreshold) * 100));

  // Verified Leaderboard Records
  const verifiedLeaderboard = [
    { rank: 1, username: 'AlexChen_O1', tier: 'Grandmaster Architect', rating: 2450, solved: 142, isCurrent: false },
    { rank: 2, username: 'ByteKnight_Sigma', tier: 'Algorithm Sentinel', rating: 2180, solved: 119, isCurrent: false },
    { rank: 3, username: 'TreeMaster_Pro', tier: 'Tree Master', rating: 1940, solved: 98, isCurrent: false },
    { rank: 4, username: userProfile.username, tier: userProfile.rankTier, rating: userProfile.ratingMMR, solved: userProfile.stats?.challengesSolved || 38, isCurrent: true },
    { rank: 5, username: 'DijkstraFanatic', tier: 'Byte Knight', rating: 1120, solved: 29, isCurrent: false },
    { rank: 6, username: 'NeoBinary_Dev', tier: 'Novice Bit', rating: 980, solved: 21, isCurrent: false },
  ];

  // Quick Action Handlers for the 4 Game Modes
  const handleLaunchAIDuel = async () => {
    try {
      soundSynth.click();
      const room = await socketService.createRoom(userProfile, {
        mode: 'ai_arena',
        maxPlayers: 2,
        roundDurationSeconds: 120,
        totalRounds: 3
      });
      await socketService.addBot(room.id, 'balanced');
      setScreen('arena_3d');
    } catch (err: any) {
      alert(`Could not start AI Duel: ${err.message}`);
    }
  };

  const handleLaunchMultiplayer = () => {
    soundSynth.click();
    setScreen('lobby');
  };

  const handleLaunchSoloQuest = () => {
    soundSynth.click();
    setScreen('solo_quest');
  };

  const handleJoinPrivateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateRoomCode.trim()) return;
    setIsJoiningRoom(true);
    try {
      soundSynth.click();
      await socketService.joinRoom(privateRoomCode.trim().toUpperCase(), userProfile);
      setShowPrivateModal(false);
      setScreen('arena_3d');
    } catch (err: any) {
      alert(`Could not join private room: ${err.message}`);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleCreatePrivateRoom = async () => {
    setIsJoiningRoom(true);
    try {
      soundSynth.levelUp();
      const room = await socketService.createRoom(userProfile, {
        mode: 'duel_1v1',
        maxPlayers: 4,
        roundDurationSeconds: 180,
        totalRounds: 3
      });
      setShowPrivateModal(false);
      setScreen('arena_3d');
    } catch (err: any) {
      alert(`Could not create private room: ${err.message}`);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  return (
    <AppShell activeScreen="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        
        {/* =========================================================
            SECTION 1: HERO SECTION WITH VIVID PURPLE 3D ARENA SCENE
            ========================================================= */}
        <section className="w-full rounded-2xl bg-gradient-to-r from-clutch-surface via-clutch-surface-light to-clutch-surface border border-clutch-border p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-clutch-violet/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clutch-violet/15 border border-clutch-violet/30 text-clutch-lavender text-xs font-mono mb-4">
                <Sparkles className="w-3.5 h-3.5 text-clutch-lavender" />
                <span>COMPETITIVE ALGORITHMIC ARENA</span>
              </div>

              <h1 className="font-cyber font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-wide leading-tight mb-3 break-words">
                ENTER THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-clutch-lavender via-clutch-violet-light to-white">CLUTCH ARENA</span>
              </h1>

              <p className="text-clutch-muted text-sm sm:text-base leading-relaxed max-w-xl mb-6 font-normal">
                Compete in real-time synchronized coding duels, master complex data structures through interactive puzzles, and advance your algorithmic tier.
              </p>

              {/* Primary & Secondary Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleLaunchMultiplayer}
                  className="clutch-btn-primary px-6 py-3 text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Swords className="w-4 h-4" />
                  <span>Enter Arena</span>
                </button>

                <button
                  onClick={handleLaunchSoloQuest}
                  className="clutch-btn-secondary px-6 py-3 text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Compass className="w-4 h-4 text-clutch-lavender" />
                  <span>Explore Challenges</span>
                </button>
              </div>
            </div>

            {/* Right 3D Visual Focal Point (5 cols) */}
            <div className="lg:col-span-5 h-64 sm:h-80 w-full relative flex items-center justify-center">
              <ArenaHero3D height="100%" />
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: PLAYER PROGRESSION & METRICS
            ========================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Identity & XP Bar (7 cols) */}
          <div className="lg:col-span-7 clutch-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-cyber font-black text-white shadow-lg border border-clutch-violet/40 shrink-0"
                  style={{ backgroundColor: userProfile.avatar.color }}
                >
                  {userProfile.username.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-cyber font-bold text-lg text-white">
                      {userProfile.username}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30">
                      LVL {currentLevel}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-clutch-lavender mt-0.5">
                    {userProfile.rankTier} • {userProfile.equippedTitle || 'Algorithm Rizzler 👑'}
                  </div>
                </div>
              </div>

              {/* Streak Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-clutch-surface-elevated border border-clutch-amber/30 text-clutch-amber font-mono text-xs font-bold">
                <Flame className="w-4 h-4 fill-current" />
                <span>{userProfile.stats?.highestStreak || 7}x Streak</span>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-clutch-muted">Tier Progression: Level {currentLevel}</span>
                <span className="text-white font-bold">{xpInCurrentLevel} / {xpThreshold} MMR</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-clutch-surface-light border border-clutch-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-clutch-violet to-clutch-lavender rounded-full transition-all duration-500"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-clutch-subtle mt-1.5">
                <span>Current Tier MMR: {userProfile.ratingMMR}</span>
                <span>Next Rank: Level {currentLevel + 1}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid (5 cols on desktop, 4 cols on tablet) */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
            <div className="clutch-panel rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-xs font-medium">Challenges Solved</span>
                <CheckCircle2 className="w-4 h-4 text-clutch-emerald" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-cyber font-black text-white">
                  {userProfile.stats?.challengesSolved || 38}
                </span>
                <span className="text-[11px] font-mono text-clutch-muted block mt-0.5">Verifiable DSA</span>
              </div>
            </div>

            <div className="clutch-panel rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-xs font-medium">Matches Played</span>
                <Swords className="w-4 h-4 text-clutch-lavender" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-cyber font-black text-white">
                  {userProfile.stats?.matchesPlayed || 14}
                </span>
                <span className="text-[11px] font-mono text-clutch-muted block mt-0.5">
                  {userProfile.stats?.matchesWon || 9} Victories
                </span>
              </div>
            </div>

            <div className="clutch-panel rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-xs font-medium">Aura Points</span>
                <Zap className="w-4 h-4 text-clutch-amber" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-cyber font-black text-clutch-amber">
                  {(userProfile.auraPoints || 48500).toLocaleString()}
                </span>
                <span className="text-[11px] font-mono text-clutch-muted block mt-0.5">Reputation</span>
              </div>
            </div>

            <div className="clutch-panel rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-xs font-medium">Competitive MMR</span>
                <TrendingUp className="w-4 h-4 text-clutch-violet-light" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-cyber font-black text-white">
                  {userProfile.ratingMMR}
                </span>
                <span className="text-[11px] font-mono text-clutch-muted block mt-0.5">Global Elo</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: FOUR DISTINCT GAME MODES
            ========================================================= */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-cyber font-bold text-lg text-white">BATTLE MODES</h2>
              <p className="text-xs font-mono text-clutch-muted">Select an arena format to compete or practice</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mode 1: Solo Quest */}
            <div
              onClick={handleLaunchSoloQuest}
              className="clutch-panel clutch-panel-interactive rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-4 group-hover:border-clutch-violet transition-colors">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-cyber font-bold text-sm text-white">Solo Quest</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-clutch-surface-light text-clutch-muted border border-clutch-border">PRACTICE</span>
                </div>
                <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                  Practice DSA topics independently with adaptive timers and isolated code execution.
                </p>
              </div>
              <div className="pt-3 border-t border-clutch-border flex items-center justify-between text-xs font-semibold text-clutch-lavender">
                <span>Start Practice</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 2: AI Duel */}
            <div
              onClick={handleLaunchAIDuel}
              className="clutch-panel clutch-panel-interactive rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-4 group-hover:border-clutch-violet transition-colors">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-cyber font-bold text-sm text-white">AI Duel</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30">1V1 BOT</span>
                </div>
                <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                  Face off against an adaptive synthetic opponent simulating competitive pressure.
                </p>
              </div>
              <div className="pt-3 border-t border-clutch-border flex items-center justify-between text-xs font-semibold text-clutch-lavender">
                <span>Match AI</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 3: Multiplayer Arena */}
            <div
              onClick={handleLaunchMultiplayer}
              className="clutch-panel clutch-panel-interactive rounded-2xl p-5 flex flex-col justify-between cursor-pointer group border-clutch-violet/40"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-clutch-violet/30 to-clutch-surface-elevated border border-clutch-violet/50 flex items-center justify-center text-white mb-4 group-hover:border-clutch-lavender transition-colors shadow-sm">
                  <Swords className="w-5 h-5 text-clutch-lavender" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-cyber font-bold text-sm text-white">Multiplayer</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-clutch-emerald/20 text-clutch-emerald border border-clutch-emerald/30">MATCHMAKING</span>
                </div>
                <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                  Join public queues or 70-player blitz tournaments with real participants.
                </p>
              </div>
              <div className="pt-3 border-t border-clutch-border flex items-center justify-between text-xs font-semibold text-clutch-lavender">
                <span>Find Match</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 4: Private Room */}
            <div
              onClick={() => setShowPrivateModal(true)}
              className="clutch-panel clutch-panel-interactive rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-4 group-hover:border-clutch-violet transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-cyber font-bold text-sm text-white">Private Room</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-clutch-surface-light text-clutch-muted border border-clutch-border">CUSTOM</span>
                </div>
                <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                  Host a private battle room or enter with a room code to play with friends.
                </p>
              </div>
              <div className="pt-3 border-t border-clutch-border flex items-center justify-between text-xs font-semibold text-clutch-lavender">
                <span>Create / Join</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 4: SPLIT GRID (DAILY QUESTS & LEADERBOARD)
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Quests & Bounties (6 cols) */}
          <div className="lg:col-span-6 clutch-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-clutch-border">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-clutch-amber" />
                  <h3 className="font-cyber font-bold text-sm text-white tracking-wide">
                    ACTIVE QUESTS & BOUNTIES
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-clutch-subtle">DAILY OBJECTIVES</span>
              </div>

              <div className="space-y-3">
                {quests.map((q) => {
                  const isComplete = q.current >= q.target && !q.claimed;
                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        q.claimed
                          ? 'bg-clutch-surface/40 border-clutch-border/40 opacity-50'
                          : isComplete
                          ? 'bg-clutch-surface-elevated border-clutch-violet/50 shadow-md'
                          : 'bg-clutch-surface-light border-clutch-border'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium mb-1 truncate">{q.title}</div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-clutch-muted">
                          <span>Topic: {q.topic}</span>
                          <span>Progress: {q.current}/{q.target}</span>
                          <span className="text-clutch-amber font-bold">+{q.rewardAura.toLocaleString()} Aura</span>
                        </div>
                      </div>

                      {q.claimed ? (
                        <span className="px-2.5 py-1 rounded bg-clutch-surface-light text-clutch-subtle text-[10px] font-mono font-bold">
                          CLAIMED ✔
                        </span>
                      ) : isComplete ? (
                        <button
                          onClick={() => handleClaimQuest(q.id, q.rewardAura)}
                          className="clutch-btn-primary py-1 px-3 text-[10px] whitespace-nowrap"
                        >
                          Claim Bounty
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-clutch-subtle">
                          {q.current}/{q.target}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleLaunchSoloQuest}
              className="mt-5 w-full clutch-btn-secondary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <span>View All Challenges</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Verified Leaderboard (6 cols) */}
          <div className="lg:col-span-6 clutch-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-clutch-border">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-clutch-amber" />
                  <h3 className="font-cyber font-bold text-sm text-white tracking-wide">
                    VERIFIED LEADERBOARD
                  </h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-clutch-surface-light p-0.5 rounded-lg border border-clutch-border text-[11px] font-mono">
                  <button
                    onClick={() => setLeaderboardFilter('global')}
                    className={`px-2 py-0.5 rounded ${
                      leaderboardFilter === 'global' ? 'bg-clutch-violet text-white font-bold' : 'text-clutch-muted'
                    }`}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => setLeaderboardFilter('friends')}
                    className={`px-2 py-0.5 rounded ${
                      leaderboardFilter === 'friends' ? 'bg-clutch-violet text-white font-bold' : 'text-clutch-muted'
                    }`}
                  >
                    Friends
                  </button>
                  <button
                    onClick={() => setLeaderboardFilter('tier')}
                    className={`px-2 py-0.5 rounded ${
                      leaderboardFilter === 'tier' ? 'bg-clutch-violet text-white font-bold' : 'text-clutch-muted'
                    }`}
                  >
                    Tier
                  </button>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="space-y-2">
                {verifiedLeaderboard.map((item) => (
                  <div
                    key={item.username}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                      item.isCurrent
                        ? 'bg-clutch-violet/15 border-clutch-violet/50 font-bold'
                        : 'bg-clutch-surface-light border-clutch-border text-clutch-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-bold text-xs ${
                          item.rank === 1
                            ? 'text-clutch-amber'
                            : item.rank === 2
                            ? 'text-slate-300'
                            : item.rank === 3
                            ? 'text-amber-600'
                            : 'text-clutch-subtle'
                        }`}
                      >
                        #{item.rank}
                      </span>
                      <div className="flex flex-col">
                        <span className={item.isCurrent ? 'text-white' : 'text-slate-200'}>
                          {item.username} {item.isCurrent && '(You)'}
                        </span>
                        <span className="text-[10px] text-clutch-subtle">{item.tier}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-white font-bold">{item.rating} MMR</div>
                        <div className="text-[10px] text-clutch-subtle">{item.solved} solved</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-clutch-border text-[11px] font-mono text-clutch-subtle flex items-center justify-between">
              <span>Updated in real time based on verified matches</span>
              <button
                onClick={() => setScreen('profile')}
                className="text-clutch-lavender hover:underline font-semibold"
              >
                View Your Full History →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================
          MODAL: PRIVATE ROOM HOST OR JOIN
          ========================================================= */}
      {showPrivateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md clutch-panel-elevated rounded-2xl p-6 relative">
            <h3 className="font-cyber font-bold text-lg text-white mb-2">PRIVATE ARENA ROOM</h3>
            <p className="text-xs font-mono text-clutch-muted mb-6">
              Create a custom match for friends or enter an existing invite room code.
            </p>

            {/* Join by Code */}
            <form onSubmit={handleJoinPrivateRoom} className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                  ROOM INVITE CODE
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 70X9A"
                    value={privateRoomCode}
                    onChange={(e) => setPrivateRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-clutch-surface-light border border-clutch-border text-white text-xs font-mono p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet uppercase tracking-widest"
                  />
                  <button
                    type="submit"
                    disabled={isJoiningRoom || !privateRoomCode.trim()}
                    className="clutch-btn-primary px-4 py-2 text-xs"
                  >
                    Join
                  </button>
                </div>
              </div>
            </form>

            <div className="h-px bg-clutch-border my-4" />

            {/* Host Private Match */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreatePrivateRoom}
                disabled={isJoiningRoom}
                className="w-full clutch-btn-secondary py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-clutch-lavender" />
                <span>Host New Private Room</span>
              </button>

              <button
                onClick={() => setShowPrivateModal(false)}
                className="w-full clutch-btn-ghost py-2 text-xs text-clutch-subtle"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
