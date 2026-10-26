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
    <div className="flex flex-col h-full clutch-panel rounded-2xl overflow-y-auto p-5 sm:p-6 font-sans border border-clutch-border">
      {/* Title & Topic Pill */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-cyber tracking-wider text-clutch-lavender uppercase font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {challenge.topic.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 uppercase">
          {challenge.difficulty}
        </span>
      </div>

      {/* Prompt */}
      <div className="text-slate-100 text-sm sm:text-base font-semibold mb-4 leading-relaxed">
        {challenge.prompt}
      </div>

      {/* Code Snippet if applicable */}
      {challenge.codeSnippet && (
        <div className="mb-5 bg-clutch-bg rounded-xl border border-clutch-border p-3.5 font-mono text-xs text-clutch-lavender overflow-x-auto relative">
          <div className="flex items-center gap-1.5 text-[10px] text-clutch-subtle mb-2 border-b border-clutch-border pb-1">
            <Terminal className="w-3 h-3" />
            <span>ALGORITHM REFERENCE</span>
          </div>
          <pre className="leading-relaxed">{challenge.codeSnippet}</pre>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-3 my-auto py-2">
        {challenge.options?.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedOption === opt;
          return (
            <button
              key={opt}
              onClick={() => setSelectedOption(opt)}
              disabled={disabled}
              className={`w-full p-3.5 rounded-xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-clutch-violet/20 border-clutch-violet text-white shadow-md'
                  : 'bg-clutch-surface-light border-clutch-border text-clutch-muted hover:border-clutch-violet/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isSelected ? 'bg-clutch-violet text-white' : 'bg-clutch-surface text-clutch-subtle'
                }`}>
                  {letter}
                </span>
                <span>{opt}</span>
              </div>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-clutch-lavender shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-5 pt-4 border-t border-clutch-border flex items-center justify-between">
        <span className="text-xs text-clutch-subtle font-mono">
          Selected: <strong className="text-white">{selectedOption ? selectedOption.slice(0, 30) + '...' : 'None'}</strong>
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || disabled}
          className="clutch-btn-primary px-6 py-2.5 text-xs flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Confirm Answer</span>
        </button>
      </div>
    </div>
  );
};
