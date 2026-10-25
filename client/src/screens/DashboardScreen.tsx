import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { CyberNavBar } from '../components/navigation/CyberNavBar.js';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Swords,
  Compass,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';

interface DailyQuest {
  id: string;
  title: string;
  rewardAura: number;
  current: number;
  total: number;
  claimed: boolean;
}

export const DashboardScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [quests, setQuests] = useState<DailyQuest[]>([
    { id: 'q-1', title: 'Solve 2 Sliding Window / Array challenges', rewardAura: 2500, current: 2, total: 2, claimed: false },
    { id: 'q-2', title: 'Maintain a 5x Combo streak in 1v1 Duel', rewardAura: 3500, current: 5, total: 5, claimed: false },
    { id: 'q-3', title: 'Swipe 8 DSA Brainrot Shorts correctly', rewardAura: 1500, current: 6, total: 8, claimed: false }
  ]);

  const claimQuest = (questId: string, reward: number) => {
    soundSynth.airhorn();
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    soundSynth.speakHype(`Bounty claimed! Plus ${reward.toLocaleString()} Aura!`, 'hype');

    const nextAura = (userProfile.auraPoints || 48500) + reward;
    updateUserProfile({ auraPoints: nextAura });

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );
  };

  const winRate = userProfile.stats?.matchesPlayed
    ? Math.round(((userProfile.stats?.matchesWon || 0) / userProfile.stats.matchesPlayed) * 100)
    : 64;

  const topics = [
    { name: 'Arrays & Strings', progress: 85, color: 'from-cyan-500 to-blue-500' },
    { name: 'Trees & BST', progress: 70, color: 'from-emerald-500 to-teal-500' },
    { name: 'Dynamic Programming', progress: 58, color: 'from-violet-500 to-purple-500' },
    { name: 'Stacks & Queues', progress: 90, color: 'from-amber-500 to-orange-500' },
    { name: 'Heaps & Priority Queues', progress: 65, color: 'from-rose-500 to-pink-500' },
    { name: 'Graphs & BFS/DFS', progress: 78, color: 'from-indigo-500 to-cyan-500' }
  ];

  const recentMatches = [
    { mode: '1v1 Ranked Duel', opponent: 'AlgoSpark_AI', result: 'VICTORY', score: 380, time: '3m ago', auraDelta: '+1,800' },
    { mode: 'Mega Arena (100 Players)', opponent: '100 Combatants', result: 'RANK #3', score: 620, time: '45m ago', auraDelta: '+3,500' },
    { mode: 'Solo Quest Odyssey', opponent: 'Tree Master Chapter', result: 'COMPLETED', score: 240, time: '2h ago', auraDelta: '+1,200' },
    { mode: '1v1 Ranked Duel', opponent: 'FlashBinary_AI', result: 'DEFEAT', score: 180, time: '5h ago', auraDelta: '-500' }
  ];

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-y-auto select-none relative">
      <CyberNavBar activeTab="dashboard" />

      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Cyber Background Glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col gap-6 z-10">
        {/* Top Profile Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-violet-950/40 to-slate-900/90 border border-violet-500/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl border-2 border-cyan-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.4)] relative"
              style={{ backgroundColor: userProfile.avatar.color }}
            >
              <span>🥷</span>
              <div className="absolute -bottom-2 -right-2 text-xs">🔥</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-cyber font-black text-2xl text-white tracking-wide">
                  {userProfile.username}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono">
                  {userProfile.rankTier}
                </span>
              </div>
              <div className="text-xs font-cyber text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                {userProfile.equippedTitle || 'Algorithm Rizzler 👑'}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 sm:gap-8 text-center font-mono">
            <div>
              <div className="text-xl sm:text-2xl font-cyber font-black text-amber-400">
                {(userProfile.auraPoints || 48500).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Aura Points</div>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div>
              <div className="text-xl sm:text-2xl font-cyber font-black text-cyan-400">
                {userProfile.ratingMMR}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Rating MMR</div>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div>
              <div className="text-xl sm:text-2xl font-cyber font-black text-emerald-400">
                {winRate}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Win Rate</div>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div>
              <div className="text-xl sm:text-2xl font-cyber font-black text-rose-400 flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 fill-current" />
                <span>{userProfile.stats?.highestStreak || 7}x</span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Max Streak</div>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Topic Mastery & Daily Bounties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Algorithmic Topic Mastery */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-violet-500/25 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-cyber font-bold text-sm text-white tracking-wider">
                    ALGORITHMIC MASTERY RADAR
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">OVERALL: 74.3%</span>
              </div>

              <div className="space-y-4">
                {topics.map((t) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300">{t.name}</span>
                      <span className="text-cyan-400 font-bold">{t.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${t.color} transition-all duration-700`}
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setScreen('solo_quest')}
              className="mt-6 w-full cyber-btn cyber-btn-outline py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <span>CONTINUE TOPIC ODYSSEY</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Column 2: Daily Quests & Aura Bounties */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-violet-500/25 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <h3 className="font-cyber font-bold text-sm text-white tracking-wider">
                    DAILY AURA BOUNTIES
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400">RESETS IN 06:14:22</span>
              </div>

              <div className="space-y-3">
                {quests.map((q) => {
                  const isReadyToClaim = q.current >= q.total && !q.claimed;
                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono transition-all ${
                        q.claimed
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : isReadyToClaim
                          ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-slate-200 font-medium mb-1">{q.title}</div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>Progress: {q.current}/{q.total}</span>
                          <span className="text-amber-400 font-bold">+{q.rewardAura.toLocaleString()} AURA</span>
                        </div>
                      </div>

                      {q.claimed ? (
                        <span className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                          CLAIMED ✔
                        </span>
                      ) : isReadyToClaim ? (
                        <button
                          onClick={() => claimQuest(q.id, q.rewardAura)}
                          className="px-3 py-1.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-cyber font-black text-[10px] tracking-wider animate-bounce shadow-lg"
                        >
                          CLAIM BOUNTY
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">IN PROGRESS</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setScreen('brainrot_shorts')}
              className="mt-6 w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-cyber font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>SWIPE BRAINROT SHORTS (+1K AURA)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Matches Feed */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-violet-500/25 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <h3 className="font-cyber font-bold text-sm text-white tracking-wider">
                RECENT MATCH LOGS
              </h3>
            </div>
            <button
              onClick={() => setScreen('lobby')}
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              Enter New Match →
            </button>
          </div>

          <div className="space-y-2 overflow-x-auto">
            {recentMatches.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs font-mono min-w-[500px]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.result.includes('VICTORY') || m.result.includes('RANK #3') || m.result.includes('COMPLETED')
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {m.result}
                  </span>
                  <span className="font-cyber font-bold text-slate-200">{m.mode}</span>
                  <span className="text-slate-500">vs {m.opponent}</span>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-slate-400">Score: {m.score} pts</span>
                  <span
                    className={`font-bold ${
                      m.auraDelta.startsWith('+') ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {m.auraDelta} Aura
                  </span>
                  <span className="text-slate-500 text-[10px]">{m.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
