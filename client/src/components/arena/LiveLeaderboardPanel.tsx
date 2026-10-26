import React from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { Trophy, Skull, Bot } from 'lucide-react';

export const LiveLeaderboardPanel: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);

  if (!activeRoom) return null;

  const leaderboard = activeRoom.leaderboard || [];

  return (
    <div className="w-64 max-h-72 clutch-panel-elevated rounded-xl p-3 shadow-xl select-none flex flex-col font-sans">
      <div className="flex items-center justify-between border-b border-clutch-border pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-cyber font-bold text-clutch-amber">
          <Trophy className="w-3.5 h-3.5" />
          <span>ARENA STANDINGS</span>
        </div>
        <span className="text-[10px] font-mono text-clutch-muted">
          {leaderboard.length} Combatants
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
        {leaderboard.map((player) => {
          const participant = activeRoom.participants[player.id];
          const isMe = player.id === userProfile.id;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                player.isEliminated
                  ? 'bg-clutch-rose/10 border border-clutch-rose/30 text-clutch-rose opacity-60'
                  : isMe
                  ? 'bg-clutch-violet/20 border border-clutch-violet text-white font-bold shadow-sm'
                  : 'bg-clutch-surface-light border border-clutch-border text-clutch-muted'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-4 text-[10px] font-mono text-center font-bold ${
                  player.rank === 1
                    ? 'text-clutch-amber'
                    : player.rank === 2
                    ? 'text-slate-300'
                    : player.rank === 3
                    ? 'text-amber-600'
                    : 'text-clutch-subtle'
                }`}>
                  #{player.rank}
                </span>

                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: participant?.loadout?.color || '#7c3aed' }}
                />

                <span className="truncate max-w-[90px]">{player.username}</span>

                {participant?.isBot && (
                  <span title="AI Bot"><Bot className="w-3 h-3 text-clutch-amber" /></span>
                )}

                {player.isEliminated && (
                  <Skull className="w-3 h-3 text-clutch-rose shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1.5 font-mono text-right">
                {player.combo > 1 && !player.isEliminated && (
                  <span className="text-[10px] text-clutch-lavender font-bold">x{player.combo}</span>
                )}
                <span className="text-white font-bold">{player.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
