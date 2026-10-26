import React, { useState } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { Terminal, Check } from 'lucide-react';

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

  const handleSubmit = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
    onSubmit(option);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-cyan-500/30 rounded-xl p-3.5 sm:p-5 overflow-y-auto font-sans">
      {/* Header */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-950/40 via-gray-900 to-purple-950/40 border border-cyan-500/20 rounded-lg shrink-0">
        <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" /> Pseudocode Tracing Challenge
        </span>
        <p className="text-sm font-medium text-gray-200 mt-1">{challenge.prompt}</p>
      </div>

      {/* Pseudocode Box */}
      {challenge.codeSnippet && (
        <div className="p-3.5 sm:p-4 bg-black/70 border border-gray-800 rounded-xl font-mono text-xs text-purple-300 overflow-x-auto mb-4 leading-relaxed shrink-0">
          <pre>{challenge.codeSnippet}</pre>
        </div>
      )}

      {/* Options Grid */}
      <div className="flex-1 overflow-y-auto space-y-2 py-1">
        <span className="text-xs font-mono uppercase text-gray-400 block px-1">
          Select Traced Outcome
        </span>

        {challenge.options?.map(opt => {
          const isSelected = selectedOption === opt;
          return (
            <button
              key={opt}
              onClick={() => handleSubmit(opt)}
              disabled={disabled}
              className={`w-full p-3.5 rounded-xl border text-left min-h-[44px] transition-all duration-200 flex items-center justify-between focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-lg shadow-cyan-500/20'
                  : 'border-gray-800 bg-gray-900/60 text-gray-300 hover:border-cyan-500/40 hover:bg-gray-900/90'
              }`}
            >
              <span className="font-mono text-xs">{opt}</span>
              {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
