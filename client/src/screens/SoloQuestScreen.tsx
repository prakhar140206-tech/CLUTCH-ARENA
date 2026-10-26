import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { ClientChallenge, Difficulty } from '../../../shared/types.js';
import { API_BASE_URL } from '../config/api';
import { CodeSprintEditor } from '../components/challenges/CodeSprintEditor.js';
import { VisualPuzzleWorkspace } from '../components/challenges/VisualPuzzleWorkspace.js';
import { McqChallengeWorkspace } from '../components/challenges/McqChallengeWorkspace.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { soundSynth } from '../services/soundSynth.js';
import confetti from 'canvas-confetti';
import {
  Compass,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Award,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Filter
} from 'lucide-react';

export const SoloQuestScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const soloSolvedIds = useGameStore((s) => s.soloSolvedIds);
  const markSoloSolved = useGameStore((s) => s.markSoloSolved);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [selectedChallenge, setSelectedChallenge] = useState<ClientChallenge | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; explanation?: string } | null>(null);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Dynamic Level & Adaptive Scaling State
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<Difficulty>('beginner');
  const [streak, setStreak] = useState<number>(0);
  
  // Timer State: Starts at Max 10 minutes (600s) for Level 1, decreasing down to Min 6 minutes (360s)
  const baseTime = Math.max(360, 600 - (currentLevel - 1) * 60);
  const [timeLeft, setTimeLeft] = useState<number>(baseTime);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to dynamically generate a brand new unique question from AI or static bank
  const fetchNextAIChallenge = async (diff: Difficulty, duration: number, topicChoice?: string) => {
    setIsGeneratingAI(true);
    setFeedback(null);
    setHintUsed(false);

    try {
      const topics = ['arrays_and_strings', 'trees_and_bst', 'graphs', 'complexity_analysis', 'dynamic_programming'];
      const chosen = topicChoice && topicChoice !== 'all' ? topicChoice : topics[Math.floor(Math.random() * topics.length)];

      const res = await fetch(`${API_BASE_URL}/api/generate-ai-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: chosen,
          difficulty: diff,
          timeLimitSeconds: duration
        })
      });
      const data = await res.json();
      if (data.challenge) {
        setSelectedChallenge(data.challenge);
        setTimeLeft(duration);
      }
    } catch (err) {
      console.error('Failed to generate AI challenge:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    fetchNextAIChallenge('beginner', 600, selectedTopic);
  }, []);

  // Timer Tick Interval
  useEffect(() => {
    if (!isTimerActive || !selectedChallenge) return;

    startTimeRef.current = Date.now();
    setTimeLeft(baseTime);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedChallenge?.id, currentLevel, isTimerActive]);

  const handleTimeExpired = () => {
    setStreak(0);
    soundSynth.vineBoom();
    setFeedback({
      isCorrect: false,
      message: '⏰ Time Expired! The clock reached 0. Take a moment to review the explanation and try again.'
    });
  };

  const handleSubmission = async (answer: any, language?: any) => {
    if (!selectedChallenge) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          answer
        })
      });
      const data = await res.json();

      if (data.isCorrect) {
        soundSynth.levelUp();
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        markSoloSolved(selectedChallenge.id);

        const nextStreak = streak + 1;
        setStreak(nextStreak);
        const reward = 1200 + nextStreak * 250;
        updateUserProfile({
          auraPoints: (userProfile.auraPoints || 48500) + reward,
          stats: {
            ...userProfile.stats,
            challengesSolved: (userProfile.stats?.challengesSolved || 38) + 1,
            highestStreak: Math.max(userProfile.stats?.highestStreak || 0, nextStreak)
          }
        });

        setFeedback({
          isCorrect: true,
          message: `Correct! +${reward.toLocaleString()} Aura Awarded. Streak: ${nextStreak}x!`,
          explanation: data.explanation || selectedChallenge.explanation
        });
      } else {
        soundSynth.vineBoom();
        setStreak(0);
        setFeedback({
          isCorrect: false,
          message: 'Incorrect answer. Review the problem statement carefully and retry.',
          explanation: data.explanation || selectedChallenge.explanation
        });
      }
    } catch (err) {
      console.error('Error verifying answer:', err);
    }
  };

  const handleNextChallenge = () => {
    const nextLvl = currentLevel + 1;
    setCurrentLevel(nextLvl);
    const diffs: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const nextDiff = diffs[Math.min(diffs.length - 1, Math.floor(nextLvl / 2))];
    setAdaptiveDifficulty(nextDiff);
    const nextDuration = Math.max(360, 600 - (nextLvl - 1) * 60);
    fetchNextAIChallenge(nextDiff, nextDuration, selectedTopic);
  };

  return (
    <AppShell activeScreen="solo_quest">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Top Control Bar */}
        <div className="clutch-panel rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cyber font-bold text-lg text-white">SOLO QUEST ODYSSEY</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 font-bold uppercase">
                  LEVEL {currentLevel} • {adaptiveDifficulty}
                </span>
              </div>
              <p className="text-xs font-mono text-clutch-muted">
                Adaptive practice with authoritative sandbox verification
              </p>
            </div>
          </div>

          {/* Right Metrics: Timer & Streak */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-clutch-surface-light border border-clutch-border text-xs font-mono font-bold text-clutch-amber">
              <Zap className="w-3.5 h-3.5" />
              <span>{streak}x Streak</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs border ${
              timeLeft <= 60 && timeLeft > 0
                ? 'bg-clutch-rose/20 border-clutch-rose text-clutch-rose animate-pulse'
                : 'bg-clutch-surface-elevated border-clutch-violet/40 text-clutch-lavender'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Topic Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'arrays_and_strings', label: 'Arrays & Strings' },
            { id: 'trees_and_bst', label: 'Trees & BST' },
            { id: 'graphs', label: 'Graphs' },
            { id: 'dynamic_programming', label: 'Dynamic Programming' },
            { id: 'complexity_analysis', label: 'Complexity' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTopic(t.id);
                fetchNextAIChallenge(adaptiveDifficulty, baseTime, t.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                selectedTopic === t.id
                  ? 'bg-clutch-violet text-white font-bold shadow-md'
                  : 'bg-clutch-surface-light border border-clutch-border text-clutch-muted hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Main Workspace Area */}
        <div className="min-h-[500px] flex flex-col">
          {isGeneratingAI ? (
            <div className="flex-1 clutch-panel rounded-2xl flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-4 animate-spin">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-cyber font-bold text-base text-white mb-1">
                GENERATING ADAPTIVE CHALLENGE
              </h3>
              <p className="text-xs font-mono text-clutch-muted">
                Synthesizing algorithmic test cases for Level {currentLevel}...
              </p>
            </div>
          ) : selectedChallenge ? (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 min-h-[460px]">
                {selectedChallenge.type === 'code_sprint' || selectedChallenge.type === 'bug_hunter' ? (
                  <CodeSprintEditor
                    challenge={selectedChallenge}
                    onSubmit={handleSubmission}
                    disabled={feedback?.isCorrect === true}
                  />
                ) : selectedChallenge.type === 'visual_puzzle' ? (
                  <VisualPuzzleWorkspace
                    challenge={selectedChallenge}
                    onSolve={handleSubmission}
                    disabled={feedback?.isCorrect === true}
                  />
                ) : (
                  <McqChallengeWorkspace
                    challenge={selectedChallenge}
                    onSubmit={handleSubmission}
                    disabled={feedback?.isCorrect === true}
                  />
                )}
              </div>

              {/* Feedback and Next Level Banner */}
              {feedback && (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs ${
                  feedback.isCorrect
                    ? 'bg-clutch-emerald/15 border-clutch-emerald/40 text-emerald-200'
                    : 'bg-clutch-rose/15 border-clutch-rose/40 text-rose-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {feedback.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-clutch-emerald shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-clutch-rose shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white mb-0.5">{feedback.message}</div>
                      {feedback.explanation && (
                        <div className="text-[11px] opacity-85">{feedback.explanation}</div>
                      )}
                    </div>
                  </div>

                  {feedback.isCorrect ? (
                    <button
                      onClick={handleNextChallenge}
                      className="clutch-btn-primary px-5 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center"
                    >
                      <span>Next Level ({currentLevel + 1})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => fetchNextAIChallenge(adaptiveDifficulty, baseTime, selectedTopic)}
                      className="clutch-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Question</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 clutch-panel rounded-2xl flex flex-col items-center justify-center p-8 text-center text-clutch-muted">
              No challenge selected. Choose a topic above to begin.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
