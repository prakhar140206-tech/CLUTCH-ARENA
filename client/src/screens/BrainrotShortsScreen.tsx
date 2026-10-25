import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Flame,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  HelpCircle,
  Share2
} from 'lucide-react';

interface BrainrotCard {
  id: string;
  topic: string;
  statement: string;
  codeSnippet?: string;
  isNoCap: boolean; // true = NO CAP (valid), false = CAP (invalid/myth)
  explanation: string;
  memeReactionWin: string;
  memeReactionFail: string;
}

const STATIC_CARDS: BrainrotCard[] = [
  {
    id: 'br-1',
    topic: 'Searching & Sorting',
    statement: 'Binary Search runs in O(log n) time even if the array is completely unsorted.',
    isNoCap: false,
    explanation: 'CAP! 🧢 Binary search strictly requires the array to be sorted first. If unsorted, you must do linear search O(n) or sort first O(n log n).',
    memeReactionWin: 'NO CAP DETECTED! W Rizz! 🗿',
    memeReactionFail: 'Skill issue... Binary search needs sorted input bro 💀'
  },
  {
    id: 'br-2',
    topic: 'Arrays & Two-Pointers',
    statement: 'Two-Pointer approach solves the Two-Sum problem in a sorted array with O(1) auxiliary space.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 Left and right pointers take O(1) extra memory and scan inward in O(n) time.',
    memeReactionWin: 'GIGACHAD O(1) SPACE! 👑',
    memeReactionFail: 'Bro forgot basic pointers... You are cooked 😭'
  },
  {
    id: 'br-3',
    topic: 'Graph Algorithms',
    statement: 'Dijkstra’s algorithm correctly handles graphs with negative edge weights.',
    isNoCap: false,
    explanation: 'CAP! 🧢 Dijkstra greedily marks nodes visited. Negative weights require Bellman-Ford or SPFA.',
    memeReactionWin: 'DIJKSTRA IS SMILING UPON YOU! ⚡',
    memeReactionFail: 'Negative weight trap caught you lacking! 💀'
  },
  {
    id: 'br-4',
    topic: 'Trees & Recursion',
    statement: 'Invert Binary Tree has O(n) time complexity where n is the total number of nodes.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 Every node is visited exactly once to swap its left and right pointers.',
    memeReactionWin: 'MAX AURA! GOOGLE RECRUITER IS CALLING 📞',
    memeReactionFail: 'Bro failed the Homebrew interview question 😭'
  },
  {
    id: 'br-5',
    topic: 'Hash Maps',
    statement: 'Hash map lookup is ALWAYS guaranteed to be strictly O(1) in the worst-case scenario.',
    isNoCap: false,
    explanation: 'CAP! 🧢 In the worst-case of catastrophic hash collisions, lookup degrades to O(n) linked list traversal.',
    memeReactionWin: 'BRO KNOWS HIS HASH COLLISIONS! 🧠',
    memeReactionFail: 'Collision disaster! Down bad 💀'
  },
  {
    id: 'br-6',
    topic: 'Dynamic Programming',
    statement: 'Memoization top-down DP and Tabulation bottom-up DP generally share the same asymptotic time complexity.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 Both visit all unique subproblems and transition in identical asymptotic time.',
    memeReactionWin: 'DP GOD CONFIRMED! 🧑‍🍳 LET HIM COOK',
    memeReactionFail: 'DP defeated you again... Bro is traumatized 💀'
  },
  {
    id: 'br-7',
    topic: 'Heaps & Priority Queues',
    statement: 'Building a binary heap from an array of n numbers using Floyd’s algorithm takes O(n) time, not O(n log n).',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 Sift-down heapify on all subtrees mathematically converges to O(n) via geometric series summation!',
    memeReactionWin: 'MATHEMATICAL GIGACHAD! 🗿',
    memeReactionFail: 'You thought it was O(n log n)... cooked by math 💀'
  },
  {
    id: 'br-8',
    topic: 'Linked Lists',
    statement: 'Floyd’s Cycle Finding (Tortoise and Hare) detects a cycle in a linked list in O(n) time and O(n) space.',
    isNoCap: false,
    explanation: 'CAP! 🧢 Tortoise and Hare uses O(1) constant auxiliary space, not O(n)! That is its signature superpower.',
    memeReactionWin: 'TORTOISE AND HARE MASTER! 🐢🐇',
    memeReactionFail: 'O(n) space? Why allocate a set when you have 2 pointers? 💀'
  },
  {
    id: 'br-9',
    topic: 'Graph Theory',
    statement: 'Topological Sort can be successfully performed on ANY directed graph, even if it contains cycles.',
    isNoCap: false,
    explanation: 'CAP! 🧢 Topological ordering is strictly only possible on Directed Acyclic Graphs (DAGs). Cycles create circular dependencies.',
    memeReactionWin: 'DAG GIGACHAD! NO CYCLES ALLOWED! 🚫🔄',
    memeReactionFail: 'Circular dependency trap caught you lacking 💀'
  },
  {
    id: 'br-10',
    topic: 'Bit Manipulation',
    statement: 'The expression (n & (n - 1)) clears the lowest set bit in an integer in O(1) time.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 Brian Kernighan’s algorithm flips all bits starting from the least significant set bit in a single CPU cycle.',
    memeReactionWin: 'BITWISE GODMODE ACTIVATED! ⚡💾',
    memeReactionFail: 'Bro tried to loop through 32 bits manually 😭'
  },
  {
    id: 'br-11',
    topic: 'System Design & DS',
    statement: 'Implementing an LRU Cache with strict O(1) get() and put() requires combining a Hash Map with a Doubly Linked List.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 Hash map gives O(1) node lookup by key, and Doubly Linked List gives O(1) node removal and re-insertion at head.',
    memeReactionWin: 'META SYSTEM DESIGN PRO! 🚀',
    memeReactionFail: 'You used an array for LRU? Bro is completely cooked 💀'
  },
  {
    id: 'br-12',
    topic: 'Sorting Invariants',
    statement: 'QuickSort has a guaranteed worst-case time complexity of O(n log n).',
    isNoCap: false,
    explanation: 'CAP! 🧢 QuickSort worst-case is O(n²) when the pivot chosen is consistently the extreme min or max element.',
    memeReactionWin: 'PIVOT MASTER! NO QUADRATIC TRAPS! 🗿',
    memeReactionFail: 'O(n²) worst-case humbled you... Down bad 💀'
  },
  {
    id: 'br-13',
    topic: 'Prefix Trees (Trie)',
    statement: 'Searching for a prefix of length L in a Trie takes O(L) time, completely independent of how many millions of words are stored.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 Trie tree traversal only walks L character edges down from root. Massive vocabulary does not slow it down!',
    memeReactionWin: 'AUTOCOMPLETE WIZARD! 🧙‍♂️',
    memeReactionFail: 'Trie bounds tricked you... Skill issue 💀'
  },
  {
    id: 'br-14',
    topic: 'Graph BFS',
    statement: 'Breadth-First Search (BFS) on an unweighted graph is guaranteed to find the shortest path from start to target.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 BFS explores nodes level by level in non-decreasing distance order. First visit equals minimum edges!',
    memeReactionWin: 'SHORTEST PATH CERTIFIED! 🗺️',
    memeReactionFail: 'Bro used DFS and got lost in an infinite branch 💀'
  },
  {
    id: 'br-15',
    topic: 'Amortized Complexity',
    statement: 'Appending elements to a dynamic array (like std::vector or Python list) takes O(n) amortized time.',
    isNoCap: false,
    explanation: 'CAP! 🧢 While resizing an array takes O(n), geometric array doubling ensures the AMORTIZED time per append is strictly O(1)!',
    memeReactionWin: 'AMORTIZED ANALYSIS GIGACHAD! 📈',
    memeReactionFail: 'You confused worst-case resize with amortized cost 💀'
  },
  {
    id: 'br-16',
    topic: 'Sliding Window',
    statement: 'The classic variable-size Sliding Window technique works seamlessly on arrays with negative numbers.',
    isNoCap: false,
    explanation: 'CAP! 🧢 Negative numbers break monotonic expansion/shrinkage invariants. You must use prefix sums with a hash map instead!',
    memeReactionWin: 'PREFIX SUM SAVANT! 🧠',
    memeReactionFail: 'Negative numbers broke your window... Emotional damage 💀'
  }
];


