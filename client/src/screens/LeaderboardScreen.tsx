import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { soundSynth } from '../services/soundSynth.js';
import { API_BASE_URL } from '../config/api.js';
import { Trophy, Shield, Swords, Sparkles, User, ExternalLink } from 'lucide-react';

export const LeaderboardScreen: React.FC = () => {
  const userProfile = useGameStore((s) => s.userProfile);
  const setScreen = useGameStore((s) => s.setScreen);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          if (data.leaderboard && isMounted) {
            setLeaderboard(data.leaderboard);
          }
        }
      } catch {
        // Fallback default mock
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const defaultMockLeaderboard = [
    { id: '1', username: 'cyber_knight', ratingMMR: 2890, rankTier: 'Grandmaster', avatar: { color: '#06b6d4' } },
    { id: '2', username: 'void_pointer', ratingMMR: 2840, rankTier: 'Master Mind', avatar: { color: '#10b981' } },
    { id: '3', username: 'user_name', ratingMMR: 2710, rankTier: 'Apex Solver', avatar: { color: '#8b5cf6' } },
    { id: '4', username: userProfile.username || 'GR36_99', ratingMMR: 2140, rankTier: 'Grandmaster', avatar: { color: '#22c55e' } },
    { id: '5', username: 'void_pointer', ratingMMR: 2840, rankTier: 'Master Mind', avatar: { color: '#10b981' } },
    { id: '6', username: 'user_name', ratingMMR: 2710, rankTier: 'Apex Solver', avatar: { color: '#8b5cf6' } },
    { id: '7', username: 'user_name', ratingMMR: 2710, rankTier: 'Apex Solver', avatar: { color: '#8b5cf6' } },
    { id: '8', username: 'GR36_99', ratingMMR: 2140, rankTier: 'Grandmaster', avatar: { color: '#22c55e' } }
  ];

  const dataList = leaderboard.length >= 3 ? leaderboard : defaultMockLeaderboard;
  const top1 = dataList[0];
  const top2 = dataList[1];
  const top3 = dataList[2];
  const remainingList = dataList.slice(3);

  return (
    <AppShell activeScreen="leaderboard">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans pb-8">
        {/* Title Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-cyber font-black text-xl sm:text-2xl text-white tracking-wider uppercase">
            GLOBAL LEADERBOARD
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            SEASON 4 RANKED ARENA
          </span>
        </div>

        {/* =========================================================
            TOP 3 PODIUM CARDS (Exact match: #2 Silver, #1 Gold, #3 Bronze)
            ========================================================= */}
        {/* =========================================================
            TOP 3 PODIUM CARDS (Side-by-side Olympic podium on mobile & desktop)
            ========================================================= */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end mt-1 sm:mt-2">
          {/* #2 Silver Podium (Left) */}
          {top2 && (
            <div className="rounded-xl sm:rounded-2xl bg-[#0f151c]/95 border border-slate-400/30 p-2.5 sm:p-5 flex flex-col items-center justify-between h-40 sm:h-56 shadow-[0_8px_30px_rgba(0,0,0,0.6)] relative order-1">
              <span className="font-cyber font-black text-xs sm:text-sm text-slate-300">#2</span>

              {/* Silver Wreath / Emblem */}
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-slate-800/80 border-2 border-slate-300 flex items-center justify-center font-bold text-sm sm:text-xl text-white shadow-[0_0_15px_rgba(203,213,225,0.4)] my-1">
                <span className="text-base sm:text-2xl">🥈</span>
              </div>

              <div className="flex flex-col items-center text-center w-full min-w-0">
                <span className="font-cyber font-black text-xs sm:text-sm text-white truncate max-w-full">{top2.username}</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 mt-0.5">
                  {top2.ratingMMR} <span className="hidden sm:inline">ELO</span>
                </span>
              </div>
            </div>
          )}

          {/* #1 Champion Gold Podium (Center, Elevated) */}
          {top1 && (
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#1c1810] to-[#0f151c] border-2 border-amber-400/60 p-2.5 sm:p-6 flex flex-col items-center justify-between h-48 sm:h-64 shadow-[0_10px_40px_rgba(234,179,8,0.25)] relative order-2 -translate-y-2 sm:-translate-y-3">
              <div className="px-2 sm:px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-cyber font-black text-[8px] sm:text-[10px] tracking-wider uppercase shadow">
                👑 #1
              </div>

              {/* Gold Laurel Wreath / Emblem */}
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 border-2 border-amber-200 flex items-center justify-center font-bold text-lg sm:text-2xl text-slate-950 shadow-[0_0_25px_rgba(234,179,8,0.6)] my-1">
                <span className="text-xl sm:text-3xl">🥇</span>
              </div>

              <div className="flex flex-col items-center text-center w-full min-w-0">
                <span className="font-cyber font-black text-xs sm:text-base text-amber-300 tracking-wide truncate max-w-full">
                  {top1.username}
                </span>
                <span className="text-[11px] sm:text-sm font-mono font-black text-amber-200 mt-0.5">
                  {top1.ratingMMR} <span className="hidden sm:inline">ELO</span>
                </span>
              </div>
            </div>
          )}

          {/* #3 Bronze Podium (Right) */}
          {top3 && (
            <div className="rounded-xl sm:rounded-2xl bg-[#0f151c]/95 border border-amber-700/30 p-2.5 sm:p-5 flex flex-col items-center justify-between h-36 sm:h-52 shadow-[0_8px_30px_rgba(0,0,0,0.6)] relative order-3">
              <span className="font-cyber font-black text-xs sm:text-sm text-amber-600">#3</span>

              {/* Bronze Wreath / Emblem */}
              <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-amber-950/60 border-2 border-amber-600 flex items-center justify-center font-bold text-xs sm:text-lg text-white shadow-[0_0_15px_rgba(180,83,9,0.3)] my-1">
                <span className="text-sm sm:text-xl">🥉</span>
              </div>

              <div className="flex flex-col items-center text-center w-full min-w-0">
                <span className="font-cyber font-black text-xs sm:text-sm text-white truncate max-w-full">{top3.username}</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 mt-0.5">
                  {top3.ratingMMR} <span className="hidden sm:inline">ELO</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            FULL RANKING TABLE (Columns: #, USER, ELO, STATUS, VIEW PROFILE)
            ========================================================= */}
        <div className="rounded-2xl bg-[#0f151c]/95 border border-white/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-[#141b22] text-[10px] sm:text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-cyber">#</th>
                  <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-cyber">USER</th>
                  <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-cyber">ELO</th>
                  <th className="py-3.5 px-4 font-cyber">STATUS</th>
                  <th className="py-3.5 px-4 font-cyber text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {remainingList.map((player, idx) => {
                  const rankNum = idx + 4;
                  const isCurrent = player.username === userProfile.username;

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors hover:bg-white/5 ${
                        isCurrent ? 'bg-emerald-950/20 font-bold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-cyber font-bold text-slate-400">
                        {rankNum}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white border border-white/10"
                            style={{ backgroundColor: player.avatar?.color || '#10b981' }}
                          >
                            {player.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-cyber font-bold text-white">
                            {player.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {player.ratingMMR} ELO
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                          ONLINE
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            soundSynth.click();
                            setScreen('profile');
                          }}
                          className="px-3 py-1 rounded-lg bg-[#141b22] border border-white/10 hover:border-emerald-500/40 text-[11px] font-cyber font-bold text-slate-300 hover:text-white transition-all"
                        >
                          VIEW PROFILE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
