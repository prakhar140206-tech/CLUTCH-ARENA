import React, { useState, useEffect } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { soundSynth } from '../../services/soundSynth.js';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Terminal, Sparkles, Send, Award, Lightbulb, AlertTriangle } from 'lucide-react';

interface McqChallengeWorkspaceProps {
  challenge: ClientChallenge;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export const McqChallengeWorkspace: React.FC<McqChallengeWorkspaceProps> = ({
  challenge,
  onSubmit,
  disabled = false
}) => {
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(2);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [wrongOptions, setWrongOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'info' | 'warning' | 'success' | 'error'; message: string } | null>(null);

  // Reset state when challenge changes
  useEffect(() => {
    setAttemptsRemaining(2);
    setSelectedOption(null);
    setSelectedIdx(-1);
    setWrongOptions([]);
    setIsAnswered(false);
    setIsCorrect(null);
    setFeedbackBanner({
      type: 'info',
      message: 'Select an option and click Submit Answer • You have 2 chances'
    });
  }, [challenge.id]);

  // Helper to normalize strings for robust comparison
  const normalize = (val: any): string => {
    if (typeof val === 'string') return val.trim().toLowerCase();
    if (val === undefined || val === null) return '';
    return JSON.stringify(val).toLowerCase();
  };

  const isOptionCorrect = (opt: string, idx: number): boolean => {
    if (!challenge.correctAnswer) return false;
    const cleanOpt = normalize(opt);
    const cleanExpected = normalize(challenge.correctAnswer);
    const letter = String.fromCharCode(65 + idx).toLowerCase();

    return (
      cleanOpt === cleanExpected ||
      cleanExpected === letter ||
      cleanExpected === `[${letter}]` ||
      cleanExpected === `${letter})` ||
      cleanOpt.includes(cleanExpected)
    );
  };

  // Find the correct option text for revealing solutions
  const correctOptionText =
    challenge.options?.find((opt, idx) => isOptionCorrect(opt, idx)) ||
    (typeof challenge.correctAnswer === 'string' ? challenge.correctAnswer : '');

  // Handle selecting an option candidate
  const handleSelectOption = (opt: string, idx: number) => {
    if (disabled || isAnswered || wrongOptions.includes(opt)) return;
    soundSynth.click();
    setSelectedOption(opt);
    setSelectedIdx(idx);
    setFeedbackBanner({
      type: 'info',
      message: `Selected [${String.fromCharCode(65 + idx)}] • Click "Submit Answer" to confirm`
    });
  };

  // Handle explicit submission via the Submit Button (for both PC/Desktop and Mobile)
  const handleSubmitAnswer = () => {
    if (!selectedOption || disabled || isAnswered) return;

    soundSynth.click();
    const isMatch = isOptionCorrect(selectedOption, selectedIdx);

    if (isMatch) {
      // SUCCESS!
      setIsAnswered(true);
      setIsCorrect(true);
      try {
        soundSynth.levelUp();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } catch {
        // sound optional
      }

      if (attemptsRemaining === 2) {
        setFeedbackBanner({
          type: 'success',
          message: '🏆 CORRECT ON 1ST CHANCE! Answer confirmed • Full Points Awarded'
        });
      } else {
        setFeedbackBanner({
          type: 'success',
          message: '⚡ CORRECT ON 2ND CHANCE! Answer confirmed • Bonus Points Awarded'
        });
      }

      setTimeout(() => {
        onSubmit(selectedOption);
      }, 900);
    } else {
      // INCORRECT!
      try {
        soundSynth.vineBoom();
      } catch {
        // sound optional
      }

      const failedOption = selectedOption;

      if (attemptsRemaining === 2) {
        // Used 1st chance -> 1 chance remains
        setAttemptsRemaining(1);
        setWrongOptions((prev) => [...prev, failedOption]);
        setSelectedOption(null);
        setSelectedIdx(-1);
        setFeedbackBanner({
          type: 'warning',
          message: '❌ INCORRECT! 1 CHANCE REMAINING — CHOOSE ANOTHER OPTION AND SUBMIT!'
        });
      } else {
        // Used 2nd chance -> 0 chances left, question finished
        setAttemptsRemaining(0);
        setWrongOptions((prev) => [...prev, failedOption]);
        setIsAnswered(true);
        setIsCorrect(false);
        setFeedbackBanner({
          type: 'error',
          message: '🔒 0 CHANCES LEFT! Answer incorrect • Solution revealed below'
        });

        setTimeout(() => {
          onSubmit(failedOption);
        }, 1800);
      }
    }
  };

  return (
    <div className="flex flex-col h-full clutch-panel rounded-2xl overflow-y-auto p-3.5 sm:p-5 font-sans border border-clutch-border select-none">
      {/* Top Header: Topic, Difficulty, and 2-Chances Indicator */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-cyber tracking-wider text-clutch-lavender uppercase font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{challenge.topic.replace(/_/g, ' ')}</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 uppercase font-semibold">
            {challenge.difficulty}
          </span>
        </div>

        {/* 2-Chances Counter Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-clutch-surface-light border border-clutch-border">
          <span className="text-[10px] font-mono text-clutch-subtle font-bold uppercase tracking-wider">
            Chances:
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                attemptsRemaining >= 1
                  ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                  : 'bg-rose-500/40 border border-rose-500'
              }`}
              title="Chance 1"
            />
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                attemptsRemaining >= 2
                  ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                  : 'bg-rose-500/40 border border-rose-500'
              }`}
              title="Chance 2"
            />
          </div>
          <span
            className={`text-[10px] font-mono font-bold ml-0.5 ${
              attemptsRemaining === 2
                ? 'text-cyan-300'
                : attemptsRemaining === 1
                ? 'text-amber-400 animate-pulse'
                : 'text-rose-400'
            }`}
          >
            {attemptsRemaining}/2
          </span>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`mb-3 px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all duration-300 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : feedbackBanner.type === 'warning'
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : feedbackBanner.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'bg-clutch-surface-light/80 border-clutch-border text-clutch-muted'
          }`}
        >
          {feedbackBanner.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {feedbackBanner.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {feedbackBanner.type === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {feedbackBanner.type === 'info' && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          <span className="font-semibold">{feedbackBanner.message}</span>
        </div>
      )}

      {/* Question Prompt */}
      <div className="text-slate-100 text-sm sm:text-base font-semibold mb-3 leading-relaxed shrink-0">
        {challenge.prompt}
      </div>

      {/* Code Snippet if applicable */}
      {challenge.codeSnippet && (
        <div className="mb-4 bg-clutch-bg rounded-xl border border-clutch-border p-3 sm:p-3.5 font-mono text-xs text-clutch-lavender overflow-x-auto relative shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-clutch-subtle mb-2 border-b border-clutch-border pb-1">
            <Terminal className="w-3 h-3 text-clutch-lavender" />
            <span>ALGORITHM REFERENCE</span>
          </div>
          <pre className="leading-relaxed">{challenge.codeSnippet}</pre>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2.5 sm:space-y-3 flex-1 py-1">
        {challenge.options?.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isWrong = wrongOptions.includes(opt);
          const isSelected = selectedOption === opt;
          const isCorrectAnswer = isAnswered && isOptionCorrect(opt, idx);

          let optionStyle =
            'bg-clutch-surface-light border-clutch-border text-clutch-muted hover:border-clutch-violet/60 hover:text-white hover:bg-clutch-surface-elevated';
          let letterStyle = 'bg-clutch-surface text-clutch-subtle';

          if (isCorrectAnswer) {
            // Correct answer revealed
            optionStyle =
              'bg-emerald-950/60 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400';
            letterStyle = 'bg-emerald-500 text-black font-black';
          } else if (isWrong) {
            // Wrong attempt
            optionStyle =
              'bg-rose-950/40 border-rose-500/50 text-rose-300 line-through opacity-60 cursor-not-allowed';
            letterStyle = 'bg-rose-500/30 text-rose-300 font-bold';
          } else if (isSelected) {
            // Selected candidate (waiting for Submit button)
            optionStyle =
              'bg-violet-900/40 border-violet-400 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] ring-1 ring-violet-400';
            letterStyle = 'bg-violet-600 text-white font-bold';
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelectOption(opt, idx)}
              disabled={disabled || isAnswered || isWrong}
              className={`w-full p-3 sm:p-3.5 rounded-xl border text-left text-xs font-mono transition-all duration-150 flex items-center justify-between min-h-[48px] focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none touch-manipulation relative group ${optionStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${letterStyle}`}
                >
                  {isCorrectAnswer ? '✓' : isWrong ? '✕' : letter}
                </span>
                <span className="break-words leading-relaxed">{opt}</span>
              </div>

              {/* Status Indicator Badges */}
              <div className="shrink-0 ml-2">
                {isCorrectAnswer && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CORRECT</span>
                  </span>
                )}
                {isWrong && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>INCORRECT</span>
                  </span>
                )}
                {isSelected && !isAnswered && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-violet-300 px-2 py-0.5 rounded bg-violet-500/20 border border-violet-500/40">
                    <span>SELECTED</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Authoritative Question Solution & Explanation (Revealed when answered or out of chances) */}
      {isAnswered && (
        <div className="mt-4 pt-4 border-t border-clutch-border animate-in fade-in duration-300 shrink-0">
          <div className="bg-gradient-to-r from-violet-950/60 via-purple-950/40 to-slate-900/60 border border-violet-500/30 p-3.5 sm:p-4 rounded-xl text-left font-mono">
            <div className="flex items-center gap-2 text-xs font-cyber font-bold text-cyan-300 mb-2">
              <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>QUESTION SOLUTION &amp; ALGORITHMIC EXPLANATION</span>
            </div>

            {correctOptionText && (
              <div className="text-xs text-white mb-2 pb-2 border-b border-violet-500/20">
                <span className="text-clutch-muted font-bold">Answer: </span>
                <strong className="text-emerald-300">{correctOptionText}</strong>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal">
              {challenge.explanation}
            </p>

            <div className="mt-3 flex items-center justify-between text-[10px] text-clutch-subtle pt-2 border-t border-white/5 font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <Award className="w-3 h-3" />
                <span>
                  {isCorrect
                    ? attemptsRemaining === 2
                      ? '+1000 MMR / Aura (1st Try)'
                      : '+600 MMR / Aura (2nd Try)'
                    : '0 Points (Review Concept)'}
                </span>
              </span>
              <span className="text-clutch-muted animate-pulse">Advancing to Round Standings...</span>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Submit Answer Bar - Desktop / PC and Mobile */}
      {!isAnswered && (
        <div className="mt-4 pt-3 border-t border-clutch-border flex items-center justify-between gap-3 shrink-0 bg-clutch-panel/90 backdrop-blur-sm -mx-1 px-1">
          <div className="text-xs font-mono text-clutch-subtle truncate max-w-[140px] sm:max-w-xs">
            Selected:{' '}
            <strong className={selectedOption ? 'text-cyan-300 font-bold' : 'text-slate-400 font-normal'}>
              {selectedOption ? selectedOption.slice(0, 26) + (selectedOption.length > 26 ? '...' : '') : 'None'}
            </strong>
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedOption || disabled || isAnswered}
            className={`px-5 sm:px-6 py-2.5 rounded-xl font-cyber font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px] shadow-lg ${
              selectedOption && !isAnswered && !disabled
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-violet-400/50 active:scale-95 cursor-pointer'
                : 'bg-clutch-surface-light border border-clutch-border text-clutch-muted opacity-50 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Answer</span>
          </button>
        </div>
      )}
    </div>
  );
};
