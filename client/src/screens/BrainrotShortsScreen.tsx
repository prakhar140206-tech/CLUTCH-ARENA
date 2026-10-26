import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import confetti from 'canvas-confetti';
import {
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
  ChevronDown,
  ChevronUp,
  Share2,
  Clock,
  Terminal,
  Smartphone
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
    topic: 'Trees & Heaps',
    statement: 'In a Min-Heap, the root element is always guaranteed to be the minimum element in O(1) time.',
    isNoCap: true,
    explanation: 'NO CAP! 🔥 The heap-order property ensures the root is always the global minimum element.',
    memeReactionWin: 'HEAP MASTER SUPREME! 👑',
    memeReactionFail: 'Heap property misunderstood! 💀'
  },
  {
    id: 'br-5',
    topic: 'Complexity Analysis',
    statement: 'Accessing an element by index in a singly linked list takes O(1) time.',
    isNoCap: false,
    explanation: 'CAP! 🧢 Linked lists do not support random access. You must traverse from the head node in O(n) time.',
    memeReactionWin: 'LINKED LIST INTUITION ON POINT! ⚡',
    memeReactionFail: 'Arrays have O(1) access, not linked lists! 💀'
  }
];

export const BrainrotShortsScreen: React.FC = () => {
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answeredState, setAnsweredState] = useState<'correct' | 'incorrect' | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(14);

  const currentCard = STATIC_CARDS[currentIndex % STATIC_CARDS.length];

  // 14-second countdown per card
  useEffect(() => {
    if (answeredState) return;
    setTimeLeft(14);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, answeredState]);

  const handleAnswer = (choice: boolean | null) => {
    if (answeredState) return;

    if (choice === currentCard.isNoCap) {
      soundSynth.airhorn();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setAnsweredState('correct');
      const currentHighest = userProfile.stats?.highestStreak || 0;
      updateUserProfile({
        auraPoints: (userProfile.auraPoints || 0) + 1000 + nextStreak * 150,
        stats: {
          ...userProfile.stats,
          highestStreak: Math.max(currentHighest, nextStreak)
        }
      });
    } else {
      soundSynth.vineBoom();
      setStreak(0);
      setAnsweredState('incorrect');
    }
  };

  const handleNextCard = () => {
    setAnsweredState(null);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <AppShell activeScreen="brainrot_shorts">
      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col items-center font-sans h-full justify-center">
        {/* Top Header Card */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-clutch-lavender" />
            <h1 className="font-cyber font-bold text-sm sm:text-base text-white">DSA BLITZ SHORTS</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-clutch-amber/20 border border-clutch-amber/30 text-clutch-amber text-xs font-mono font-bold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak}x Streak</span>
            </div>

            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
              timeLeft <= 4 ? 'bg-clutch-rose/20 border-clutch-rose text-clutch-rose animate-pulse' : 'bg-clutch-surface-light border-clutch-border text-clutch-lavender'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Central Reel Card */}
        <div className="w-full clutch-panel-elevated rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative min-h-[440px]">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-clutch-lavender mb-3">
              <span className="px-2 py-0.5 rounded bg-clutch-violet/20 border border-clutch-violet/30 font-bold uppercase">
                {currentCard.topic}
              </span>
              <span className="text-clutch-subtle">CARD #{currentIndex + 1}</span>
            </div>

            <div className="text-white text-base sm:text-lg font-bold leading-relaxed mb-6">
              "{currentCard.statement}"
            </div>

            {currentCard.codeSnippet && (
              <div className="mb-6 bg-clutch-bg p-3.5 rounded-xl border border-clutch-border font-mono text-xs text-clutch-lavender">
                <pre>{currentCard.codeSnippet}</pre>
              </div>
            )}
          </div>

          {/* Feedback Overlay if answered */}
          {answeredState ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs font-mono ${
                answeredState === 'correct'
                  ? 'bg-clutch-emerald/15 border-clutch-emerald/40 text-emerald-200'
                  : 'bg-clutch-rose/15 border-clutch-rose/40 text-rose-200'
              }`}>
                <div className="font-cyber font-bold text-sm mb-1">
                  {answeredState === 'correct' ? currentCard.memeReactionWin : currentCard.memeReactionFail}
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{currentCard.explanation}</p>
              </div>

              <button
                onClick={handleNextCard}
                className="w-full clutch-btn-primary py-3 text-xs flex items-center justify-center gap-2"
              >
                <span>Next Short</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* CAP or NO CAP Action Buttons */
            <div className="grid grid-cols-2 gap-3.5 mt-6">
              <button
                onClick={() => handleAnswer(false)}
                className="py-4 rounded-xl bg-clutch-surface-light border border-clutch-border hover:border-clutch-rose hover:bg-clutch-rose/10 text-white font-cyber font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span className="text-2xl">🧢</span>
                <span className="tracking-wider">CAP (False)</span>
              </button>

              <button
                onClick={() => handleAnswer(true)}
                className="py-4 rounded-xl bg-clutch-surface-light border border-clutch-border hover:border-clutch-emerald hover:bg-clutch-emerald/10 text-white font-cyber font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span className="text-2xl">🔥</span>
                <span className="tracking-wider">NO CAP (True)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
