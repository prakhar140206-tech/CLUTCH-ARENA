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
    <div className="flex flex-col h-full bg-slate-950/80 border border-violet-500/30 rounded-lg p-5 overflow-y-auto">
      {/* Title & Topic Pill */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-cyber tracking-wider text-cyan-400 uppercase font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {challenge.topic.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-900/50 text-violet-300 border border-violet-600/50 uppercase">
          {challenge.difficulty}
        </span>
      </div>

      {/* Prompt */}
      <div className="text-slate-200 text-sm font-medium mb-4 leading-relaxed">
        {challenge.prompt}
      </div>

      {/* Code Snippet if applicable */}
      {challenge.codeSnippet && (
        <div className="mb-4 bg-slate-900/90 rounded border border-slate-800 p-3 font-mono text-xs text-cyan-300 overflow-x-auto relative">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1 border-b border-slate-800 pb-1">
            <Terminal className="w-3 h-3" />
            <span>ALGORITHM SNIPPET</span>
          </div>
          <pre className="leading-relaxed">{challenge.codeSnippet}</pre>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2.5 my-auto">
        {challenge.options?.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedOption === opt;
          return (
            <button
              key={opt}
              onClick={() => setSelectedOption(opt)}
              disabled={disabled}
              className={`w-full p-3 rounded-lg border text-left text-xs font-mono transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-violet-500/50 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                  isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {letter}
                </span>
                <span>{opt}</span>
              </div>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">
          Selected: <strong className="text-cyan-300">{selectedOption ? selectedOption.slice(0, 30) + '...' : 'None'}</strong>
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || disabled}
          className="cyber-btn cyber-btn-cyan px-6 py-2 text-xs flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>CONFIRM SOLUTION</span>
        </button>
      </div>
    </div>
  );
};
