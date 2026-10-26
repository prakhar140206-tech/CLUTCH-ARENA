import React, { useState, useEffect } from 'react';
import { ClientChallenge } from '../../../../shared/types.js';
import { Eye, Pointer, RotateCcw, Check, Sparkles, Layers } from 'lucide-react';

interface InteractiveArrayWorkspaceProps {
  challenge: ClientChallenge;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}

export const InteractiveArrayWorkspace: React.FC<InteractiveArrayWorkspaceProps> = ({
  challenge,
  onSubmit,
  disabled = false
}) => {
  const arrayData = challenge.interactiveArrayData;
  const initialArray = (arrayData?.initialArray as number[] | string[]) || [1, 2, 3, 4, 5];

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const [pointers, setPointers] = useState<Array<{ id: string; label: string; index: number; color: string }>>([
    { id: 'left', label: 'L', index: 0, color: '#38bdf8' },
    { id: 'right', label: 'R', index: initialArray.length - 1, color: '#a855f7' }
  ]);

  useEffect(() => {
    setSelectedIndices([]);
    setStartIndex(null);
    setEndIndex(null);
    if (arrayData?.pointers) {
      setPointers(
        arrayData.pointers.map(p => ({
          id: p.id,
          label: p.label,
          index: p.initialIndex,
          color: p.color || '#38bdf8'
        }))
      );
    }
  }, [challenge.id]);

  const handleCellClick = (idx: number) => {
    if (disabled) return;

    if (arrayData?.actionType === 'select_subarray') {
      if (startIndex === null || (startIndex !== null && endIndex !== null)) {
        setStartIndex(idx);
        setEndIndex(null);
      } else {
        if (idx >= startIndex) {
          setEndIndex(idx);
        } else {
          setStartIndex(idx);
          setEndIndex(null);
        }
      }
    } else {
      // Toggle index in set
      if (selectedIndices.includes(idx)) {
        setSelectedIndices(selectedIndices.filter(i => i !== idx));
      } else {
        setSelectedIndices([...selectedIndices, idx]);
      }
    }
  };

  const movePointer = (pointerId: string, direction: -1 | 1) => {
    if (disabled) return;
    setPointers(prev =>
      prev.map(p => {
        if (p.id === pointerId) {
          const nextIdx = Math.max(0, Math.min(initialArray.length - 1, p.index + direction));
          return { ...p, index: nextIdx };
        }
        return p;
      })
    );
  };

  const handleReset = () => {
    setSelectedIndices([]);
    setStartIndex(null);
    setEndIndex(null);
  };

  const handleSubmit = () => {
    if (arrayData?.actionType === 'select_subarray') {
      onSubmit({ startIndex, endIndex });
    } else if (arrayData?.actionType === 'move_pointers') {
      const pointerMap = pointers.reduce((acc, p) => ({ ...acc, [p.id]: p.index }), {});
      onSubmit(pointerMap);
    } else {
      onSubmit({ selectedIndices });
    }
  };

  const isSubarraySelected = (idx: number) => {
    if (startIndex !== null && endIndex !== null) {
      return idx >= startIndex && idx <= endIndex;
    }
    return idx === startIndex;
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-cyan-500/30 rounded-xl p-5 overflow-hidden">
      {/* Target Mission Prompt */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-950/40 via-gray-900 to-purple-950/40 border border-cyan-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" /> Interactive 3D Array Mission
          </span>
          <button
            onClick={handleReset}
            disabled={disabled}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <p className="text-sm font-medium text-gray-200 mt-1">
          {arrayData?.targetDescription || challenge.prompt}
        </p>
      </div>

      {/* 3D Visual Array Blocks */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 overflow-x-auto min-h-[160px]">
        <div className="flex items-center space-x-2.5 p-4 bg-gray-950/60 border border-gray-800/80 rounded-2xl shadow-inner shadow-black">
          {initialArray.map((val, idx) => {
            const inSubarray = isSubarraySelected(idx);
            const isSingleSelected = selectedIndices.includes(idx);
            const activePointers = pointers.filter(p => p.index === idx);

            return (
              <div key={idx} className="flex flex-col items-center space-y-2">
                {/* Pointer Indicators Above */}
                <div className="h-6 flex items-center justify-center space-x-1">
                  {activePointers.map(p => (
                    <span
                      key={p.id}
                      style={{ backgroundColor: p.color }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-black shadow-md uppercase animate-bounce"
                    >
                      {p.label}
                    </span>
                  ))}
                </div>

                {/* 3D Cell Block */}
                <button
                  onClick={() => handleCellClick(idx)}
                  disabled={disabled}
                  className={`w-14 h-16 rounded-xl font-mono text-base font-bold flex flex-col items-center justify-center transition-all duration-200 transform hover:-translate-y-1 shadow-lg ${
                    inSubarray || isSingleSelected
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 text-black border-2 border-cyan-200 shadow-cyan-500/40 scale-105'
                      : 'bg-gradient-to-t from-gray-900 to-gray-800 text-cyan-300 border border-gray-700 hover:border-cyan-500/60'
                  }`}
                >
                  <span>{val}</span>
                </button>

                {/* 0-Based Index Label */}
                <span className="text-[11px] font-mono text-gray-500">[{idx}]</span>
              </div>
            );
          })}
        </div>

        {/* Pointer Controls (if actionType is move_pointers) */}
        {arrayData?.actionType === 'move_pointers' && (
          <div className="flex items-center space-x-6 mt-4">
            {pointers.map(p => (
              <div key={p.id} className="flex items-center space-x-2 bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                <span className="text-xs font-mono font-bold" style={{ color: p.color }}>
                  {p.label}: [{p.index}]
                </span>
                <button
                  onClick={() => movePointer(p.id, -1)}
                  disabled={disabled || p.index <= 0}
                  className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-mono text-white transition disabled:opacity-40"
                >
                  ◀
                </button>
                <button
                  onClick={() => movePointer(p.id, 1)}
                  disabled={disabled || p.index >= initialArray.length - 1}
                  className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-mono text-white transition disabled:opacity-40"
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
        <div className="text-xs font-mono text-gray-400">
          {arrayData?.actionType === 'select_subarray' && (
            <span>
              Selected Range:{' '}
              <strong className="text-cyan-400">
                {startIndex !== null ? `[${startIndex}` : '[__'},{' '}
                {endIndex !== null ? `${endIndex}]` : '__]'}
              </strong>
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled || (arrayData?.actionType === 'select_subarray' && (startIndex === null || endIndex === null))}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Submit Interaction
        </button>
      </div>
    </div>
  );
};
