import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { soundSynth } from '../../services/soundSynth.js';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Award, Trophy, ArrowRight, Sparkles, Zap, Clock, Coins, Flame } from 'lucide-react';

export const RoundReviewOverlay: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const lastResult = useGameStore((s) => s.lastSubmissionResult);
  const userProfile = useGameStore((s) => s.userProfile);
  const setScreen = useGameStore((s) => s.setScreen);

  const isMatchEnded = activeRoom?.status === 'match_ended';
  const top10 = activeRoom?.leaderboard?.slice(0, 10) || [];
  const winner = top10[0];
  const myEntry = activeRoom?.leaderboard?.find((p) => p.id === userProfile.id);
  const isMeWinner = winner?.id === userProfile.id;
  const isMeTop10 = myEntry && myEntry.rank <= 10;

  useEffect(() => {
    if (!activeRoom) return;

    if (isMatchEnded) {
      if (isMeWinner) {
        soundSynth.airhorn();
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } });
      } else if (isMeTop10) {
        soundSynth.levelUp();
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      }
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

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-300 select-none overflow-y-auto font-sans">
      <div className={`w-full ${isMatchEnded ? 'max-w-2xl' : 'max-w-lg'} clutch-panel-elevated rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center my-auto`}>
        {isMatchEnded ? (
          <>
            {/* Header / Crown */}
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-clutch-amber/20 border border-clutch-amber/50 flex items-center justify-center text-clutch-amber shadow-lg">
                <Trophy className="w-8 h-8 text-clutch-amber" />
              </div>
              <Sparkles className="w-5 h-5 text-clutch-amber absolute -top-1 -right-2 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-clutch-amber/20 border border-clutch-amber/40 text-clutch-amber font-bold">
                ARENA MATCH CEREMONY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-surface-light text-clutch-lavender border border-clutch-border">
                {activeRoom.settings.totalRounds || 5} ROUNDS
              </span>
            </div>

            <h2 className="font-cyber text-2xl sm:text-3xl font-black text-white tracking-wide mb-1">
              MATCH STANDINGS
            </h2>

            <p className="text-clutch-muted text-xs sm:text-sm mb-6">
              Ranked by <strong className="text-white">Accuracy</strong> &amp; <strong className="text-clutch-lavender">Submission Velocity</strong>
            </p>

            {/* Top 3 Podium Cards */}
            {top10.length >= 2 && (
              <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 mb-6 items-end">
                {/* 2nd Place */}
                {top10[1] && (
                  <div className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border flex flex-col items-center h-36 justify-between">
                    <span className="text-lg">🥈</span>
                    <span className="text-xs font-mono font-bold text-slate-200 truncate w-full">
                      {top10[1].username}
                    </span>
                    <div className="text-[10px] font-mono text-clutch-lavender">
                      {top10[1].correctCount ?? 0}/{activeRoom.settings.totalRounds || 5} Solved
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      {top10[1].score} pts
                    </div>
                  </div>
                )}

                {/* 1st Place Champion */}
                {top10[0] && (
                  <div className="p-3.5 rounded-xl bg-clutch-surface-elevated border border-clutch-amber/60 shadow-lg flex flex-col items-center h-44 justify-between relative scale-105 z-10">
                    <div className="absolute -top-3 px-2 py-0.5 bg-gradient-to-r from-clutch-amber to-amber-400 text-black font-cyber font-bold text-[9px] rounded-full shadow">
                      WINNER 👑
                    </div>
                    <span className="text-2xl mt-1">🥇</span>
                    <span className="text-xs font-mono font-extrabold text-clutch-amber truncate w-full">
                      {top10[0].username}
                    </span>
                    <div className="text-[11px] font-mono font-bold text-clutch-emerald">
                      {top10[0].correctCount ?? 0}/{activeRoom.settings.totalRounds || 5} Solved
                    </div>
                    <div className="text-sm font-cyber font-black text-white">
                      {top10[0].score} pts
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top10[2] && (
                  <div className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border flex flex-col items-center h-32 justify-between">
                    <span className="text-lg">🥉</span>
                    <span className="text-xs font-mono font-bold text-amber-600 truncate w-full">
                      {top10[2].username}
                    </span>
                    <div className="text-[10px] font-mono text-clutch-lavender">
                      {top10[2].correctCount ?? 0}/{activeRoom.settings.totalRounds || 5} Solved
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      {top10[2].score} pts
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authoritative Top 10 Leaderboard Table */}
            <div className="w-full bg-clutch-bg/80 rounded-xl border border-clutch-border p-2.5 mb-6 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-[10px] font-mono text-clutch-subtle px-3 py-1.5 border-b border-clutch-border uppercase tracking-wider">
                <span className="w-8 text-left">Rank</span>
                <span className="flex-1 text-left px-2">Player</span>
                <span className="w-20 text-center">Accuracy</span>
                <span className="w-16 text-right">Score</span>
              </div>

              <div className="space-y-1 mt-1">
                {top10.map((p) => {
                  const isMe = p.id === userProfile.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg font-mono transition-all ${isMe
                          ? 'bg-clutch-violet/20 border border-clutch-violet text-white font-bold'
                          : 'bg-clutch-surface-light/60 text-clutch-muted'
                        }`}
                    >
                      <span className={`w-8 text-left font-bold ${p.rank === 1 ? 'text-clutch-amber' : p.rank === 2 ? 'text-slate-300' : p.rank === 3 ? 'text-amber-600' : 'text-clutch-subtle'
                        }`}>
                        #{p.rank}
                      </span>
                      <span className="flex-1 text-left px-2 truncate flex items-center gap-1.5">
                        <span className="truncate">{p.username}</span>
                        {isMe && <span className="text-[9px] px-1.5 rounded bg-clutch-violet text-white">YOU</span>}
                      </span>
                      <span className="w-20 text-center text-clutch-emerald text-[11px]">
                        {p.correctCount ?? 0}/{activeRoom.settings.totalRounds || 5}
                      </span>
                      <span className="w-16 text-right font-bold text-white">
                        {p.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setScreen('lobby')}
              className="clutch-btn-primary px-8 py-3 text-xs flex items-center gap-2"
            >
              <span>Return to Lobby</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="mb-3">
              {lastResult?.isCorrect ? (
                <div className="w-14 h-14 rounded-2xl bg-clutch-emerald/20 border border-clutch-emerald/40 flex items-center justify-center text-clutch-emerald mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-clutch-rose/20 border border-clutch-rose/40 flex items-center justify-center text-clutch-rose mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>
              )}
            </div>

            <h3 className="font-cyber text-xl font-bold text-white mb-1">
              {lastResult?.isCorrect ? 'CHALLENGE SOLVED' : 'ROUND FINISHED'}
            </h3>

            {lastResult && (
              <div className="flex items-center gap-3 my-4 text-xs font-mono">
                <div className="px-3 py-1.5 bg-clutch-surface-light rounded-lg border border-clutch-border">
                  Points: <strong className="text-clutch-emerald">+{lastResult.pointsAwarded}</strong>
                </div>
                <div className="px-3 py-1.5 bg-clutch-surface-light rounded-lg border border-clutch-border">
                  Combo: <strong className="text-clutch-lavender">x{lastResult.comboMultiplier}</strong>
                </div>
                <div className="px-3 py-1.5 bg-clutch-surface-light rounded-lg border border-clutch-border">
                  Speed: <strong className="text-white">+{lastResult.speedBonus}</strong>
                </div>
              </div>
            )}

            {lastResult?.explanation && (
              <div className="w-full bg-clutch-bg/90 border border-clutch-border p-3.5 rounded-xl text-left text-xs text-clutch-muted mb-5 leading-relaxed font-mono">
                <span className="font-bold text-clutch-lavender block mb-1">Algorithmic Explanation:</span>
                {lastResult.explanation}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-mono text-clutch-muted animate-pulse">
              <span>Next round begins shortly...</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
