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
    <div className="flex flex-col h-full max-h-full clutch-panel rounded-2xl p-2.5 sm:p-5 font-sans border border-clutch-border select-none w-full max-w-full min-w-0 overflow-hidden relative">
      {/* Top Header: Topic, Difficulty, and 2-Chances Indicator (Shrink-0) */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-xs font-cyber tracking-wider text-clutch-lavender uppercase font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate max-w-[160px] xs:max-w-none">{challenge.topic.replace(/_/g, ' ')}</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 uppercase font-semibold">
            {challenge.difficulty}
          </span>
        </div>

        {/* 2-Chances Counter Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-clutch-surface-light border border-clutch-border shrink-0">
          <span className="text-[9px] sm:text-[10px] font-mono text-clutch-subtle font-bold uppercase tracking-wider">
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
            className={`text-[9px] sm:text-[10px] font-mono font-bold ml-0.5 ${
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

      {/* Dynamic Feedback Banner (Shrink-0) */}
      {feedbackBanner && (
        <div
          className={`mb-2 px-3 py-1.5 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-mono flex items-center gap-2 transition-all duration-300 max-w-full shrink-0 ${
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
          <span className="font-semibold break-words flex-1 min-w-0">{feedbackBanner.message}</span>
        </div>
      )}

      {/* Main Scrollable Body: Question, Code Snippet, Options, and Solution (Flex-1) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-2.5">
        {/* Question Prompt - Fluid Responsive Typography */}
        <div className="text-slate-100 text-xs xs:text-sm sm:text-base font-semibold leading-snug sm:leading-relaxed break-words max-w-full">
          {challenge.prompt}
        </div>

        {/* Code Snippet if applicable */}
        {challenge.codeSnippet && (
          <div className="bg-clutch-bg rounded-xl border border-clutch-border p-2.5 sm:p-3.5 font-mono text-[11px] sm:text-xs text-clutch-lavender overflow-x-auto relative max-w-full">
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-clutch-subtle mb-1.5 border-b border-clutch-border pb-1">
              <Terminal className="w-3 h-3 text-clutch-lavender" />
              <span>ALGORITHM REFERENCE</span>
            </div>
            <pre className="leading-relaxed whitespace-pre font-mono">{challenge.codeSnippet}</pre>
          </div>
        )}

        {/* Options List - Fully responsive with zero truncation */}
        <div className="space-y-2 sm:space-y-2.5 py-1 max-w-full">
          {challenge.options?.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isWrong = wrongOptions.includes(opt);
            const isSelected = selectedOption === opt;
            const isCorrectAnswer = isAnswered && isOptionCorrect(opt, idx);

            let optionStyle =
              'bg-clutch-surface-light border-clutch-border text-clutch-muted hover:border-clutch-violet/60 hover:text-white hover:bg-clutch-surface-elevated';
            let letterStyle = 'bg-clutch-surface text-clutch-subtle';

            if (isCorrectAnswer) {
              optionStyle =
                'bg-emerald-950/60 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400';
              letterStyle = 'bg-emerald-500 text-black font-black';
            } else if (isWrong) {
              optionStyle =
                'bg-rose-950/40 border-rose-500/50 text-rose-300 line-through opacity-60 cursor-not-allowed';
              letterStyle = 'bg-rose-500/30 text-rose-300 font-bold';
            } else if (isSelected) {
              optionStyle =
                'bg-violet-900/40 border-violet-400 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] ring-1 ring-violet-400';
              letterStyle = 'bg-violet-600 text-white font-bold';
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelectOption(opt, idx)}
                disabled={disabled || isAnswered || isWrong}
                className={`w-full p-2.5 sm:p-3 rounded-xl border text-left text-xs sm:text-sm font-mono transition-all duration-150 flex items-start justify-between min-h-[44px] sm:min-h-[48px] focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none touch-manipulation relative group max-w-full ${optionStyle}`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${letterStyle}`}
                  >
                    {isCorrectAnswer ? '✓' : isWrong ? '✕' : letter}
                  </span>
                  <span className="break-words whitespace-normal leading-snug sm:leading-relaxed flex-1 min-w-0 pr-1">
                    {opt}
                  </span>
                </div>

                {/* Status Indicator Badges */}
                <div className="shrink-0 ml-1.5 sm:ml-2 mt-0.5">
                  {isCorrectAnswer && (
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>CORRECT</span>
                    </span>
                  )}
                  {isWrong && (
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-rose-400 px-1.5 sm:px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40">
                      <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>WRONG</span>
                    </span>
                  )}
                  {isSelected && !isAnswered && (
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-violet-300 px-1.5 sm:px-2 py-0.5 rounded bg-violet-500/20 border border-violet-500/40">
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
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-clutch-border animate-in fade-in duration-300 max-w-full">
            <div className="bg-gradient-to-r from-violet-950/60 via-purple-950/40 to-slate-900/60 border border-violet-500/30 p-3 sm:p-4 rounded-xl text-left font-mono max-w-full">
              <div className="flex items-center gap-2 text-xs font-cyber font-bold text-cyan-300 mb-2">
                <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>QUESTION SOLUTION &amp; ALGORITHMIC EXPLANATION</span>
              </div>

              {correctOptionText && (
                <div className="text-xs text-white mb-2 pb-2 border-b border-violet-500/20 break-words">
                  <span className="text-clutch-muted font-bold">Answer: </span>
                  <strong className="text-emerald-300 break-words">{correctOptionText}</strong>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal break-words">
                {challenge.explanation}
              </p>

              <div className="mt-3 flex items-center justify-between text-[10px] text-clutch-subtle pt-2 border-t border-white/5 font-mono flex-wrap gap-2">
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
      </div>

      {/* Permanently Pinned Bottom Submit Answer Bar - 100% Always Visible & Clickable */}
      {!isAnswered && (
        <div className="shrink-0 pt-2.5 mt-1 border-t border-clutch-border flex items-center justify-between gap-2 z-30 bg-clutch-panel">
          <div className="text-[11px] sm:text-xs font-mono text-clutch-subtle truncate flex-1 min-w-0 pr-1">
            Selected:{' '}
            <strong className={selectedOption ? 'text-cyan-300 font-bold' : 'text-slate-400 font-normal'}>
              {selectedOption ? selectedOption.slice(0, 24) + (selectedOption.length > 24 ? '...' : '') : 'None'}
            </strong>
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedOption || disabled || isAnswered}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-cyber font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px] shadow-lg shrink-0 ${
              selectedOption && !isAnswered && !disabled
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-violet-400/50 active:scale-95 cursor-pointer ring-2 ring-violet-400/40'
                : 'bg-clutch-surface-light border border-clutch-border text-clutch-muted opacity-40 cursor-not-allowed'
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
