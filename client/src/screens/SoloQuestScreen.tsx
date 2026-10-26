import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { 
  ClientChallenge, 
  Difficulty, 
  MatchDurationMinutes, 
  PerQuestionSeconds,
  DSATopic,
  ConceptMasteryRecord 
} from '../../../shared/types.js';
import { API_BASE_URL } from '../config/api.js';
import { CLIENT_FALLBACK_CHALLENGES } from '../data/defaultChallenges.js';
import { CodeSprintEditor } from '../components/challenges/CodeSprintEditor.js';
import { VisualPuzzleWorkspace } from '../components/challenges/VisualPuzzleWorkspace.js';
import { McqChallengeWorkspace } from '../components/challenges/McqChallengeWorkspace.js';
import { InteractiveArrayWorkspace } from '../components/challenges/InteractiveArrayWorkspace.js';
import { MatchingWorkspace } from '../components/challenges/MatchingWorkspace.js';
import { ArrangeStepsWorkspace } from '../components/challenges/ArrangeStepsWorkspace.js';
import { FillBlankWorkspace } from '../components/challenges/FillBlankWorkspace.js';
import { PseudocodeWorkspace } from '../components/challenges/PseudocodeWorkspace.js';
import { HypeReactionStream } from '../components/arena/HypeReactionStream.js';
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
  Filter,
  BrainCircuit,
  BookOpen,
  Timer
} from 'lucide-react';

