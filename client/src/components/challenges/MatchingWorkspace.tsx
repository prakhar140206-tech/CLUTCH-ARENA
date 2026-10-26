import React, { useState, useEffect } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { Link2, RotateCcw, Check, ArrowRight } from 'lucide-react';

interface MatchingWorkspaceProps {
  challenge: ClientChallenge;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}

export const MatchingWorkspace: React.FC<MatchingWorkspaceProps> = ({
  challenge,
  onSubmit,
  disabled = false
}) => {
  const matchData = challenge.matchingData;
  const leftItems = matchData?.leftColumn || [];
  const rightItems = matchData?.rightColumn || [];

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({}); // leftId -> rightId

  useEffect(() => {
    setSelectedLeft(null);
    setPairs({});
  }, [challenge.id]);

  const handleLeftClick = (id: string) => {
    if (disabled) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id: string) => {
    if (disabled) return;
    if (selectedLeft) {
      setPairs(prev => ({
        ...prev,
        [selectedLeft]: id
      }));
      setSelectedLeft(null);
    }
  };

  const removePair = (leftId: string) => {
    if (disabled) return;
    setPairs(prev => {
      const copy = { ...prev };
      delete copy[leftId];
      return copy;
    });
  };

  const handleSubmit = () => {
    const formatted = Object.entries(pairs).map(([leftId, rightId]) => ({
      leftId,
      rightId
    }));
    onSubmit(formatted);
  };

  const isPairedRight = (rightId: string) => {
    return Object.values(pairs).includes(rightId);
  };

  const getPairedLeftText = (rightId: string) => {
    const entry = Object.entries(pairs).find(([_, rId]) => rId === rightId);
    if (!entry) return null;
    const leftItem = leftItems.find(l => l.id === entry[0]);
    return leftItem ? leftItem.text : null;
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-cyan-500/30 rounded-xl p-3.5 sm:p-5 overflow-y-auto font-sans">
      {/* Header */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-950/40 via-gray-900 to-purple-950/40 border border-cyan-500/20 rounded-lg flex items-center justify-between shrink-0">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Link2 className="w-3.5 h-3.5" /> Concept Matching Matrix
          </span>
          <p className="text-sm font-medium text-gray-200 mt-1">{challenge.prompt}</p>
        </div>
        <button
          onClick={() => setPairs({})}
          disabled={disabled || Object.keys(pairs).length === 0}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition disabled:opacity-40 min-h-[36px] px-2"
        >
          <RotateCcw className="w-3 h-3" /> Clear Pairs
        </button>
      </div>

      {/* Two Matching Columns (Responsive single-column on narrow mobile) */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 py-2">
        {/* Left Column */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase text-gray-400 block px-1">Source Concepts</span>
          {leftItems.map(item => {
            const isSelected = selectedLeft === item.id;
            const pairedRightId = pairs[item.id];
            const pairedRightItem = rightItems.find(r => r.id === pairedRightId);

            return (
              <div
                key={item.id}
                onClick={() => handleLeftClick(item.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/50 text-white shadow-lg shadow-cyan-500/20'
                    : pairedRightId
                    ? 'border-green-500/50 bg-green-950/20 text-gray-200'
                    : 'border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">{item.text}</span>
                  {pairedRightItem && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); removePair(item.id); }}
                      className="text-[10px] text-green-400 hover:text-red-400 font-mono transition"
                    >
                      Linked ✕
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase text-gray-400 block px-1">Target Definitions / Complexities</span>
          {rightItems.map(item => {
            const isPaired = isPairedRight(item.id);
            const pairedLeftText = getPairedLeftText(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleRightClick(item.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedLeft
                    ? 'border-purple-500/80 bg-purple-950/30 text-white animate-pulse'
                    : isPaired
                    ? 'border-green-500/50 bg-green-950/20 text-gray-200'
                    : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{item.text}</span>
                  {pairedLeftText && (
                    <span className="text-[10px] font-mono text-green-400">
                      ← {pairedLeftText.slice(0, 16)}...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2 shrink-0 z-20 relative">
        <span className="text-xs font-mono text-gray-400">
          Matched: <strong className="text-cyan-400">{Object.keys(pairs).length}</strong> of {leftItems.length}
        </span>
        <button
          onClick={handleSubmit}
          disabled={disabled || Object.keys(pairs).length === 0}
          className="px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none shrink-0"
        >
          <Check className="w-4 h-4" /> Submit Matches
        </button>
      </div>
    </div>
  );
};
