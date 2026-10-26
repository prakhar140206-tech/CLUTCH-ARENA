import React, { useState, useEffect } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { ArrowUpDown, ChevronUp, ChevronDown, Check, RotateCcw } from 'lucide-react';

interface ArrangeStepsWorkspaceProps {
  challenge: ClientChallenge;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}

export const ArrangeStepsWorkspace: React.FC<ArrangeStepsWorkspaceProps> = ({
  challenge,
  onSubmit,
  disabled = false
}) => {
  const initialItems = challenge.arrangeStepsData?.items || [];
  const [items, setItems] = useState<Array<{ id: string; text: string; code?: string }>>([]);

  useEffect(() => {
    // Start with a shuffled order so user arranges them
    const shuffled = [...initialItems].sort(() => 0.5 - Math.random());
    setItems(shuffled);
  }, [challenge.id]);

  const moveItem = (index: number, direction: -1 | 1) => {
    if (disabled) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setItems(copy);
  };

  const handleReset = () => {
    setItems([...initialItems].sort(() => 0.5 - Math.random()));
  };

  const handleSubmit = () => {
    const orderIds = items.map(item => item.id);
    onSubmit(orderIds);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-cyan-500/30 rounded-xl p-5 overflow-hidden">
      {/* Header */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-950/40 via-gray-900 to-purple-950/40 border border-cyan-500/20 rounded-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
            <ArrowUpDown className="w-3.5 h-3.5" /> Chronological Step Sequencer
          </span>
          <p className="text-sm font-medium text-gray-200 mt-1">{challenge.prompt}</p>
        </div>
        <button
          onClick={handleReset}
          disabled={disabled}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" /> Shuffle
        </button>
      </div>

      {/* Step Sequence Cards */}
      <div className="flex-1 space-y-2.5 overflow-y-auto py-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 flex items-center justify-between transition hover:border-cyan-500/40"
          >
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs shadow">
                {idx + 1}
              </span>
              <div>
                <p className="text-xs font-medium text-gray-200">{item.text}</p>
                {item.code && (
                  <pre className="text-[11px] font-mono text-cyan-300 mt-1 bg-black/40 px-2 py-0.5 rounded">
                    {item.code}
                  </pre>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => moveItem(idx, -1)}
                disabled={disabled || idx === 0}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 hover:text-white transition"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveItem(idx, 1)}
                disabled={disabled || idx === items.length - 1}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 hover:text-white transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
        <span className="text-xs font-mono text-gray-400">
          Total Steps: <strong className="text-cyan-400">{items.length}</strong>
        </span>
        <button
          onClick={handleSubmit}
          disabled={disabled || items.length === 0}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Confirm Step Order
        </button>
      </div>
    </div>
  );
};
