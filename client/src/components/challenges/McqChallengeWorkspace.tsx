import React, { useState } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { CheckCircle2, Send, Terminal, Sparkles } from 'lucide-react';

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
  const [selectedOption, setSelectedOption] = useState<string>('');

  const handleSubmit = () => {
    if (!selectedOption) return;
    onSubmit(selectedOption);
  };

  return (
    <div className="flex flex-col h-full clutch-panel rounded-2xl overflow-y-auto p-3.5 sm:p-6 font-sans border border-clutch-border">
      {/* Title & Topic Pill */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs font-cyber tracking-wider text-clutch-lavender uppercase font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {challenge.topic.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 uppercase">
          {challenge.difficulty}
        </span>
      </div>

      {/* Prompt */}
      <div className="text-slate-100 text-sm sm:text-base font-semibold mb-3 leading-relaxed shrink-0">
        {challenge.prompt}
      </div>

      {/* Code Snippet if applicable */}
      {challenge.codeSnippet && (
        <div className="mb-4 bg-clutch-bg rounded-xl border border-clutch-border p-3 sm:p-3.5 font-mono text-xs text-clutch-lavender overflow-x-auto relative shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-clutch-subtle mb-2 border-b border-clutch-border pb-1">
            <Terminal className="w-3 h-3" />
            <span>ALGORITHM REFERENCE</span>
          </div>
          <pre className="leading-relaxed">{challenge.codeSnippet}</pre>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2.5 sm:space-y-3 flex-1 py-1">
        {challenge.options?.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedOption === opt;
          return (
            <button
              key={opt}
              onClick={() => setSelectedOption(opt)}
              disabled={disabled}
              className={`w-full p-3 sm:p-3.5 rounded-xl border text-left text-xs font-mono transition-all flex items-center justify-between min-h-[44px] focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none touch-manipulation ${
                isSelected
                  ? 'bg-clutch-violet/20 border-clutch-violet text-white shadow-md'
                  : 'bg-clutch-surface-light border-clutch-border text-clutch-muted hover:border-clutch-violet/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected ? 'bg-clutch-violet text-white' : 'bg-clutch-surface text-clutch-subtle'
                }`}>
                  {letter}
                </span>
                <span className="truncate">{opt}</span>
              </div>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-clutch-lavender shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>

      {/* Submit Button (Always accessible & visible) */}
      <div className="mt-4 pt-3 border-t border-clutch-border flex items-center justify-between gap-3 shrink-0 z-20 relative bg-clutch-panel/50 backdrop-blur-sm -mx-1 px-1">
        <span className="text-xs text-clutch-subtle font-mono truncate max-w-[140px] sm:max-w-xs">
          Selected: <strong className="text-white">{selectedOption ? selectedOption.slice(0, 24) + (selectedOption.length > 24 ? '...' : '') : 'None'}</strong>
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || disabled}
          className="clutch-btn-primary px-5 sm:px-6 py-2.5 min-h-[44px] text-xs flex items-center justify-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Confirm Answer</span>
        </button>
      </div>
    </div>
  );
};
