import React, { useState, useEffect } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { Edit3, Check, HelpCircle } from 'lucide-react';

interface FillBlankWorkspaceProps {
  challenge: ClientChallenge;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}

export const FillBlankWorkspace: React.FC<FillBlankWorkspaceProps> = ({
  challenge,
  onSubmit,
  disabled = false
}) => {
  const fillData = challenge.fillBlankData;
  const blanks = fillData?.blanks || [];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    blanks.forEach(b => {
      initial[b.id] = '';
    });
    setAnswers(initial);
  }, [challenge.id]);

  const handleChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit(answers);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-cyan-500/30 rounded-xl p-5 overflow-hidden">
      {/* Header */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-950/40 via-gray-900 to-purple-950/40 border border-cyan-500/20 rounded-lg">
        <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Edit3 className="w-3.5 h-3.5" /> Fill-In-The-Blanks Challenge
        </span>
        <p className="text-sm font-medium text-gray-200 mt-1">{challenge.prompt}</p>
      </div>

      {/* Code Snippet Box */}
      {challenge.codeSnippet && (
        <div className="p-4 bg-black/60 border border-gray-800 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto mb-4 leading-relaxed">
          <pre>{challenge.codeSnippet}</pre>
        </div>
      )}

      {/* Blanks Inputs Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 py-1">
        <span className="text-xs font-mono uppercase text-gray-400 block px-1">
          Complete Missing Expressions
        </span>

        {blanks.map(blank => (
          <div key={blank.id} className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-cyan-300">
                {blank.id} ({blank.label})
              </label>
              {blank.hint && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1 font-sans">
                  <HelpCircle className="w-3 h-3 text-purple-400" /> {blank.hint}
                </span>
              )}
            </div>

            <input
              type="text"
              value={answers[blank.id] || ''}
              onChange={(e) => handleChange(blank.id, e.target.value)}
              disabled={disabled}
              placeholder="Type matching expression..."
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-cyan-400 text-white font-mono text-xs outline-none transition"
            />
          </div>
        ))}
      </form>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
        <span className="text-xs font-mono text-gray-400">
          Filled: <strong className="text-cyan-400">{Object.values(answers).filter(v => v.trim().length > 0).length}</strong> of {blanks.length}
        </span>
        <button
          onClick={() => handleSubmit()}
          disabled={disabled || Object.values(answers).some(v => v.trim().length === 0)}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Submit Answers
        </button>
      </div>
    </div>
  );
};
