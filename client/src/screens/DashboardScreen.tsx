import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { ArenaHero3D } from '../components/arena3d/ArenaHero3D.js';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config/api.js';
import { DSATopic, ConceptMasteryRecord } from '../../../shared/types.js';
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
  ChevronDown,
  Filter,
  Copy,
  Check,
  BrainCircuit,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Play,
  Gamepad2
} from 'lucide-react';
import { FriendsModal } from '../components/friends/FriendsModal.js';

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
  const setSoloTopic = useGameStore((s) => s.setSoloTopic);
  const setOnboardingOpen = useGameStore((s) => s.setOnboardingOpen);
  const conceptMastery = useGameStore((s) => s.conceptMastery);
  const setConceptMastery = useGameStore((s) => s.setConceptMastery);

  const [leaderboardFilter, setLeaderboardFilter] = useState<'global' | 'friends' | 'tier'>('global');
  const [mobileBottomTab, setMobileBottomTab] = useState<'quests' | 'leaderboard'>('quests');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'focus' | 'mastered'>('all');
  const [showAllMasteryMobile, setShowAllMasteryMobile] = useState<boolean>(false);
  const [showPrivateModal, setShowPrivateModal] = useState<boolean>(false);
  const [friendsModalOpen, setFriendsModalOpen] = useState<boolean>(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [privateRoomCode, setPrivateRoomCode] = useState<string>('');
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [loadingMastery, setLoadingMastery] = useState<boolean>(false);
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchMastery = async () => {
      setLoadingMastery(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/dsa-mastery?userId=${userProfile.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.mastery && isMounted) {
            setConceptMastery(data.mastery);
          }
        }
      } catch (err) {
        // Fallback to store conceptMastery
      } finally {
        if (isMounted) setLoadingMastery(false);
      }
    };
    fetchMastery();

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          if (data.leaderboard && isMounted) {
            setLiveLeaderboard(data.leaderboard);
          }
        }
      } catch (err) {
        // Fallback handled gracefully
      }
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);

    const fetchFriends = async () => {
      if (userProfile.isGuest) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/friends?userId=${userProfile.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.friends && isMounted) {
            setFriendsList(data.friends);
          }
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchFriends();

    const unsubAccepted = socketService.on('friend_request_accepted', () => {
      fetchFriends();
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof unsubAccepted === 'function') unsubAccepted();
    };
  }, [userProfile.id, userProfile.isGuest]);

  // Daily Quests tied strictly to real user achievements and solo solved IDs
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
      current: Math.min(5, userProfile.stats?.highestStreak || 0),
      target: 5,
      claimed: false
    },
    {
      id: 'quest-shorts',
      title: 'Correctly Solve 5 DSA Challenges',
      topic: 'DSA Practice',
      rewardAura: 1500,
      current: Math.min(5, userProfile.stats?.challengesSolved || 0),
      target: 5,
      claimed: false
    }
  ]);

  const handleClaimQuest = (questId: string, reward: number) => {
    soundSynth.levelUp();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    const currentAura = userProfile.auraPoints || 0;
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

  // Verified 13 Core DSA Disciplines
  const ALL_TOPICS: { id: DSATopic; label: string }[] = [
    { id: 'arrays_and_strings', label: 'Arrays & Strings' },
    { id: 'searching_and_sorting', label: 'Searching & Sorting' },
    { id: 'linked_lists', label: 'Linked Lists' },
    { id: 'stacks_and_queues', label: 'Stacks & Queues' },
    { id: 'recursion_and_backtracking', label: 'Recursion & Backtracking' },
    { id: 'trees_and_bst', label: 'Trees & BST' },
    { id: 'graphs', label: 'Graphs & Traversal' },
    { id: 'greedy_algorithms', label: 'Greedy Algorithms' },
    { id: 'dynamic_programming', label: 'Dynamic Programming' },
    { id: 'hashing', label: 'Hashing & Hashmaps' },
    { id: 'heaps_and_priority_queues', label: 'Heaps & Priority Queues' },
    { id: 'bit_manipulation', label: 'Bit Manipulation' },
    { id: 'complexity_analysis', label: 'Complexity Analysis' }
  ];

  // Derived real mastery statistics
  const masteryEntries = Object.values(conceptMastery);
  const totalAttempted = masteryEntries.reduce((sum, m) => sum + (m.questionsAttempted || 0), 0);
  const totalSolved = masteryEntries.reduce((sum, m) => sum + (m.questionsSolved || 0), 0);
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;
  
  const sortedByMastery = [...ALL_TOPICS].sort((a, b) => {
    const scoreA = conceptMastery[a.id]?.masteryScore ?? 50;
    const scoreB = conceptMastery[b.id]?.masteryScore ?? 50;
    return scoreB - scoreA;
  });

  const strongestTopic = sortedByMastery[0];
  const remediationTopics = ALL_TOPICS.filter(t => conceptMastery[t.id]?.needsRemediation);
  const recommendedPracticeTopic = remediationTopics.length > 0 
    ? remediationTopics[0] 
    : sortedByMastery[sortedByMastery.length - 1];

  const handlePracticeTopic = (topicId: DSATopic) => {
    soundSynth.click();
    setSoloTopic(topicId);
    setScreen('solo_quest');
  };

  // Filtered topics for mobile & desktop
  const filteredTopics = ALL_TOPICS.filter((topic) => {
    const record = conceptMastery[topic.id];
    const score = record?.masteryScore ?? 50;
    if (masteryFilter === 'focus') {
      return record?.needsRemediation || score < 60;
    }
    if (masteryFilter === 'mastered') {
      return score >= 80;
    }
    return true;
  });

  // Real Leaderboard Records
  const combinedPilots: any[] = [...liveLeaderboard];
  const userInLeaderboard = combinedPilots.find(p => p.id === userProfile.id || p.username === userProfile.username);
  if (!userInLeaderboard) {
    combinedPilots.push({
      id: userProfile.id,
      username: userProfile.username,
      ratingMMR: userProfile.ratingMMR,
      rankTier: userProfile.rankTier,
      auraPoints: userProfile.auraPoints || 0,
      solved: userProfile.stats?.challengesSolved || 0
    });
  }

  combinedPilots.sort((a, b) => (b.ratingMMR || 1200) - (a.ratingMMR || 1200) || (b.solved || 0) - (a.solved || 0));

  let filteredLeaderboard = combinedPilots;
  if (leaderboardFilter === 'friends') {
    const friendIds = new Set(friendsList.map(f => f.id));
    filteredLeaderboard = combinedPilots.filter(p => p.id === userProfile.id || friendIds.has(p.id));
    for (const f of friendsList) {
      if (!filteredLeaderboard.some(p => p.id === f.id)) {
        filteredLeaderboard.push({
          id: f.id,
          username: f.username,
          ratingMMR: f.ratingMMR || 1200,
          rankTier: f.rankTier || 'Novice Bit',
          auraPoints: f.auraPoints || 0,
          solved: f.stats?.challengesSolved || 0
        });
      }
    }
    filteredLeaderboard.sort((a, b) => (b.ratingMMR || 1200) - (a.ratingMMR || 1200) || (b.solved || 0) - (a.solved || 0));
  } else if (leaderboardFilter === 'tier') {
    filteredLeaderboard = combinedPilots.filter(p => (p.rankTier || 'Novice Bit') === userProfile.rankTier);
  }

  const verifiedLeaderboard = filteredLeaderboard.map((item, idx) => ({
    rank: idx + 1,
    id: item.id,
    username: item.username,
    tier: item.rankTier || 'Novice Bit',
    rating: item.ratingMMR || 1200,
    solved: item.solved || item.stats?.challengesSolved || 0,
    aura: item.auraPoints || 0,
    isCurrent: item.id === userProfile.id || item.username === userProfile.username
  }));

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
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 flex flex-col gap-4 sm:gap-8 pb-28 md:pb-12 overflow-x-hidden min-w-0">
        
        {/* =========================================================
            SECTION 1: TACTICAL HERO / ARENA LAUNCH COMMAND
            ========================================================= */}
        <section className="w-full rounded-2xl bg-gradient-to-r from-clutch-surface via-clutch-surface-light to-clutch-surface border border-clutch-border p-4 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-1/3 w-80 h-80 bg-clutch-violet/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center relative z-10">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clutch-violet/15 border border-clutch-violet/30 text-clutch-lavender text-[10px] sm:text-xs font-mono mb-2 sm:mb-4">
                <Sparkles className="w-3 h-3 text-clutch-lavender" />
                <span>COMPETITIVE ALGORITHMIC ARENA</span>
              </div>

              <h1 className="font-cyber font-black text-xl xs:text-2xl sm:text-4xl md:text-5xl text-white tracking-wide leading-tight mb-2 sm:mb-3 break-words">
                ENTER THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-clutch-lavender via-clutch-violet-light to-white">CLUTCH ARENA</span>
              </h1>

              <p className="text-clutch-muted text-xs sm:text-base leading-relaxed max-w-xl mb-4 sm:mb-6 font-normal">
                Compete in real-time synchronized coding duels, master complex data structures through interactive puzzles, and advance your algorithmic tier.
              </p>

              {/* Primary & Secondary Actions - Full touch-friendly responsive on mobile */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleLaunchMultiplayer}
                  className="clutch-btn-primary py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.35)] font-bold whitespace-nowrap"
                >
                  <Swords className="w-4 h-4 shrink-0" />
                  <span>Enter Arena</span>
                </button>

                <button
                  onClick={handleLaunchSoloQuest}
                  className="clutch-btn-secondary py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm flex items-center justify-center gap-2 font-bold whitespace-nowrap"
                >
                  <Compass className="w-4 h-4 text-clutch-lavender shrink-0" />
                  <span>Practice Solo</span>
                </button>
              </div>
            </div>

            {/* Right 3D Visual Focal Point (5 cols) - Scaled cleanly for mobile */}
            <div className="lg:col-span-5 h-44 xs:h-52 sm:h-80 w-full relative flex items-center justify-center overflow-hidden rounded-xl">
              <ArenaHero3D height="100%" />
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: PLAYER PROGRESSION & METRICS
            ========================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
          {/* Identity & XP Bar (7 cols) */}
          <div className="lg:col-span-7 clutch-panel rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-xl font-cyber font-black text-white shadow-lg border border-clutch-violet/40 shrink-0"
                  style={{ backgroundColor: userProfile.avatar.color }}
                >
                  {userProfile.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-cyber font-bold text-sm sm:text-lg text-white truncate">
                      {userProfile.username}
                    </h2>
                    <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 shrink-0">
                      LVL {currentLevel}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-clutch-lavender mt-0.5 truncate">
                    {userProfile.rankTier} &bull; {userProfile.equippedTitle || 'Algorithm Rizzler 👑'}
                  </div>
                </div>
              </div>

              {/* Streak Badge */}
              <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-clutch-surface-elevated border border-clutch-amber/30 text-clutch-amber font-mono text-xs font-bold shrink-0">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{userProfile.stats?.highestStreak || 0}x</span>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-clutch-muted">Tier Progression: Lvl {currentLevel}</span>
                <span className="text-white font-bold">{xpInCurrentLevel} / {xpThreshold} MMR</span>
              </div>
              <div className="w-full h-2 sm:h-2.5 rounded-full bg-clutch-surface-light border border-clutch-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-clutch-violet to-clutch-lavender rounded-full transition-all duration-500"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-clutch-subtle mt-1.5">
                <span>Current MMR: {userProfile.ratingMMR}</span>
                <span>Next Rank: Lvl {currentLevel + 1}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid (5 cols desktop, 2x2 on mobile) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-4">
            <div className="clutch-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-[11px] sm:text-xs font-medium truncate">Solved</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-clutch-emerald shrink-0" />
              </div>
              <div className="mt-1 sm:mt-2">
                <span className="text-xl sm:text-2xl font-cyber font-black text-white">
                  {userProfile.stats?.challengesSolved || 0}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-clutch-muted block">DSA Tasks</span>
              </div>
            </div>

            <div className="clutch-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-[11px] sm:text-xs font-medium truncate">Matches</span>
                <Swords className="w-3.5 h-3.5 text-clutch-lavender shrink-0" />
              </div>
              <div className="mt-1 sm:mt-2">
                <span className="text-xl sm:text-2xl font-cyber font-black text-white">
                  {userProfile.stats?.matchesPlayed || 0}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-clutch-muted block">
                  {userProfile.stats?.matchesWon || 0} Won
                </span>
              </div>
            </div>

            <div className="clutch-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-[11px] sm:text-xs font-medium truncate">Aura Points</span>
                <Zap className="w-3.5 h-3.5 text-clutch-amber shrink-0" />
              </div>
              <div className="mt-1 sm:mt-2">
                <span className="text-lg sm:text-xl font-cyber font-black text-clutch-amber">
                  {(userProfile.auraPoints || 0).toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-clutch-muted block">Reputation</span>
              </div>
            </div>

            <div className="clutch-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-clutch-subtle">
                <span className="text-[11px] sm:text-xs font-medium truncate">Rating MMR</span>
                <TrendingUp className="w-3.5 h-3.5 text-clutch-violet-light shrink-0" />
              </div>
              <div className="mt-1 sm:mt-2">
                <span className="text-xl sm:text-2xl font-cyber font-black text-white">
                  {userProfile.ratingMMR}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-clutch-muted block">Global Elo</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: FOUR DISTINCT GAME MODES (Tactile 2x2 on Mobile, 4-col Desktop)
            ========================================================= */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-cyber font-bold text-base sm:text-lg text-white">BATTLE MODES</h2>
              <p className="text-[11px] sm:text-xs font-mono text-clutch-muted">Select an arena format to compete or practice</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Mode 1: Solo Quest */}
            <div
              onClick={handleLaunchSoloQuest}
              className="clutch-panel clutch-panel-interactive rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] touch-manipulation"
            >
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-2.5 sm:mb-4 group-hover:border-clutch-violet transition-colors">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-cyber font-bold text-xs sm:text-sm text-white">Solo Quest</h3>
                  <span className="hidden xs:inline px-1 py-0.2 rounded text-[8.5px] font-mono bg-clutch-surface-light text-clutch-muted border border-clutch-border">PRACTICE</span>
                </div>
                <p className="text-[11px] text-clutch-muted leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                  Practice DSA topics independently with adaptive timers.
                </p>
              </div>
              <div className="pt-2 sm:pt-3 border-t border-clutch-border flex items-center justify-between text-[11px] sm:text-xs font-semibold text-clutch-lavender">
                <span>Practice</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 2: AI Duel */}
            <div
              onClick={handleLaunchAIDuel}
              className="clutch-panel clutch-panel-interactive rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] touch-manipulation"
            >
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-2.5 sm:mb-4 group-hover:border-clutch-violet transition-colors">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-cyber font-bold text-xs sm:text-sm text-white">AI Duel</h3>
                  <span className="hidden xs:inline px-1 py-0.2 rounded text-[8.5px] font-mono bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30">1V1 BOT</span>
                </div>
                <p className="text-[11px] text-clutch-muted leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                  Face off against an adaptive synthetic bot opponent.
                </p>
              </div>
              <div className="pt-2 sm:pt-3 border-t border-clutch-border flex items-center justify-between text-[11px] sm:text-xs font-semibold text-clutch-lavender">
                <span>Match Bot</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 3: Multiplayer Arena */}
            <div
              onClick={handleLaunchMultiplayer}
              className="clutch-panel clutch-panel-interactive rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between cursor-pointer group border-clutch-violet/40 active:scale-[0.98] touch-manipulation"
            >
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-clutch-violet/30 to-clutch-surface-elevated border border-clutch-violet/50 flex items-center justify-center text-white mb-2.5 sm:mb-4 group-hover:border-clutch-lavender transition-colors shadow-sm">
                  <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-clutch-lavender" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-cyber font-bold text-xs sm:text-sm text-white">Multiplayer</h3>
                  <span className="hidden xs:inline px-1 py-0.2 rounded text-[8.5px] font-mono bg-clutch-emerald/20 text-clutch-emerald border border-clutch-emerald/30">QUEUE</span>
                </div>
                <p className="text-[11px] text-clutch-muted leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                  Join public matchmaking with 70-player synchronized arenas.
                </p>
              </div>
              <div className="pt-2 sm:pt-3 border-t border-clutch-border flex items-center justify-between text-[11px] sm:text-xs font-semibold text-clutch-lavender">
                <span>Find Match</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mode 4: Private Room */}
            <div
              onClick={() => setShowPrivateModal(true)}
              className="clutch-panel clutch-panel-interactive rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] touch-manipulation"
            >
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-2.5 sm:mb-4 group-hover:border-clutch-violet transition-colors">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-cyber font-bold text-xs sm:text-sm text-white">Private Room</h3>
                  <span className="hidden xs:inline px-1 py-0.2 rounded text-[8.5px] font-mono bg-clutch-surface-light text-clutch-muted border border-clutch-border">CUSTOM</span>
                </div>
                <p className="text-[11px] text-clutch-muted leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                  Host custom battles or enter with a room code to duel friends.
                </p>
              </div>
              <div className="pt-2 sm:pt-3 border-t border-clutch-border flex items-center justify-between text-[11px] sm:text-xs font-semibold text-clutch-lavender">
                <span>Host / Join</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 4: DSA ADAPTIVE CONCEPT MASTERY & PROGRESSION
            ========================================================= */}
        <section className="clutch-panel rounded-2xl p-4 sm:p-6 relative overflow-hidden border border-clutch-violet/30 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-clutch-border">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender shrink-0">
                <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-cyber font-bold text-sm sm:text-lg text-white">DSA CONCEPT MASTERY</h2>
                  <span className="hidden xs:inline px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-semibold">
                    ADAPTIVE
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs font-mono text-clutch-muted">
                  Evidence-based proficiency across 13 core computer science topics
                </p>
              </div>
            </div>

            <button
              onClick={() => setOnboardingOpen(true)}
              className="clutch-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 shrink-0 self-end sm:self-auto border-cyan-500/30 hover:border-cyan-400"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Preferences</span>
            </button>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 rounded-xl bg-clutch-surface-light border border-clutch-border flex flex-col justify-between">
              <span className="text-[9.5px] sm:text-[10px] font-mono text-clutch-subtle uppercase tracking-wider">Level Calibrated</span>
              <div className="text-sm sm:text-lg font-cyber font-bold text-white capitalize mt-0.5">
                {userProfile.dsaPreferences?.assessedLevel || userProfile.dsaPreferences?.experienceLevel || 'Calibrated'}
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 mt-0.5 truncate">
                {userProfile.dsaPreferences?.languages?.map(l => l.toUpperCase()).join(', ') || 'PYTHON'}
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-clutch-surface-light border border-clutch-border flex flex-col justify-between">
              <span className="text-[9.5px] sm:text-[10px] font-mono text-clutch-subtle uppercase tracking-wider">Top Proficiency</span>
              <div className="text-sm sm:text-lg font-cyber font-bold text-emerald-400 truncate mt-0.5">
                {strongestTopic.label}
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-clutch-muted mt-0.5">
                {conceptMastery[strongestTopic.id]?.masteryScore ?? 50}% Evidence
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-clutch-surface-light border border-clutch-border flex flex-col justify-between">
              <span className="text-[9.5px] sm:text-[10px] font-mono text-clutch-subtle uppercase tracking-wider">Recommended Focus</span>
              <div className="text-sm sm:text-lg font-cyber font-bold text-amber-400 truncate mt-0.5">
                {recommendedPracticeTopic.label}
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-clutch-muted mt-0.5">
                {remediationTopics.length > 0 ? '⚠ Remediation' : 'Ready'}
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-clutch-surface-light border border-clutch-border flex flex-col justify-between">
              <span className="text-[9.5px] sm:text-[10px] font-mono text-clutch-subtle uppercase tracking-wider">Accuracy / Solved</span>
              <div className="text-sm sm:text-lg font-cyber font-bold text-white mt-0.5">
                {overallAccuracy}% <span className="text-[10px] font-mono text-clutch-subtle font-normal">({totalSolved}/{totalAttempted})</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-clutch-lavender mt-0.5">
                13 Active Disciplines
              </span>
            </div>
          </div>

          {/* Mobile Filter Chips */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
              <button
                onClick={() => setMasteryFilter('all')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all whitespace-nowrap ${
                  masteryFilter === 'all'
                    ? 'bg-clutch-violet text-white border-clutch-violet shadow-sm'
                    : 'bg-clutch-surface-light text-clutch-muted border-clutch-border hover:text-white'
                }`}
              >
                All (13)
              </button>
              <button
                onClick={() => setMasteryFilter('focus')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all whitespace-nowrap ${
                  masteryFilter === 'focus'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-clutch-surface-light text-clutch-muted border-clutch-border hover:text-white'
                }`}
              >
                Needs Focus ({remediationTopics.length})
              </button>
              <button
                onClick={() => setMasteryFilter('mastered')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all whitespace-nowrap ${
                  masteryFilter === 'mastered'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-clutch-surface-light text-clutch-muted border-clutch-border hover:text-white'
                }`}
              >
                Mastered
              </button>
            </div>

            <button
              onClick={() => setShowAllMasteryMobile(!showAllMasteryMobile)}
              className="sm:hidden text-[11px] font-mono text-clutch-lavender flex items-center gap-0.5 shrink-0"
            >
              <span>{showAllMasteryMobile ? 'Collapse' : 'Show All'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showAllMasteryMobile ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* 13 Disciplines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredTopics.slice(0, showAllMasteryMobile ? undefined : 6).map((topic) => {
              const record = conceptMastery[topic.id] || {
                topic: topic.id,
                masteryScore: 50,
                currentDifficulty: 'easy' as const,
                questionsAttempted: 0,
                questionsSolved: 0,
                recentAccuracy: 0,
                averageResponseTimeMs: 0,
                consecutiveCorrect: 0,
                consecutiveWrong: 0,
                needsRemediation: false,
                lastUpdated: 0
              };

              const diffColors: Record<string, string> = {
                easy: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
                medium: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300',
                hard: 'bg-amber-950/40 border-amber-500/40 text-amber-300',
                advanced: 'bg-purple-950/40 border-purple-500/40 text-purple-300',
                extreme_hard: 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              };

              const score = record.masteryScore ?? 50;

              return (
                <div
                  key={topic.id}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col justify-between group ${
                    record.needsRemediation
                      ? 'bg-rose-950/15 border-rose-900/50 hover:border-rose-700'
                      : 'bg-clutch-surface-light border-clutch-border hover:border-clutch-violet/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                      <h4 className="text-xs font-cyber font-bold text-white group-hover:text-clutch-lavender transition-colors truncate">
                        {topic.label}
                      </h4>
                      <span className={`px-1.5 py-0.2 rounded text-[8.5px] sm:text-[9px] font-mono uppercase font-bold border shrink-0 ${diffColors[record.currentDifficulty] || diffColors.easy}`}>
                        {record.currentDifficulty}
                      </span>
                    </div>

                    {/* Mastery Bar */}
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-clutch-subtle">Mastery</span>
                        <span className="font-bold text-white">{score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            record.needsRemediation
                              ? 'bg-rose-500'
                              : score >= 80
                              ? 'bg-emerald-400'
                              : score >= 60
                              ? 'bg-cyan-400'
                              : 'bg-clutch-violet'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-1 py-1 sm:py-1.5 border-t border-b border-clutch-border/60 text-[9.5px] sm:text-[10px] font-mono">
                      <div>
                        <span className="text-clutch-subtle block">Solved</span>
                        <span className="text-white font-bold">{record.questionsSolved}/{record.questionsAttempted}</span>
                      </div>
                      <div>
                        <span className="text-clutch-subtle block">Acc.</span>
                        <span className="text-white font-bold">{record.recentAccuracy}%</span>
                      </div>
                      <div>
                        <span className="text-clutch-subtle block">Speed</span>
                        <span className="text-white font-bold">
                          {record.averageResponseTimeMs > 0 ? `${(record.averageResponseTimeMs / 1000).toFixed(1)}s` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePracticeTopic(topic.id)}
                    className="mt-2.5 w-full clutch-btn-secondary py-1 text-[11px] font-mono flex items-center justify-center gap-1.5 group-hover:border-clutch-violet group-hover:text-white"
                  >
                    <span>Practice Topic</span>
                    <ArrowRight className="w-3 h-3 text-clutch-lavender" />
                  </button>
                </div>
              );
            })}
          </div>

          {!showAllMasteryMobile && filteredTopics.length > 6 && (
            <div className="sm:hidden text-center mt-3 pt-2 border-t border-clutch-border">
              <button
                onClick={() => setShowAllMasteryMobile(true)}
                className="text-xs font-mono text-clutch-lavender flex items-center justify-center gap-1 mx-auto py-1"
              >
                <span>View All {filteredTopics.length} Topics</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* =========================================================
            SECTION 5: SPLIT GRID (DAILY QUESTS & LEADERBOARD)
            On mobile, offers a segmented toggle for fast single-touch switching!
            ========================================================= */}
        <div className="flex flex-col gap-3">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex items-center justify-center p-1 rounded-xl bg-clutch-surface border border-clutch-border">
            <button
              onClick={() => {
                soundSynth.click();
                setMobileBottomTab('quests');
              }}
              className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mobileBottomTab === 'quests'
                  ? 'bg-clutch-violet text-white shadow-md'
                  : 'text-clutch-muted hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Quests ({quests.filter(q => !q.claimed).length})</span>
            </button>

            <button
              onClick={() => {
                soundSynth.click();
                setMobileBottomTab('leaderboard');
              }}
              className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mobileBottomTab === 'leaderboard'
                  ? 'bg-clutch-violet text-white shadow-md'
                  : 'text-clutch-muted hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Rankings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Daily Quests & Bounties (6 cols on desktop, responsive tab on mobile) */}
            <div className={`lg:col-span-6 clutch-panel rounded-2xl p-4 sm:p-6 flex flex-col justify-between ${
              mobileBottomTab === 'quests' ? 'block' : 'hidden lg:flex'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-clutch-border">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-clutch-amber" />
                    <h3 className="font-cyber font-bold text-xs sm:text-sm text-white tracking-wide">
                      ACTIVE QUESTS & BOUNTIES
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-clutch-subtle">DAILY OBJECTIVES</span>
                </div>

                <div className="space-y-2.5">
                  {quests.map((q) => {
                    const isComplete = q.current >= q.target && !q.claimed;
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                          q.claimed
                            ? 'bg-clutch-surface/40 border-clutch-border/40 opacity-50'
                            : isComplete
                            ? 'bg-clutch-surface-elevated border-clutch-violet/50 shadow-md'
                            : 'bg-clutch-surface-light border-clutch-border'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium mb-0.5 truncate">{q.title}</div>
                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-clutch-muted truncate">
                            <span>{q.topic}</span>
                            <span>&bull;</span>
                            <span className="text-clutch-amber font-bold">+{q.rewardAura.toLocaleString()} Aura</span>
                          </div>
                        </div>

                        {q.claimed ? (
                          <span className="px-2 py-0.5 rounded bg-clutch-surface-light text-clutch-subtle text-[9px] font-mono font-bold shrink-0">
                            CLAIMED ✔
                          </span>
                        ) : isComplete ? (
                          <button
                            onClick={() => handleClaimQuest(q.id, q.rewardAura)}
                            className="clutch-btn-primary py-1 px-2.5 text-[10px] whitespace-nowrap shrink-0 animate-pulse"
                          >
                            Claim
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-clutch-subtle shrink-0">
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
                className="mt-4 w-full clutch-btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <span>View All Solo Quests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Verified Leaderboard (6 cols on desktop, responsive tab on mobile) */}
            <div className={`lg:col-span-6 clutch-panel rounded-2xl p-4 sm:p-6 flex flex-col justify-between ${
              mobileBottomTab === 'leaderboard' ? 'block' : 'hidden lg:flex'
            }`}>
              <div>
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3.5 pb-2.5 border-b border-clutch-border gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Trophy className="w-4 h-4 text-clutch-amber shrink-0" />
                    <h3 className="font-cyber font-bold text-xs sm:text-sm text-white tracking-wide truncate">
                      VERIFIED LEADERBOARD
                    </h3>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 self-stretch xs:self-auto justify-end">
                    {leaderboardFilter === 'friends' && (
                      <button
                        onClick={() => setFriendsModalOpen(true)}
                        className="px-2 py-0.5 rounded bg-clutch-violet/20 hover:bg-clutch-violet/30 border border-clutch-violet/40 text-[9px] font-mono text-clutch-lavender flex items-center gap-1 transition-colors shrink-0"
                        title="Manage Friends"
                      >
                        <Users className="w-3 h-3 text-clutch-lavender" />
                        <span className="hidden xs:inline">Friends</span>
                      </button>
                    )}
                    <div className="flex items-center gap-0.5 bg-clutch-surface-light p-0.5 rounded-lg border border-clutch-border text-[10px] sm:text-[11px] font-mono">
                      <button
                        onClick={() => setLeaderboardFilter('global')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          leaderboardFilter === 'global' ? 'bg-clutch-violet text-white font-bold' : 'text-clutch-muted hover:text-white'
                        }`}
                      >
                        Global
                      </button>
                      <button
                        onClick={() => setLeaderboardFilter('friends')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          leaderboardFilter === 'friends' ? 'bg-clutch-violet text-white font-bold' : 'text-clutch-muted hover:text-white'
                        }`}
                      >
                        Friends
                      </button>
                      <button
                        onClick={() => setLeaderboardFilter('tier')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          leaderboardFilter === 'tier' ? 'bg-clutch-violet text-white font-bold' : 'text-clutch-muted hover:text-white'
                        }`}
                      >
                        Tier
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leaderboard Records */}
                <div className="space-y-2">
                  {verifiedLeaderboard.length === 0 ? (
                    <div className="py-6 text-center text-clutch-muted font-mono text-xs space-y-2 bg-clutch-surface-light/40 rounded-xl border border-clutch-border/40 p-4">
                      <p className="text-white font-medium">No real-time combatants found for this filter.</p>
                      <p className="text-[10px] text-clutch-subtle">
                        {leaderboardFilter === 'friends'
                          ? 'Add fellow coders to view their stats and duel!'
                          : 'Play an arena match or solve solo quests to claim rank #1!'}
                      </p>
                      {leaderboardFilter === 'friends' && (
                        <button
                          onClick={() => setFriendsModalOpen(true)}
                          className="clutch-btn-primary px-3 py-1.5 text-xs mx-auto flex items-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Find Friends</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    verifiedLeaderboard.slice(0, 7).map((item) => (
                      <div
                        key={item.username}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                          item.isCurrent
                            ? 'bg-clutch-violet/15 border-clutch-violet/50 font-bold'
                            : 'bg-clutch-surface-light border-clutch-border text-clutch-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 text-center font-bold text-xs shrink-0 ${
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
                          <div className="flex flex-col min-w-0">
                            <span className={`truncate ${item.isCurrent ? 'text-white' : 'text-slate-200'}`}>
                              {item.username} {item.isCurrent && '(You)'}
                            </span>
                            <span className="text-[9.5px] text-clutch-subtle truncate">{item.tier}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right shrink-0">
                          <div>
                            <div className="text-white font-bold">{item.rating} MMR</div>
                            <div className="text-[9.5px] text-clutch-subtle">
                              {item.solved} solved
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-clutch-border text-[10px] font-mono text-clutch-subtle flex items-center justify-between">
                <span>Real-time rankings</span>
                <button
                  onClick={() => setScreen('profile')}
                  className="text-clutch-lavender hover:underline font-semibold"
                >
                  Your History &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================
          MODAL: PRIVATE ROOM HOST OR JOIN
          ========================================================= */}
      {showPrivateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md clutch-panel-elevated rounded-2xl p-5 sm:p-6 relative">
            <h3 className="font-cyber font-bold text-base sm:text-lg text-white mb-1.5">PRIVATE ARENA ROOM</h3>
            <p className="text-xs font-mono text-clutch-muted mb-4 sm:mb-6">
              Create a custom match for friends or enter an existing invite room code.
            </p>

            {/* Join by Code */}
            <form onSubmit={handleJoinPrivateRoom} className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1">
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
                    className="clutch-btn-primary px-4 py-2 text-xs shrink-0"
                  >
                    Join
                  </button>
                </div>
              </div>
            </form>

            <div className="h-px bg-clutch-border my-3 sm:my-4" />

            {/* Host Private Match */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowPrivateModal(false);
                  setFriendsModalOpen(true);
                }}
                className="w-full clutch-btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Play with Friends (Invite & Duel)</span>
              </button>

              <button
                onClick={handleCreatePrivateRoom}
                disabled={isJoiningRoom}
                className="w-full clutch-btn-secondary py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-clutch-lavender" />
                <span>Host Empty Room Code</span>
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

      {/* Friends & Matchmaking Modal */}
      <FriendsModal
        isOpen={friendsModalOpen}
        onClose={() => setFriendsModalOpen(false)}
      />
    </AppShell>
  );
};
