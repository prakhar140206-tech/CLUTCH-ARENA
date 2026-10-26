import React, { useState } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { GitBranch, CheckCircle2, XCircle, ArrowRight, Send } from 'lucide-react';

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
    <div className="flex flex-col h-full clutch-panel rounded-2xl overflow-y-auto p-3.5 sm:p-6 font-sans border border-clutch-border">
      <div className="flex items-center gap-2 mb-3 text-clutch-lavender font-cyber font-bold text-xs sm:text-sm tracking-wide">
        <GitBranch className="w-4 h-4" />
        <span>INTERACTIVE DATA STRUCTURE MATRIX</span>
      </div>

      <div className="text-slate-200 text-xs sm:text-sm mb-4 bg-clutch-surface-light p-3.5 rounded-xl border border-clutch-border">
        <div className="font-semibold text-white mb-1">{challenge.prompt}</div>
        {visualData && (
          <div className="text-xs text-clutch-lavender font-mono mt-1">
            Goal: {visualData.instruction}
          </div>
        )}
      </div>

      {/* Visual Workspace Canvas */}
      {visualData?.puzzleType === 'bst_insert' && (
        <div className="my-auto py-8 flex flex-col items-center justify-center bg-clutch-bg rounded-xl border border-clutch-border relative">
          <div className="text-xs font-mono text-clutch-muted mb-6">
            Candidate to Insert: <span className="text-clutch-amber font-bold text-sm px-2.5 py-1 bg-clutch-amber/10 rounded-lg border border-clutch-amber/30">[{visualData.initialState.candidateToInsert}]</span>
          </div>

          {/* Tree Node Hierarchy */}
          <div className="flex flex-col items-center gap-6">
            {/* Root */}
            <div className="w-12 h-12 rounded-xl bg-clutch-violet/30 border-2 border-clutch-violet flex items-center justify-center text-white font-bold font-mono shadow-lg">
              {visualData.initialState.root}
            </div>

            {/* Level 1 */}
            <div className="flex gap-16 sm:gap-24">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-clutch-surface-elevated border-2 border-clutch-violet/50 flex items-center justify-center text-white font-bold font-mono">
                  10
                </div>
                {/* Potential Insertion Slots */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setSelectedOp('left_of_5')}
                    disabled={disabled}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      selectedOp === 'left_of_5'
                        ? 'bg-clutch-violet text-white font-bold border-clutch-lavender shadow'
                        : 'bg-clutch-surface-light text-clutch-muted border-clutch-border hover:border-clutch-violet'
                    }`}
                  >
                    + Left of 5
                  </button>
                  <button
                    onClick={() => setSelectedOp('right_of_10')}
                    disabled={disabled}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      selectedOp === 'right_of_10'
                        ? 'bg-clutch-violet text-white font-bold border-clutch-lavender shadow'
                        : 'bg-clutch-surface-light text-clutch-muted border-clutch-border hover:border-clutch-violet'
                    }`}
                  >
                    + Right of 10
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-clutch-surface-elevated border-2 border-clutch-violet/50 flex items-center justify-center text-white font-bold font-mono">
                  30
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setSelectedOp('left_of_30')}
                    disabled={disabled}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      selectedOp === 'left_of_30'
                        ? 'bg-clutch-violet text-white font-bold border-clutch-lavender shadow'
                        : 'bg-clutch-surface-light text-clutch-muted border-clutch-border hover:border-clutch-violet'
                    }`}
                  >
                    + Left of 30
                  </button>
                  <button
                    onClick={() => setSelectedOp('right_of_30')}
                    disabled={disabled}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      selectedOp === 'right_of_30'
                        ? 'bg-clutch-violet text-white font-bold border-clutch-lavender shadow'
                        : 'bg-clutch-surface-light text-clutch-muted border-clutch-border hover:border-clutch-violet'
                    }`}
                  >
                    + Right of 30
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allowed Operations Fallback if other puzzle type */}
      {visualData?.puzzleType !== 'bst_insert' && visualData?.allowedOperations && (
        <div className="space-y-2.5 my-auto">
          {visualData.allowedOperations.map((op) => (
            <button
              key={op}
              onClick={() => setSelectedOp(op)}
              disabled={disabled}
              className={`w-full p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                selectedOp === op
                  ? 'bg-clutch-violet/20 border-clutch-violet text-white font-bold'
                  : 'bg-clutch-surface-light border-clutch-border text-clutch-muted hover:border-clutch-violet'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Submit */}
      <div className="mt-4 pt-3 border-t border-clutch-border flex items-center justify-between gap-2 shrink-0 z-20 relative">
        <span className="text-xs text-clutch-subtle font-mono truncate max-w-[140px] sm:max-w-xs">
          Slot: <strong className="text-white">{selectedOp || 'None selected'}</strong>
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selectedOp || disabled}
          className="clutch-btn-primary px-5 sm:px-6 py-2.5 min-h-[44px] text-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Commit Pointer</span>
        </button>
      </div>
    </div>
  );
};
