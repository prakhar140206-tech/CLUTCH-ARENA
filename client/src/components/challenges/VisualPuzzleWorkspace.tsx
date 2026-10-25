import React, { useState } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { GitBranch, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface VisualPuzzleWorkspaceProps {
  challenge: ClientChallenge;
  onSolve: (answer: string) => void;
  disabled?: boolean;
}

export const VisualPuzzleWorkspace: React.FC<VisualPuzzleWorkspaceProps> = ({
  challenge,
  onSolve,
  disabled = false
}) => {
  const [selectedOp, setSelectedOp] = useState<string>('');
  const visualData = challenge.visualData;

  const handleSubmit = () => {
    if (!selectedOp) return;
    onSolve(selectedOp);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-violet-500/30 rounded-lg p-5 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 text-cyan-400 font-cyber font-bold text-sm tracking-wide">
        <GitBranch className="w-4 h-4" />
        <span>INTERACTIVE DATA STRUCTURE MATRIX</span>
      </div>

      <div className="text-slate-300 text-sm mb-4 bg-slate-900/60 p-3 rounded border border-slate-800">
        <div className="font-semibold text-white mb-1">{challenge.prompt}</div>
        {visualData && (
          <div className="text-xs text-cyan-300 font-mono mt-1">
            Goal: {visualData.instruction}
          </div>
        )}
      </div>

      {/* Visual Workspace Canvas */}
      {visualData?.puzzleType === 'bst_insert' && (
        <div className="my-auto py-6 flex flex-col items-center justify-center bg-slate-900/40 rounded-lg border border-cyan-500/20 relative">
          <div className="text-xs font-mono text-slate-400 mb-4">
            Candidate to Insert: <span className="text-amber-400 font-bold text-base px-2 py-0.5 bg-amber-400/10 rounded border border-amber-400/40">[{visualData.initialState.candidateToInsert}]</span>
          </div>

          {/* Tree Node Hierarchy */}
          <div className="flex flex-col items-center gap-6">
            {/* Root */}
            <div className="w-12 h-12 rounded-full bg-violet-600/30 border-2 border-violet-400 flex items-center justify-center text-white font-bold font-mono shadow-lg shadow-violet-500/20">
              {visualData.initialState.root}
            </div>

            {/* Level 1 */}
            <div className="flex gap-20">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-cyan-600/30 border-2 border-cyan-400 flex items-center justify-center text-white font-bold font-mono">
                  10
                </div>
                {/* Potential Insertion Slots */}
                <div className="flex gap-6 mt-4">
                  <button
                    onClick={() => setSelectedOp('left_of_5')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                      selectedOp === 'left_of_5'
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 scale-105'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    + Left of 5
                  </button>
                  <button
                    onClick={() => setSelectedOp('right_of_10')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                      selectedOp === 'right_of_10'
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 scale-105'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    + Right of 10
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-violet-600/30 border-2 border-violet-400 flex items-center justify-center text-white font-bold font-mono">
                  30
                </div>
                <div className="flex gap-6 mt-4">
                  <button
                    onClick={() => setSelectedOp('left_of_30')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                      selectedOp === 'left_of_30'
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 scale-105'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    + Left of 30
                  </button>
                  <button
                    onClick={() => setSelectedOp('right_of_40')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-all ${
                      selectedOp === 'right_of_40'
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 scale-105'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    + Right of 40
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {visualData?.puzzleType === 'linked_list_pointer' && (
        <div className="my-auto py-8 flex flex-col items-center justify-center bg-slate-900/40 rounded-lg border border-cyan-500/20">
          <div className="flex items-center gap-3 font-mono text-base font-bold text-slate-200 mb-6">
            <span className="px-3 py-1.5 bg-violet-900/50 border border-violet-500 rounded">Node [A]</span>
            <ArrowRight className="text-cyan-400" />
            <span className="px-3 py-1.5 bg-cyan-900/50 border border-cyan-400 rounded ring-2 ring-cyan-400/50">Node [B] (curr)</span>
            <ArrowRight className="text-cyan-400" />
            <span className="px-3 py-1.5 bg-violet-900/50 border border-violet-500 rounded">Node [C]</span>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {challenge.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedOp(opt)}
                disabled={disabled}
                className={`p-3 text-xs font-mono rounded border transition-all text-left flex items-center justify-between ${
                  selectedOp === opt
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{opt}</span>
                {selectedOp === opt && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-400 font-mono">
          Selected Operation: <strong className="text-cyan-300">{selectedOp || 'None'}</strong>
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selectedOp || disabled}
          className="cyber-btn cyber-btn-cyan px-6 py-2 text-xs"
        >
          EXECUTE IN ARENA
        </button>
      </div>
    </div>
  );
};