export const SoloQuestScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const markSoloSolved = useGameStore((s) => s.markSoloSolved);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  // Match configuration & state
  const [matchDuration, setMatchDuration] = useState<MatchDurationMinutes>(10);
  const [questionTimerSecs, setQuestionTimerSecs] = useState<PerQuestionSeconds>(20);
  const [matchStarted, setMatchStarted] = useState<boolean>(false);
  const [matchEnded, setMatchEnded] = useState<boolean>(false);

  // Timers
  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(600);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(20);

  // Challenge & Progression State
  const [challenges, setChallenges] = useState<ClientChallenge[]>(CLIENT_FALLBACK_CHALLENGES);
  const [currentChallenge, setCurrentChallenge] = useState<ClientChallenge | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [streak, setStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);

  // Remediation
  const [activeRemediation, setActiveRemediation] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; explanation?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Final Session Statistics
  const [stats, setStats] = useState<{
    attempted: number;
    solved: number;
    totalTimeMs: number;
    topicResults: Record<string, { attempted: number; solved: number }>;
  }>({
    attempted: 0,
    solved: 0,
    totalTimeMs: 0,
    topicResults: {}
  });

  const questionStartTimeRef = useRef<number>(Date.now());

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch initial challenge bank (with client fallback)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/challenges`)
      .then(res => res.json())
      .then(data => {
        if (data.challenges && data.challenges.length > 0) {
          setChallenges(data.challenges);
        }
      })
      .catch(() => {
        // Retain CLIENT_FALLBACK_CHALLENGES if offline or static deployment
        setChallenges(CLIENT_FALLBACK_CHALLENGES);
      });
  }, []);

  // Match countdown & per-question timer tick
  useEffect(() => {
    if (!matchStarted || matchEnded) return;

    const interval = setInterval(() => {
      setMatchTimeLeft(prev => {
        if (prev <= 1) {
          setMatchEnded(true);
          return 0;
        }
        return prev - 1;
      });

      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          handleQuestionTimeout();
          return questionTimerSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStarted, matchEnded, currentChallenge?.id]);

  const selectNextQuestion = (nextDiff: Difficulty = difficulty, topicFilter: string = selectedTopic) => {
    setFeedback(null);
    questionStartTimeRef.current = Date.now();
    setQuestionTimeLeft(questionTimerSecs);

    let pool = challenges.filter(c => {
      if (topicFilter !== 'all' && c.topic !== topicFilter) return false;
      return true;
    });

    if (pool.length === 0) pool = challenges;

    // Try finding challenge with matching difficulty
    let nextQ = pool.find(c => c.difficulty === nextDiff && c.id !== currentChallenge?.id);
    if (!nextQ) {
      nextQ = pool[Math.floor(Math.random() * pool.length)];
    }

    if (nextQ) {
      setCurrentChallenge(nextQ);
      setQuestionIndex(prev => prev + 1);
    }
  };

  const startSoloMatch = () => {
    setMatchTimeLeft(matchDuration * 60);
    setQuestionTimeLeft(questionTimerSecs);
    setScore(0);
    setStreak(0);
    setConsecutiveErrors(0);
    setDifficulty('easy');
    setMatchStarted(true);
    setMatchEnded(false);
    setActiveRemediation(null);
    setStats({
      attempted: 0,
      solved: 0,
      totalTimeMs: 0,
      topicResults: {}
    });

    selectNextQuestion('easy', selectedTopic);
  };

  const handleQuestionTimeout = () => {
    soundSynth.vineBoom();
    setStreak(0);
    const nextErrors = consecutiveErrors + 1;
    setConsecutiveErrors(nextErrors);

    setStats(prev => ({
      ...prev,
      attempted: prev.attempted + 1
    }));

    setFeedback({
      isCorrect: false,
      message: '⏰ Time Expired! Moving to next question.'
    });

    setTimeout(() => {
      selectNextQuestion(difficulty, selectedTopic);
    }, 1500);
  };

  const handleSubmission = async (answer: any, language?: any) => {
    if (!currentChallenge || isSubmitting || matchEnded) return;
    setIsSubmitting(true);
    const elapsedMs = Math.max(300, Date.now() - questionStartTimeRef.current);

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: currentChallenge.id,
          answer,
          timeTakenMs: elapsedMs,
          userId: userProfile.id
        })
      });
      const data = await res.json();

      setStats(prev => {
        const topicStats = prev.topicResults[currentChallenge.topic] || { attempted: 0, solved: 0 };
        return {
          ...prev,
          attempted: prev.attempted + 1,
          solved: data.isCorrect ? prev.solved + 1 : prev.solved,
          totalTimeMs: prev.totalTimeMs + elapsedMs,
          topicResults: {
            ...prev.topicResults,
            [currentChallenge.topic]: {
              attempted: topicStats.attempted + 1,
              solved: data.isCorrect ? topicStats.solved + 1 : topicStats.solved
            }
          }
        };
      });

      if (data.isCorrect) {
        soundSynth.levelUp();
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        markSoloSolved(currentChallenge.id);

        const newStreak = streak + 1;
        setStreak(newStreak);
        setConsecutiveErrors(0);
        setActiveRemediation(null);

        const points = data.pointsAwarded || 100;
        setScore(prev => prev + points);

        // Adaptive Difficulty Promotion (3 consecutive correct answers -> next tier)
        let nextDiff = difficulty;
        const tiers: Difficulty[] = ['easy', 'medium', 'hard', 'advanced', 'extreme_hard'];
        const currentIdx = tiers.indexOf(difficulty);
        if (newStreak >= 3 && currentIdx < tiers.length - 1) {
          nextDiff = tiers[currentIdx + 1];
          setDifficulty(nextDiff);
        }

        setFeedback({
          isCorrect: true,
          message: `Correct! +${points} pts (Speed +${data.speedBonus || 0})`,
          explanation: data.explanation || currentChallenge.explanation
        });

        setTimeout(() => {
          selectNextQuestion(nextDiff, selectedTopic);
        }, 1500);
      } else {
        soundSynth.vineBoom();
        setStreak(0);
        const nextErrors = consecutiveErrors + 1;
        setConsecutiveErrors(nextErrors);

        // If repeated errors, trigger guided remediation
        if (data.remediation) {
          setActiveRemediation(data.remediation);
        }

        setFeedback({
          isCorrect: false,
          message: 'Incorrect answer. Review explanation or guided concept below.',
          explanation: data.explanation || currentChallenge.explanation
        });

        // Demote tier if 3 consecutive failures
        const tiers: Difficulty[] = ['easy', 'medium', 'hard', 'advanced', 'extreme_hard'];
        const currentIdx = tiers.indexOf(difficulty);
        let nextDiff = difficulty;
        if (nextErrors >= 3 && currentIdx > 0) {
          nextDiff = tiers[currentIdx - 1];
          setDifficulty(nextDiff);
        }

        setTimeout(() => {
          if (!data.remediation) {
            selectNextQuestion(nextDiff, selectedTopic);
          }
        }, 2000);
      }
    } catch (err) {
      // Offline / Static Deployment Evaluation Fallback
      const cleanAnswer = typeof answer === 'string' ? answer.trim() : JSON.stringify(answer);
      const cleanExpected = typeof currentChallenge.correctAnswer === 'string'
        ? currentChallenge.correctAnswer.trim()
        : JSON.stringify(currentChallenge.correctAnswer);
      const isCorrect = cleanAnswer.toLowerCase() === cleanExpected.toLowerCase();

      setStats(prev => {
        const topicStats = prev.topicResults[currentChallenge.topic] || { attempted: 0, solved: 0 };
        return {
          ...prev,
          attempted: prev.attempted + 1,
          solved: isCorrect ? prev.solved + 1 : prev.solved,
          totalTimeMs: prev.totalTimeMs + elapsedMs,
          topicResults: {
            ...prev.topicResults,
            [currentChallenge.topic]: {
              attempted: topicStats.attempted + 1,
              solved: isCorrect ? topicStats.solved + 1 : topicStats.solved
            }
          }
        };
      });

      if (isCorrect) {
        soundSynth.levelUp();
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        markSoloSolved(currentChallenge.id);
        const newStreak = streak + 1;
        setStreak(newStreak);
        setConsecutiveErrors(0);
        setScore(prev => prev + 100);

        setFeedback({
          isCorrect: true,
          message: 'Correct! +100 pts (Practice Mode)',
          explanation: currentChallenge.explanation
        });

        setTimeout(() => {
          selectNextQuestion(difficulty, selectedTopic);
        }, 1500);
      } else {
        soundSynth.vineBoom();
        setStreak(0);
        setConsecutiveErrors(prev => prev + 1);

        setFeedback({
          isCorrect: false,
          message: 'Incorrect answer. Review explanation below.',
          explanation: currentChallenge.explanation
        });

        setTimeout(() => {
          selectNextQuestion(difficulty, selectedTopic);
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell activeScreen="solo_quest">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 font-sans">
        
        {/* Match Header Controls */}
        <div className="p-5 rounded-2xl bg-[#0e1626] border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cyber font-bold text-lg text-white">SOLO QUEST ODYSSEY</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                  {difficulty.replace('_', ' ')}
                </span>
                {streak >= 2 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-950 text-yellow-300 border border-yellow-500/40 font-bold uppercase">
                    {streak}x STREAK
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-gray-400">
                Endless time-based adaptive practice with server-authoritative scoring
              </p>
            </div>
          </div>

          {/* Right: Dual Clocks & Score */}
          {matchStarted && !matchEnded && (
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono">
                <span className="text-gray-400">Score: </span>
                <span className="font-bold text-yellow-400">{score}</span>
              </div>

              {/* Overall Match Clock */}
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono text-cyan-300">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span>{formatTime(matchTimeLeft)}</span>
              </div>

              {/* Per-Question Countdown */}
              <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                questionTimeLeft <= 5 
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-bounce' 
                  : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{questionTimeLeft}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Staging / Pre-Match Selector Screen */}
        {!matchStarted && !matchEnded && (
          <div className="p-8 rounded-2xl bg-gray-900/80 border border-cyan-500/30 flex flex-col items-center text-center space-y-6">
            <div className="max-w-md space-y-2">
              <h2 className="text-2xl font-cyber font-bold text-white">CHOOSE YOUR PRACTICE DURATION</h2>
              <p className="text-xs text-gray-400">
                Questions will continuously adapt to your accuracy across all 13 core DSA disciplines until the clock expires.
              </p>
            </div>

            {/* Universal Duration Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
              {([10, 15, 25, 30] as MatchDurationMinutes[]).map(mins => {
                const isSelected = matchDuration === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => setMatchDuration(mins)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-lg shadow-cyan-500/20'
                        : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <p className="font-cyber font-bold text-lg">{mins}</p>
                    <p className="text-[10px] font-mono text-gray-400">MINUTES</p>
                  </button>
                );
              })}
            </div>

            {/* Per-Question Timer Setting */}
            <div className="flex items-center space-x-3 bg-gray-950/60 p-2 rounded-xl border border-gray-800">
              <span className="text-xs font-mono text-gray-400">Question Speed:</span>
              <button
                onClick={() => setQuestionTimerSecs(20)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                  questionTimerSecs === 20 ? 'bg-purple-900/80 text-white font-bold' : 'text-gray-400'
                }`}
              >
                20s (Default)
              </button>
              <button
                onClick={() => setQuestionTimerSecs(15)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                  questionTimerSecs === 15 ? 'bg-purple-900/80 text-white font-bold' : 'text-gray-400'
                }`}
              >
                15s (Blitz)
              </button>
            </div>

            <button
              onClick={startSoloMatch}
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm rounded-xl transition shadow-xl shadow-cyan-500/30 flex items-center gap-2"
            >
              <span>Begin Endless Quest</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Gameplay Workspace */}
        {matchStarted && !matchEnded && currentChallenge && (
          <div className="flex flex-col gap-4">
            {/* Topic Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'All Topics' },
                { id: 'arrays_and_strings', label: 'Arrays & Strings' },
                { id: 'searching_and_sorting', label: 'Searching & Sorting' },
                { id: 'trees_and_bst', label: 'Trees & BST' },
                { id: 'graphs', label: 'Graphs' },
                { id: 'dynamic_programming', label: 'Dynamic Programming' },
                { id: 'complexity_analysis', label: 'Complexity' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTopic(t.id);
                    selectNextQuestion(difficulty, t.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                    selectedTopic === t.id
                      ? 'bg-cyan-500 text-black font-bold shadow-md'
                      : 'bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Guided Remediation Card if user struggled */}
            {activeRemediation && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 text-xs space-y-2 animate-fade-in shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Guided Concept Remediation
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono">Topic: {activeRemediation.conceptTitle}</span>
                </div>
                <p className="text-gray-200">{activeRemediation.explanation}</p>
                <div className="p-2.5 rounded bg-black/40 border border-purple-900/40 font-mono text-[11px] text-purple-200">
                  <strong className="text-purple-300">Worked Example: </strong>
                  {activeRemediation.workedExample}
                </div>
                <button
                  onClick={() => selectNextQuestion(difficulty, selectedTopic)}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                >
                  Try Guided Reassessment Question →
                </button>
              </div>
            )}

            {/* Dynamic Question Workspace by Format */}
            <div className="min-h-[500px]">
              {currentChallenge.type === 'code_sprint' || currentChallenge.type === 'bug_hunter' ? (
                <CodeSprintEditor
                  challenge={currentChallenge}
                  onSubmit={handleSubmission}
                  disabled={isSubmitting}
                />
              ) : currentChallenge.type === 'interactive_array' ? (
                <InteractiveArrayWorkspace
                  challenge={currentChallenge}
                  onSubmit={handleSubmission}
                  disabled={isSubmitting}
                />
              ) : currentChallenge.type === 'matching' ? (
                <MatchingWorkspace
                  challenge={currentChallenge}
                  onSubmit={handleSubmission}
                  disabled={isSubmitting}
                />
              ) : currentChallenge.type === 'arrange_steps' ? (
                <ArrangeStepsWorkspace
                  challenge={currentChallenge}
                  onSubmit={handleSubmission}
                  disabled={isSubmitting}
                />
              ) : currentChallenge.type === 'fill_in_blank' ? (
                <FillBlankWorkspace
                  challenge={currentChallenge}
                  onSubmit={handleSubmission}
                  disabled={isSubmitting}
                />
              ) : currentChallenge.type === 'pseudocode' ? (
                <PseudocodeWorkspace
                  challenge={currentChallenge}
                  onSubmit={handleSubmission}
                  disabled={isSubmitting}
                />
              ) : currentChallenge.type === 'visual_puzzle' ? (
                <VisualPuzzleWorkspace
                  challenge={currentChallenge}
                  onSolve={handleSubmission}
                  disabled={isSubmitting}
                />
              ) : (
                <McqChallengeWorkspace
                  challenge={currentChallenge}
                  onSubmit={handleSubmission}
                  disabled={isSubmitting}
                />
              )}
            </div>

            {/* Instant Feedback Alert */}
            {feedback && (
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                feedback.isCorrect
                  ? 'bg-green-950/40 border-green-500/40 text-green-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                <span>{feedback.message}</span>
                {feedback.explanation && (
                  <span className="text-[11px] text-gray-400 italic font-sans max-w-sm truncate ml-2">
                    {feedback.explanation}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Match Final Results Modal */}
        {matchEnded && (
          <div className="p-8 rounded-2xl bg-gray-900 border border-cyan-500/40 flex flex-col items-center text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-cyber font-bold text-white">QUEST TIME EXPIRED!</h2>
              <p className="text-xs text-gray-400 font-mono mt-1">Here is your verified session performance report.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl text-left">
              <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">Final Score</span>
                <span className="text-xl font-bold font-mono text-yellow-400">{score}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">Accuracy</span>
                <span className="text-xl font-bold font-mono text-green-400">
                  {stats.attempted > 0 ? `${Math.round((stats.solved / stats.attempted) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">Solved / Total</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{stats.solved} / {stats.attempted}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">Avg Velocity</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {stats.attempted > 0 ? `${(stats.totalTimeMs / (stats.attempted * 1000)).toFixed(1)}s` : '0s'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={startSoloMatch}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs transition"
              >
                Play Another Match
              </button>
              <button
                onClick={() => setScreen('dashboard')}
                className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold text-xs transition border border-gray-700"
              >
                View Mastery Dashboard
              </button>
            </div>
          </div>
        )}

        {/* AuraBot Single-Button Reactions & Sound Controls */}
        {matchStarted && !matchEnded && <HypeReactionStream />}
      </div>
    </AppShell>
  );
};
