import React, { useState } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { Terminal, Check, Send } from 'lucide-react';

interface PseudocodeWorkspaceProps {
  challenge: ClientChallenge;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}

export const PseudocodeWorkspace: React.FC<PseudocodeWorkspaceProps> = ({
  challenge,
  onSubmit,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (disabled || !selectedOption) return;
    onSubmit(selectedOption);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-cyan-500/30 rounded-xl p-2.5 sm:p-5 overflow-hidden font-sans relative">
      {/* Header */}
      <div className="mb-2.5 p-3 bg-gradient-to-r from-cyan-950/40 via-gray-900 to-purple-950/40 border border-cyan-500/20 rounded-lg shrink-0">
        <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" /> Pseudocode Tracing Challenge
        </span>
        <p className="text-xs sm:text-sm font-medium text-gray-200 mt-1">{challenge.prompt}</p>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 py-1">
        {/* Pseudocode Box */}
        {challenge.codeSnippet && (
          <div className="p-3 bg-black/70 border border-gray-800 rounded-xl font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
            <pre>{challenge.codeSnippet}</pre>
          </div>
        )}

        {/* Options Grid */}
        <div className="space-y-2 py-1">
          <span className="text-xs font-mono uppercase text-gray-400 block px-1">
            Select Traced Outcome
          </span>

          {challenge.options?.map(opt => {
            const isSelected = selectedOption === opt;
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={disabled}
                className={`w-full p-3 rounded-xl border text-left min-h-[44px] transition-all duration-200 flex items-center justify-between focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-lg shadow-cyan-500/20'
                    : 'border-gray-800 bg-gray-900/60 text-gray-300 hover:border-cyan-500/40 hover:bg-gray-900/90'
                }`}
              >
                <span className="font-mono text-xs break-words flex-1 min-w-0 pr-2">{opt}</span>
                {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Permanently Pinned Submit Button Footer */}
      <div className="shrink-0 pt-2.5 mt-1 border-t border-gray-800/80 flex items-center justify-between gap-2 z-20 bg-[#0b0f19]">
        <span className="text-xs font-mono text-gray-400 truncate flex-1 min-w-0">
          Selected: <strong className="text-cyan-400">{selectedOption || 'None'}</strong>
        </span>

        <button
          onClick={handleSubmit}
          disabled={disabled || !selectedOption}
          className="px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Answer</span>
        </button>
      </div>
    </div>
  );
};
