import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { soundSynth } from '../../services/soundSynth.js';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, ArrowRight, Sparkles, Zap, Clock, Flame } from 'lucide-react';
import { GrandmasterBadge } from '../ui/GrandmasterBadge.js';

export const RoundReviewOverlay: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const lastResult = useGameStore((s) => s.lastSubmissionResult);
  const userProfile = useGameStore((s) => s.userProfile);
  const setScreen = useGameStore((s) => s.setScreen);

  const isMatchEnded = activeRoom?.status === 'match_ended';
  const top10 = activeRoom?.leaderboard?.slice(0, 10) || [];
  const winner = top10[0];
  const myEntry = activeRoom?.leaderboard?.find((p) => p.id === userProfile.id);
  const isMeWinner = winner?.id === userProfile.id || !activeRoom;

  useEffect(() => {
    if (!activeRoom) return;

    if (isMatchEnded) {
      soundSynth.airhorn();
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
    } else if (activeRoom.status === 'round_review' && lastResult) {
      if (lastResult.isCorrect) {
        soundSynth.auraGlow();
      } else {
        soundSynth.vineBoom();
      }
    }
  }, [activeRoom?.status, lastResult]);

  if (!activeRoom || (activeRoom.status !== 'round_review' && activeRoom.status !== 'match_ended')) {
    return null;
  }

  const handleReturnToLobby = () => {
    soundSynth.click();
    setScreen('lobby');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-300 select-none overflow-y-auto font-sans">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0f151c]/95 border border-emerald-500/40 p-6 sm:p-8 flex flex-col items-center text-center my-auto shadow-[0_12px_45px_rgba(0,0,0,0.9),0_0_35px_rgba(34,197,94,0.25)] relative overflow-hidden">
        {/* =========================================================
            VICTORY SCREEN (Exact match with Image 3 Top-Right)
            ========================================================= */}
        {isMatchEnded ? (
          <div className="w-full flex flex-col items-center">
            {/* Top Wings & Glowing Trophy Cup */}
            <div className="relative mb-2 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-300 border-2 border-amber-200 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.7)] text-slate-950 z-10">
                <Trophy className="w-10 h-10 fill-current" />
              </div>
            </div>

            {/* "VICTORY" Metallic Typography */}
            <h1 className="font-cyber font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-cyan-300 tracking-widest uppercase mb-1 drop-shadow-[0_4px_15px_rgba(234,179,8,0.5)]">
              VICTORY
            </h1>

            {/* +24 ELO Badge & Rating */}
            <div className="flex flex-col items-center my-3">
              <span className="font-cyber font-black text-xl sm:text-2xl text-emerald-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                +24 ELO
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 mt-0.5">
                NEW RATING: <strong className="text-white">2164 ELO</strong>
              </span>

              {/* Grandmaster Laurel Wings */}
              <div className="mt-2 scale-90">
                <GrandmasterBadge
                  elo={2164}
                  rankTitle="GRANDMASTER"
                  size="sm"
                />
              </div>
            </div>

            {/* Match Summary & Match Telemetry (Two Columns) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 text-left">
              {/* Left Column: Match Summary */}
              <div className="p-4 rounded-xl bg-[#141b22] border border-white/10 flex flex-col justify-between gap-3">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Match summary
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center font-bold text-xs text-cyan-300">
                    C
                  </div>
                  <div className="flex flex-col">
                    <span className="font-cyber font-bold text-xs text-white">
                      cyber_knight
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      2890 ELO
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex flex-col gap-1 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Match Type</span>
                    <span className="text-white font-bold">Grandmaster Vector</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date</span>
                    <span className="text-slate-300">Oct 27, 2026</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Match Telemetry */}
              <div className="p-4 rounded-xl bg-[#141b22] border border-white/10 flex flex-col justify-between gap-3">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Match telemetry
                </span>

                {/* Accuracy Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Accuracy</span>
                    <span className="text-emerald-400 font-bold">94%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="w-[94%] h-full bg-gradient-to-r from-emerald-500 to-lime-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  </div>
                </div>

                {/* Speed Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Speed</span>
                    <span className="text-cyan-400 font-bold">88%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="w-[88%] h-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  </div>
                </div>

                {/* Problems Solved */}
                <div className="flex justify-between text-[11px] font-mono pt-1">
                  <span className="text-slate-400">Problems Solved</span>
                  <span className="text-white font-bold">5/5</span>
                </div>
              </div>
            </div>

            {/* Giant RETURN TO LOBBY Neon Button */}
            <button
              onClick={handleReturnToLobby}
              className="clutch-btn-neon px-10 py-3.5 text-sm font-black tracking-wider uppercase mt-2 shadow-[0_0_25px_rgba(34,197,94,0.45)]"
            >
              RETURN TO LOBBY
            </button>
          </div>
        ) : (
          /* =========================================================
              PER-ROUND REVIEW (Quick transition between rounds)
              ========================================================= */
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              {lastResult?.isCorrect ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <Sparkles className="w-8 h-8 text-cyan-400" />
              )}
            </div>

            <h3 className="font-cyber font-black text-xl text-white tracking-wider uppercase mb-1">
              {lastResult?.isCorrect ? 'ACCEPTED' : 'ROUND REVIEW'}
            </h3>

            <p className="text-xs font-mono text-slate-300 mb-4">
              +{lastResult?.pointsAwarded || 120} Aura Points Awarded
            </p>

            {lastResult?.explanation && (
              <div className="w-full p-3 rounded-xl bg-[#141b22] border border-white/10 text-left font-mono text-xs text-slate-300 mb-4">
                <strong className="text-emerald-400">Analysis:</strong> {lastResult.explanation}
              </div>
            )}

            <span className="text-[11px] font-mono text-slate-500 animate-pulse">
              Next question delivering in 1.5s...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
