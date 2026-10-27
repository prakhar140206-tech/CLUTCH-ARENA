import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { soundSynth } from '../../services/soundSynth.js';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Award, Trophy, ArrowRight, Sparkles, Zap, Clock, Coins, Flame, Lightbulb, Bot } from 'lucide-react';

export const RoundReviewOverlay: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const lastResult = useGameStore((s) => s.lastSubmissionResult);
  const userProfile = useGameStore((s) => s.userProfile);
  const setScreen = useGameStore((s) => s.setScreen);

  const isMatchEnded = activeRoom?.status === 'match_ended';
  const top10: any[] = activeRoom?.leaderboard?.slice(0, 10) || [];
  const winner = top10[0];
  const myEntry = activeRoom?.leaderboard?.find((p) => p.id === userProfile.id);
  const isMeWinner = winner?.id === userProfile.id;
  const isMeTop10 = myEntry && myEntry.rank <= 10;
  const isAIMatch = activeRoom?.settings?.mode === 'ai_arena';

  const activeChallenge = activeRoom?.activeChallenge;
  const explanation = lastResult?.explanation || activeChallenge?.explanation;
  const correctAnswer = activeChallenge?.correctAnswer || (lastResult as any)?.correctAnswer;

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
      <div className={`w-full ${isMatchEnded ? 'max-w-2xl' : 'max-w-lg'} clutch-panel-elevated rounded-2xl p-5 sm:p-8 flex flex-col items-center text-center my-auto border border-violet-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]`}>
        {isMatchEnded ? (
          <>
            {/* Header Trophy */}
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-clutch-amber/20 border border-clutch-amber/50 flex items-center justify-center text-clutch-amber shadow-lg">
                <Trophy className="w-8 h-8 text-clutch-amber" />
              </div>
              <Sparkles className="w-5 h-5 text-clutch-amber absolute -top-1 -right-2 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-clutch-amber/20 border border-clutch-amber/40 text-clutch-amber font-bold">
                ARENA MATCH CEREMONY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-surface-light text-clutch-lavender border border-clutch-border">
                {activeRoom.settings.totalRounds || 5} ROUNDS COMPLETE
              </span>
            </div>

            {/* BOLD WINNER DECLARATION BANNER */}
            <div className="w-full bg-gradient-to-r from-amber-500/25 via-yellow-500/30 to-amber-500/25 border-2 border-amber-400/60 p-3.5 sm:p-4 rounded-2xl mb-4 text-center shadow-[0_0_35px_rgba(245,158,11,0.35)] animate-in zoom-in-95 duration-300">
              <div className="text-[11px] font-mono font-black text-amber-300 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>CHAMPION DECLARED</span>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </div>

              <div className="font-cyber font-black text-xl sm:text-2xl text-white tracking-wide">
                {isMeWinner ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white">
                    VICTORY! YOU WON THE ARENA MATCH 👑
                  </span>
                ) : isAIMatch && winner?.isBot ? (
                  <span className="text-cyan-300 flex items-center justify-center gap-2">
                    <Bot className="w-6 h-6" />
                    <span>AI BOT CLAIMS VICTORY</span>
                  </span>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white">
                    WINNER: {winner?.username || 'Champion'} 👑
                  </span>
                )}
              </div>
            </div>

            {/* Top 3 Podium Cards */}
            {top10.length >= 2 && (
              <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 mb-5 items-end">
                {/* 2nd Place */}
                {top10[1] && (
                  <div className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border flex flex-col items-center h-36 justify-between">
                    <span className="text-lg">🥈</span>
                    <span className="text-xs font-mono font-bold text-slate-200 truncate w-full">
                      {top10[1].username}
                    </span>
                    <div className="text-[10px] font-mono text-clutch-lavender">
                      {top10[1].correctCount ?? top10[1].solved ?? 0}/{activeRoom.settings.totalRounds || 5} Solved
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      {top10[1].score} pts
                    </div>
                  </div>
                )}

                {/* 1st Place Champion */}
                {top10[0] && (
                  <div className="p-3.5 rounded-xl bg-clutch-surface-elevated border border-clutch-amber/60 shadow-lg flex flex-col items-center h-44 justify-between relative scale-105 z-10 ring-2 ring-amber-400/50">
                    <div className="absolute -top-3 px-2.5 py-0.5 bg-gradient-to-r from-clutch-amber to-amber-400 text-black font-cyber font-bold text-[9px] rounded-full shadow">
                      WINNER 👑
                    </div>
                    <span className="text-2xl mt-1">🥇</span>
                    <span className="text-xs font-mono font-extrabold text-clutch-amber truncate w-full">
                      {top10[0].username}
                    </span>
                    <div className="text-[11px] font-mono font-bold text-clutch-emerald">
                      {top10[0].correctCount ?? top10[0].solved ?? 0}/{activeRoom.settings.totalRounds || 5} Solved
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
                    <span className="text-xs font-mono font-bold text-slate-200 truncate w-full">
                      {top10[2].username}
                    </span>
                    <div className="text-[10px] font-mono text-clutch-lavender">
                      {top10[2].correctCount ?? top10[2].solved ?? 0}/{activeRoom.settings.totalRounds || 5} Solved
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      {top10[2].score} pts
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authoritative Leaderboard Table */}
            <div className="w-full bg-clutch-bg/80 rounded-xl border border-clutch-border p-2.5 mb-5 max-h-44 overflow-y-auto">
              <div className="flex items-center justify-between text-[10px] font-mono text-clutch-subtle px-3 py-1.5 border-b border-clutch-border uppercase tracking-wider">
                <span className="w-8 text-left">Rank</span>
                <span className="flex-1 text-left px-2">Player</span>
                <span className="w-20 text-center">Solved</span>
                <span className="w-16 text-right">Score</span>
              </div>

              <div className="space-y-1 mt-1">
                {top10.map((p) => {
                  const isMe = p.id === userProfile.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg font-mono transition-all ${
                        isMe
                          ? 'bg-clutch-violet/20 border border-clutch-violet text-white font-bold'
                          : 'bg-clutch-surface-light/60 text-clutch-muted'
                      }`}
                    >
                      <span className={`w-8 text-left font-bold ${
                        p.rank === 1 ? 'text-clutch-amber' : p.rank === 2 ? 'text-slate-300' : p.rank === 3 ? 'text-amber-600' : 'text-clutch-subtle'
                      }`}>
                        #{p.rank}
                      </span>
                      <span className="flex-1 text-left px-2 truncate flex items-center gap-1.5">
                        <span className="truncate">{p.username}</span>
                        {isMe && <span className="text-[9px] px-1.5 rounded bg-clutch-violet text-white">YOU</span>}
                        {p.isBot && <span className="text-[9px] px-1.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">BOT</span>}
                      </span>
                      <span className="w-20 text-center text-clutch-emerald text-[11px]">
                        {p.correctCount ?? p.solved ?? 0}/{activeRoom.settings.totalRounds || 5}
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
              className="clutch-btn-primary px-8 py-3 text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.4)]"
            >
              <span>Return to Lobby</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {/* Round Review State: Display Outcome, Verified Answer & Solution */}
            <div className="mb-2">
              {lastResult?.isCorrect ? (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                  <XCircle className="w-7 h-7" />
                </div>
              )}
            </div>

            <h3 className="font-cyber text-xl font-bold text-white mb-1">
              {lastResult?.isCorrect ? 'CHALLENGE SOLVED' : 'ROUND FINISHED'}
            </h3>

            {/* Score & Multipliers */}
            {lastResult && (
              <div className="flex items-center gap-2.5 my-3 text-xs font-mono flex-wrap justify-center">
                <div className="px-3 py-1 bg-clutch-surface-light rounded-lg border border-clutch-border">
                  Points: <strong className="text-clutch-emerald">+{lastResult.pointsAwarded || (lastResult as any).score || 0}</strong>
                </div>
                <div className="px-3 py-1 bg-clutch-surface-light rounded-lg border border-clutch-border">
                  Total: <strong className="text-white">{lastResult.totalScore || 0}</strong>
                </div>
                {lastResult.speedBonus > 0 && (
                  <div className="px-3 py-1 bg-clutch-surface-light rounded-lg border border-clutch-border">
                    Speed: <strong className="text-cyan-300">+{lastResult.speedBonus}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Authoritative Verified Answer & Solution */}
            <div className="w-full bg-clutch-bg/95 border border-violet-500/30 p-3.5 sm:p-4 rounded-xl text-left text-xs mb-4 leading-relaxed font-mono">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1.5 pb-1 border-b border-violet-500/20">
                <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                <span>VERIFIED ANSWER &amp; SOLUTION</span>
              </div>

              {correctAnswer && (
                <div className="text-xs text-white mb-2">
                  <span className="text-clutch-muted">Correct Choice: </span>
                  <strong className="text-emerald-300">{String(correctAnswer)}</strong>
                </div>
              )}

              {explanation && (
                <p className="text-slate-300 text-[11px] font-sans font-normal leading-relaxed">
                  {explanation}
                </p>
              )}
            </div>

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