export const BrainrotShortsScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [cards, setCards] = useState<BrainrotCard[]>(STATIC_CARDS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [auraScore, setAuraScore] = useState<number>(userProfile.auraPoints || 45000);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(userProfile.stats?.highestStreak || 0);
  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'wrong' | null;
    text: string;
    explanation: string;
  }>({ status: null, text: '', explanation: '' });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const currentCard = cards[currentIndex % cards.length];


  const handleDecision = (userClaimedNoCap: boolean) => {
    if (feedback.status !== null) return; // Prevent double taps during transition

    const isCorrect = userClaimedNoCap === currentCard.isNoCap;
    setSwipeDirection(userClaimedNoCap ? 'right' : 'left');

    if (isCorrect) {
      soundSynth.auraGlow();
      const newStreak = streak + 1;
      const auraDelta = 1000 + newStreak * 250;
      const nextAura = auraScore + auraDelta;

      setAuraScore(nextAura);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      updateUserProfile({
        auraPoints: nextAura,
        stats: {
          ...userProfile.stats,
          challengesSolved: (userProfile.stats?.challengesSolved || 0) + 1,
          highestStreak: Math.max(userProfile.stats?.highestStreak || 0, newStreak)
        }
      });

      // Confetti celebration
      if (newStreak % 3 === 0) {
        soundSynth.airhorn();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setFeedback({
        status: 'correct',
        text: currentCard.memeReactionWin,
        explanation: currentCard.explanation
      });

      soundSynth.speakHype(currentCard.memeReactionWin.split('!')[0], 'hype');
    } else {
      soundSynth.vineBoom();
      const nextAura = Math.max(0, auraScore - 1500);
      setAuraScore(nextAura);
      setStreak(0);

      updateUserProfile({ auraPoints: nextAura });

      setFeedback({
        status: 'wrong',
        text: currentCard.memeReactionFail,
        explanation: currentCard.explanation
      });

      soundSynth.speakHype('Skill issue! Bro is cooked!', 'roast');
    }

    // Auto advance card after 2.2 seconds
    setTimeout(() => {
      setFeedback({ status: null, text: '', explanation: '' });
      setSwipeDirection(null);
      setCurrentIndex((prev) => prev + 1);
    }, 2200);
  };

  // Keyboard navigation: Left Arrow = CAP 🧢, Right Arrow = NO CAP 🔥
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        handleDecision(false);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        handleDecision(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, feedback.status]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-hidden select-none relative">
      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-slate-950/80 border-b border-violet-500/30 z-20">
        <button
          onClick={() => setScreen('lobby')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-cyber text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>LOBBY</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-cyber font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-cyan-400">
            DSA BRAINROT SHORTS 📱
          </span>
        </div>

        {/* Aura & Streak Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-cyber font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{auraScore.toLocaleString()} AURA</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-cyber font-bold">
            <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span>STREAK: {streak}</span>
          </div>
        </div>
      </div>

      {/* Main TikTok Reel Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        {/* TikTok Style Vertical Card (9:16 Aspect ratio container) */}
        <div
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            if (deltaX > 60) {
              handleDecision(true); // Swiped right -> NO CAP
            } else if (deltaX < -60) {
              handleDecision(false); // Swiped left -> CAP
            }
            setTouchStartX(null);
          }}
          className={`relative w-full max-w-sm sm:max-w-md h-[560px] rounded-3xl bg-slate-900/90 border-2 transition-all duration-300 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-2xl ${
            swipeDirection === 'right'
              ? 'translate-x-8 rotate-3 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
              : swipeDirection === 'left'
              ? '-translate-x-8 -rotate-3 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]'
              : 'border-violet-500/40 hover:border-cyan-400/50'
          }`}
        >

          {/* Reel Header Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-violet-900/60 border border-violet-500/40 text-violet-300 text-[10px] font-cyber font-bold tracking-wider">
                #{currentCard.topic.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Card {currentIndex + 1}
              </span>
            </div>

            <div className="text-[11px] font-cyber text-cyan-400 tracking-wider mb-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>VIBE CHECK: TRUTH OR CAP?</span>
            </div>

            {/* Algorithmic Statement */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 font-sans font-medium text-base sm:text-lg leading-relaxed shadow-inner">
              "{currentCard.statement}"
            </div>
          </div>

          {/* Feedback Overlay on Decision */}
          {feedback.status && (
            <div
              className={`p-4 rounded-2xl border text-center animate-fade-in ${
                feedback.status === 'correct'
                  ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
              }`}
            >
              <div className="font-cyber font-black text-lg tracking-wider mb-1 flex items-center justify-center gap-2">
                {feedback.status === 'correct' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                <span>{feedback.text}</span>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-normal">
                {feedback.explanation}
              </p>
            </div>
          )}

          {/* Bottom Swipe / Tap Actions: CAP vs NO CAP */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {/* CAP Button (Left) */}
              <button
                onClick={() => handleDecision(false)}
                disabled={feedback.status !== null}
                className="py-4 px-3 rounded-2xl bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 active:scale-95 border-2 border-rose-400/50 text-white font-cyber font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1 shadow-lg transition-all disabled:opacity-50"
              >
                <span className="text-2xl">🧢</span>
                <span>CAP (FALSE)</span>
                <span className="text-[9px] font-mono text-rose-200">Press Left [← / A]</span>
              </button>

              {/* NO CAP Button (Right) */}
              <button
                onClick={() => handleDecision(true)}
                disabled={feedback.status !== null}
                className="py-4 px-3 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 active:scale-95 border-2 border-emerald-400/50 text-white font-cyber font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1 shadow-lg transition-all disabled:opacity-50"
              >
                <span className="text-2xl">🔥</span>
                <span>NO CAP (TRUE)</span>
                <span className="text-[9px] font-mono text-emerald-200">Press Right [→ / D]</span>
              </button>
            </div>

            <div className="text-center text-[10px] font-mono text-slate-500">
              💡 Swipe or click to answer instantly! +1,000 Aura for speed streaks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
