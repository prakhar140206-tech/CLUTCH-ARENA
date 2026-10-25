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
        soundSynth.speakHype('W Rizz! You are the 70-Player Arena Champion! Absolute GigaChad speed!', 'hype');
      } else if (isMeTop10) {
        soundSynth.levelUp();
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
        soundSynth.speakHype(`Congratulations! You ranked Top 10 in the grand tournament!`, 'hype');
      } else {
        soundSynth.speakHype(`Tournament ended! Champion is ${winner?.username}!`, 'normal');
      }
    } else if (activeRoom.status === 'round_review' && lastResult) {
      if (lastResult.isCorrect) {
        soundSynth.auraGlow();
        soundSynth.speakHype(`Round cleared! Plus ${lastResult.pointsAwarded} points!`, 'hype');
      } else {
        soundSynth.vineBoom();
        soundSynth.speakHype('Round over... Bro is cooked 💀', 'roast');
      }
    }
  }, [activeRoom?.status, lastResult]);

  if (!activeRoom || (activeRoom.status !== 'round_review' && activeRoom.status !== 'match_ended')) {
    return null;
  }

  const podiumOrder = [top10[1], top10[0], top10[2]].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-300 select-none overflow-y-auto">
      <div className={`w-full ${isMatchEnded ? 'max-w-2xl' : 'max-w-lg'} bg-slate-900/95 border-2 border-violet-500/40 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-purple-950/60 flex flex-col items-center text-center my-auto`}>
        {isMatchEnded ? (
          <>
            {/* Header / Crown */}
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/30 border-2 border-amber-400/80 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <Trophy className="w-8 h-8 animate-bounce text-amber-300" />
              </div>
              <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-2 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                70-PLAYER GRAND ARENA CEREMONY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                {activeRoom.settings.totalRounds || 25} QUESTIONS • 20s TIMER
              </span>
            </div>

            <h2 className="font-cyber text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-wide mb-1">
              TOURNAMENT WINNERS
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm mb-5">
              Ranked by <strong className="text-cyan-300">Accuracy (Correct Answers)</strong> &amp; <strong className="text-amber-300">Fastest Response Speed (Seconds)</strong>
            </p>

            {/* Top 3 Podium Cards */}
            {top10.length >= 2 && (
              <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 mb-5 items-end">
                {/* 2nd Place */}
                {top10[1] && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-700/60 flex flex-col items-center h-40 justify-between">
                    <span className="text-lg">🥈</span>
                    <span className="text-xs font-mono font-bold text-slate-300 truncate w-full">
                      {top10[1].username}
                    </span>
                    <div className="text-[10px] font-mono text-cyan-300">
                      {top10[1].correctCount ?? 0}/{activeRoom.settings.totalRounds || 25} Correct
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {top10[1].avgTimeTakenSec ? `${top10[1].avgTimeTakenSec}s avg` : 'Speed runner'}
                    </div>
                    <div className="text-xs font-mono font-bold text-violet-300">
                      {top10[1].score} pts
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 font-mono">
                      +10k Coins
                    </span>
                  </div>
                )}

                {/* 1st Place Champion */}
                {top10[0] && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex flex-col items-center h-48 justify-between relative scale-105 z-10">
                    <div className="absolute -top-3 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-cyber font-black text-[9px] rounded-full shadow">
                      CHAMPION 👑
                    </div>
                    <span className="text-2xl mt-1">🥇</span>
                    <span className="text-xs font-mono font-extrabold text-amber-300 truncate w-full">
                      {top10[0].username}
                    </span>
                    <div className="text-[11px] font-mono font-bold text-emerald-400">
                      {top10[0].correctCount ?? 0}/{activeRoom.settings.totalRounds || 25} Correct
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {top10[0].avgTimeTakenSec ? `${top10[0].avgTimeTakenSec}s avg` : 'Lightning'}
                    </div>
                    <div className="text-sm font-cyber font-black text-amber-200">
                      {top10[0].score} pts
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400 font-mono font-bold">
                      +15,000 Coins
                    </span>
                  </div>
                )}

                {/* 3rd Place */}
                {top10[2] && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-800/40 flex flex-col items-center h-36 justify-between">
                    <span className="text-lg">🥉</span>
                    <span className="text-xs font-mono font-bold text-amber-500/90 truncate w-full">
                      {top10[2].username}
                    </span>
                    <div className="text-[10px] font-mono text-cyan-300">
                      {top10[2].correctCount ?? 0}/{activeRoom.settings.totalRounds || 25} Correct
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {top10[2].avgTimeTakenSec ? `${top10[2].avgTimeTakenSec}s avg` : 'Top solver'}
                    </div>
                    <div className="text-xs font-mono font-bold text-violet-300">
                      {top10[2].score} pts
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-600/30 font-mono">
                      +7.5k Coins
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Authoritative Top 10 Tournament Leaderboard Table */}
            <div className="w-full bg-slate-950/80 rounded-xl border border-slate-800 p-2.5 mb-5 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-3 py-1.5 border-b border-slate-800 uppercase tracking-wider">
                <span className="w-8 text-left">Rank</span>
                <span className="flex-1 text-left px-2">Player</span>
                <span className="w-20 text-center">Accuracy</span>
                <span className="w-16 text-center">Avg Time</span>
                <span className="w-16 text-right">Score</span>
                <span className="w-24 text-right">Reward</span>
              </div>

              <div className="space-y-1 mt-1">
                {top10.map((p) => {
                  const isMe = p.id === userProfile.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between text-xs px-3 py-1.5 rounded font-mono transition-all ${
                        isMe
                          ? 'bg-cyan-500/15 border border-cyan-400/60 text-white font-bold'
                          : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/80'
                      }`}
                    >
                      <span className={`w-8 text-left font-bold ${
                        p.rank === 1 ? 'text-amber-400' : p.rank === 2 ? 'text-slate-300' : p.rank === 3 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        #{p.rank}
                      </span>
                      <span className="flex-1 text-left px-2 truncate flex items-center gap-1.5">
                        <span className="truncate">{p.username}</span>
                        {isMe && <span className="text-[9px] px-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">YOU</span>}
                      </span>
                      <span className="w-20 text-center text-emerald-400 text-[11px]">
                        {p.correctCount ?? 0}/{activeRoom.settings.totalRounds || 25}
                      </span>
                      <span className="w-16 text-center text-cyan-300 text-[11px] flex items-center justify-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 opacity-70" />
                        {p.avgTimeTakenSec ? `${p.avgTimeTakenSec}s` : '--'}
                      </span>
                      <span className="w-16 text-right font-bold text-violet-300">
                        {p.score}
                      </span>
                      <span className="w-24 text-right text-amber-300 text-[10px] font-bold truncate">
                        {p.rewardCoins ? `+${p.rewardCoins.toLocaleString()} 🪙` : '--'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Personal Outcome Announcement */}
            {myEntry && (
              <div className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 mb-5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <div className="text-left font-mono">
                    <span className="text-slate-400 block text-[10px]">YOUR MATCH RESULT</span>
                    <strong className="text-white">
                      Rank #{myEntry.rank} • {myEntry.correctCount ?? 0}/{activeRoom.settings.totalRounds || 25} Solved
                      {myEntry.avgTimeTakenSec ? ` (${myEntry.avgTimeTakenSec}s avg speed)` : ''}
                    </strong>
                  </div>
                </div>
                {myEntry.rewardCoins ? (
                  <div className="px-3 py-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{myEntry.rewardCoins.toLocaleString()} Coins</span>
                  </div>
                ) : (
                  <span className="text-slate-500 font-mono text-[11px]">Keep training!</span>
                )}
              </div>
            )}

            <button
              onClick={() => setScreen('lobby')}
              className="cyber-btn cyber-btn-cyan px-8 py-3 text-xs flex items-center gap-2"
            >
              <span>RETURN TO LOBBY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="mb-3">
              {lastResult?.isCorrect ? (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400 mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>
              )}
            </div>

            <h3 className="font-cyber text-xl font-bold text-white mb-1">
              {lastResult?.isCorrect ? 'CHALLENGE SOLVED' : 'ROUND FINISHED'}
            </h3>

            {lastResult && (
              <div className="flex items-center gap-4 my-3 text-xs font-mono">
                <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800">
                  Points: <strong className="text-emerald-400">+{lastResult.pointsAwarded}</strong>
                </div>
                <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800">
                  Combo: <strong className="text-purple-400">x{lastResult.comboMultiplier}</strong>
                </div>
                <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800">
                  Speed: <strong className="text-cyan-400">+{lastResult.speedBonus}</strong>
                </div>
              </div>
            )}

            {lastResult?.explanation && (
              <div className="w-full bg-slate-950/70 border border-slate-800 p-3 rounded-lg text-left text-xs text-slate-300 mb-5 leading-relaxed">
                <span className="font-bold text-cyan-400 block mb-1">Algorithmic Insight:</span>
                {lastResult.explanation}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 animate-pulse">
              <span>Next question broadcasting in 5 seconds...</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
