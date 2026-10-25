import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { ClientChallenge, Difficulty } from '../../../shared/types.js';
import { CodeSprintEditor } from '../components/challenges/CodeSprintEditor.js';
import { VisualPuzzleWorkspace } from '../components/challenges/VisualPuzzleWorkspace.js';
import { McqChallengeWorkspace } from '../components/challenges/McqChallengeWorkspace.js';
import { HypeReactionStream } from '../components/arena/HypeReactionStream.js';
import { soundSynth } from '../services/soundSynth.js';
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Award,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const SoloQuestScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const soloSolvedIds = useGameStore((s) => s.soloSolvedIds);
  const markSoloSolved = useGameStore((s) => s.markSoloSolved);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);


  const [challenges, setChallenges] = useState<ClientChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<ClientChallenge | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; explanation?: string } | null>(null);
  const [hintUsed, setHintUsed] = useState<boolean>(false);

  // Helper to format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Function to dynamically generate a brand new unique question from AI
  const fetchNextAIChallenge = async (diff: Difficulty, duration: number) => {
    setIsGeneratingAI(true);
    try {
      const topics: any[] = ['arrays_and_strings', 'trees_and_bst', 'graphs', 'complexity_analysis', 'dynamic_programming'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const res = await fetch('http://localhost:4000/api/generate-ai-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: randomTopic,
          difficulty: diff,
          timeLimitSeconds: duration
        })
      });
      const data = await res.json();
      if (data.challenge) {
        setSelectedChallenge(data.challenge);
        setChallenges((prev) => [data.challenge, ...prev.filter(c => c.id !== data.challenge.id)]);
        setFeedback(null);
        setHintUsed(false);
        setTimeLeft(duration);
      }
    } catch (err) {
      console.error('Failed to generate AI challenge:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // On initial mount, fetch the first dynamic AI challenge with Max 10 min (600s)
  useEffect(() => {
    fetchNextAIChallenge('beginner', 600);
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
    setFeedback({
      isCorrect: false,
      message: '⏰ TIME EXPIRED! The clock reached 0. Take a deep breath and retry the level.'
    });
  };

  const handleSelectChallenge = (c: ClientChallenge) => {
    setSelectedChallenge(c);
    setFeedback(null);
    setHintUsed(false);
    setTimeLeft(baseTime);
  };

  const advanceLevelAdaptively = (solveTimeSeconds: number) => {
    const nextLevel = currentLevel + 1;
    setCurrentLevel(nextLevel);
    const newStreak = streak + 1;
    setStreak(newStreak);

    // Adaptive difficulty progression based on solve speed and accuracy:
    // If solved quickly (< 50% of available time) and building streak, level up difficulty tier!
    let nextDifficulty: Difficulty = adaptiveDifficulty;
    const isSuperFast = solveTimeSeconds <= (baseTime / 2);

    if (nextLevel === 2) {
      nextDifficulty = isSuperFast ? 'intermediate' : 'beginner';
    } else if (nextLevel === 3) {
      nextDifficulty = isSuperFast || newStreak >= 2 ? 'advanced' : 'intermediate';
    } else if (nextLevel >= 4) {
      nextDifficulty = isSuperFast || newStreak >= 3 ? 'expert' : 'advanced';
    }
    setAdaptiveDifficulty(nextDifficulty);

    const nextDuration = Math.max(360, 600 - nextLevel * 60);

    // Fetch brand new unique AI challenge for the next level
    setTimeout(() => {
      fetchNextAIChallenge(nextDifficulty, nextDuration);
    }, 1800);
  };

  const handleSoloSubmit = async (answer: any, language?: any) => {
    if (!selectedChallenge || timeLeft <= 0) return;

    const timeSpent = Math.max(1, baseTime - timeLeft);
    const nextDuration = Math.max(360, 600 - currentLevel * 60);

    if (selectedChallenge.type === 'code_sprint') {
      try {
        const res = await fetch('http://localhost:4000/api/run-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: language || 'python',
            code: String(answer),
            testCases: selectedChallenge.testCases
          })
        });
        const data = await res.json();
        if (data.allPassed) {
          soundSynth.auraGlow();
          soundSynth.speakHype('SHEESH! All test cases passed! Absolute GigaChad energy!', 'hype');
          const nextAura = (userProfile.auraPoints || 48500) + 1500;
          updateUserProfile({ auraPoints: nextAura });

          markSoloSolved(selectedChallenge.id);
          setFeedback({
            isCorrect: true,
            message: `⚡ LEVEL ${currentLevel} CLEARED in ${formatTime(timeSpent)}! (+1,500 AURA) Next round time: ${formatTime(nextDuration)} (${Math.floor(nextDuration / 60)} min)`,
            explanation: selectedChallenge.explanation
          });
          advanceLevelAdaptively(timeSpent);
        } else {
          soundSynth.vineBoom();
          soundSynth.speakHype('Skill issue! Bro is cooked on hidden test cases!', 'roast');
          setStreak(0);
          setFeedback({
            isCorrect: false,
            message: `Failed ${data.totalTests - data.passedTests} of ${data.totalTests} test cases. Review edge cases and try again!`
          });
        }
      } catch (err: any) {
        soundSynth.vineBoom();
        setFeedback({ isCorrect: false, message: `Execution error: ${err.message}` });
      }
      return;
    }

    // Dynamic verification through server authoritative verify-answer endpoint
    try {
      const res = await fetch('http://localhost:4000/api/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          answer
        })
      });
      const data = await res.json();

      if (data.isCorrect) {
        soundSynth.auraGlow();
        soundSynth.speakHype('NO CAP! Invariant locked in!', 'hype');
        const nextAura = (userProfile.auraPoints || 48500) + 1200;
        updateUserProfile({ auraPoints: nextAura });

        markSoloSolved(selectedChallenge.id);
        setFeedback({
          isCorrect: true,
          message: `⚡ LEVEL ${currentLevel} CLEARED in ${formatTime(timeSpent)}! (+1,200 AURA) Next round time: ${formatTime(nextDuration)} (${Math.floor(nextDuration / 60)} min)`,
          explanation: data.explanation || selectedChallenge.explanation
        });
        advanceLevelAdaptively(timeSpent);
      } else {
        soundSynth.vineBoom();
        soundSynth.speakHype('Bro guessed wrong... Emotional damage!', 'roast');
        setStreak(0);
        setFeedback({
          isCorrect: false,
          message: 'Incorrect solution. Re-examine the algorithmic invariants and try again.'
        });
      }
    } catch (err: any) {
      soundSynth.vineBoom();
      setFeedback({ isCorrect: false, message: `Verification error: ${err.message}` });
    }
  };


  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-hidden select-none relative">
      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#040409]/90 border-b border-violet-500/30 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('lobby')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-xs font-cyber"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>LOBBY</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 text-emerald-400 font-cyber font-bold text-sm">
            <Compass className="w-4 h-4" />
            <span>ADAPTIVE SOLO QUEST: SPEED & DIFFICULTY PROGRESSION</span>
          </div>
        </div>

        {/* Dynamic Timer & Adaptive Level HUD */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Current Level */}
          <div className="px-3 py-1 bg-violet-950/60 border border-violet-500/50 rounded-lg text-violet-300 flex items-center gap-1.5 font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>LEVEL {currentLevel}</span>
          </div>

          {/* Adaptive Difficulty Pill */}
          <div className="px-3 py-1 bg-slate-900 border border-cyan-500/40 rounded-lg text-cyan-300 flex items-center gap-1.5 uppercase font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{adaptiveDifficulty}</span>
          </div>

          {/* Dynamic Decreasing Countdown Timer (Min 6 min / Max 10 min) */}
          <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 font-bold ${
            timeLeft <= 30
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-bounce'
              : 'bg-slate-900 border-amber-500/50 text-amber-300'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)} / {formatTime(baseTime)}</span>
          </div>

          {/* Solved Badge */}
          <div className="px-3 py-1 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-emerald-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Solved: {soloSolvedIds.length}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Timer Progress Bar */}
      <div className="w-full bg-slate-900 h-1 relative overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400'
          }`}
          style={{ width: `${(timeLeft / baseTime) * 100}%` }}
        />
      </div>

      {/* Main Container: Split Quest Map List & Active Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Quest Roadmap Navigation */}
        <div className="w-80 bg-slate-950/60 border-r border-violet-500/20 p-4 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-cyber tracking-wider text-slate-400 uppercase font-bold">
              CHALLENGE MATRIX
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Timer: {formatTime(baseTime)} ({Math.floor(baseTime / 60)} min)
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {challenges.map((c, idx) => {
              const isSolved = soloSolvedIds.includes(c.id);
              const isSelected = selectedChallenge?.id === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectChallenge(c)}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-violet-600/25 border-cyan-400 text-white shadow-lg shadow-violet-950/50 scale-[1.01]'
                      : isSolved
                      ? 'bg-slate-900/40 border-emerald-500/30 text-slate-300 hover:border-emerald-500/50'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 text-[11px] font-mono font-bold text-slate-500">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-medium text-white truncate">{c.title}</div>
                      <div className="text-[10px] text-cyan-400/80 font-mono capitalize">
                        {c.topic.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  {isSolved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      c.difficulty === 'beginner' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      c.difficulty === 'intermediate' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      c.difficulty === 'advanced' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {c.difficulty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Challenge Interactive Workspace */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {selectedChallenge ? (
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
              {/* Dynamic Scaling Info Banner with AI Generation Trigger */}
              <div className="mb-3 px-3 py-2 bg-slate-900/70 border border-violet-500/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-amber-400 font-bold">Level {currentLevel}:</span>
                  <span>Allowed Time: <strong className="text-cyan-300">{formatTime(baseTime)}</strong> ({Math.floor(baseTime / 60)} min — Min 6 min / Max 10 min)</span>
                  <span className="text-slate-500">•</span>
                  <span>Target: <strong className="text-violet-300 uppercase">{adaptiveDifficulty}</strong></span>
                </div>
                <button
                  onClick={() => fetchNextAIChallenge(adaptiveDifficulty, baseTime)}
                  disabled={isGeneratingAI}
                  className="cyber-btn cyber-btn-cyan px-3 py-1 text-[11px] flex items-center gap-1.5 shrink-0"
                  title="Generate a completely brand new unique question from AI on the fly"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAI ? 'SYNTHESIZING AI...' : 'GENERATE NEW AI QUESTION'}</span>
                </button>
              </div>

              {/* Challenge Workspace Component */}
              <div className="flex-1 min-h-[460px] mb-4">
                {selectedChallenge.type === 'code_sprint' ? (
                  <CodeSprintEditor
                    challenge={selectedChallenge}
                    onSubmit={handleSoloSubmit}
                    disabled={timeLeft <= 0}
                  />
                ) : selectedChallenge.type === 'visual_puzzle' ? (
                  <VisualPuzzleWorkspace
                    challenge={selectedChallenge}
                    onSolve={handleSoloSubmit}
                    disabled={timeLeft <= 0}
                  />
                ) : (
                  <McqChallengeWorkspace
                    challenge={selectedChallenge}
                    onSubmit={handleSoloSubmit}
                    disabled={timeLeft <= 0}
                  />
                )}
              </div>

              {/* Feedback and Learning Explanation Banner */}
              {feedback && (
                <div className={`p-4 rounded-xl border mb-4 text-xs font-mono animate-in fade-in ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                }`}>
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <HelpCircle className="w-4 h-4 text-rose-400" />}
                    <span>{feedback.message}</span>
                  </div>
                  {feedback.explanation && (
                    <div className="mt-2 text-slate-300 font-sans leading-relaxed bg-slate-950/50 p-3 rounded border border-emerald-500/30">
                      <strong className="text-emerald-400 block mb-1">Algorithmic Invariants & Proof:</strong>
                      {feedback.explanation}
                    </div>
                  )}
                </div>
              )}

              {/* AI Hint Expander */}
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Stuck on this algorithmic invariant?</span>
                </div>
                <button
                  onClick={() => setHintUsed(!hintUsed)}
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-xs underline"
                >
                  {hintUsed ? 'Hide Hint' : 'Reveal AI Hint'}
                </button>
              </div>

              {hintUsed && (
                <div className="mt-2 p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs font-mono leading-relaxed">
                  💡 Hint: Consider time/space trade-offs. Check boundary conditions when pointers meet or indices cross.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
              Select a chapter from the quest roadmap to begin.
            </div>
          )}
        </div>
      </div>

      {/* Floating Reaction Stream & Hype Voice Caster */}
      <HypeReactionStream />
    </div>
  );
};

