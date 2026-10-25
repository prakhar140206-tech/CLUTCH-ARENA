import React from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { Trophy, Skull, Bot } from 'lucide-react';

export const LiveLeaderboardPanel: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);

  if (!activeRoom) return null;

  const leaderboard = activeRoom.leaderboard || [];

  return (
    <div className="w-64 max-h-72 bg-slate-950/85 border border-violet-500/30 rounded-lg p-3 backdrop-blur-md flex flex-col shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-violet-500/20 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-cyber font-bold text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span>ARENA STANDINGS</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {leaderboard.length} Combatants
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {leaderboard.map((player) => {
          const participant = activeRoom.participants[player.id];
          const isMe = player.id === userProfile.id;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-1.5 rounded text-xs transition-all ${
                player.isEliminated
                  ? 'bg-red-950/30 border border-red-900/40 text-red-400 opacity-60'
                  : isMe
                  ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-4 text-[10px] font-mono text-center font-bold ${
                  player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-slate-300' : player.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  #{player.rank}
                </span>

                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: participant?.loadout?.color || '#8B5CF6' }}
                />

                <span className="truncate max-w-[90px]">{player.username}</span>

                {participant?.isBot && (
                  <span title="AI Bot"><Bot className="w-3 h-3 text-amber-400" /></span>
                )}

                {player.isEliminated && (
                  <Skull className="w-3 h-3 text-red-500 shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1.5 font-mono text-right">
                {player.combo > 1 && !player.isEliminated && (
                  <span className="text-[10px] text-purple-400 font-bold">x{player.combo}</span>
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
