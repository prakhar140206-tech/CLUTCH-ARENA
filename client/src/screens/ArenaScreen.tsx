import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { ArenaCanvas } from '../components/arena3d/ArenaCanvas.js';
import { ArenaHeader } from '../components/arena/ArenaHeader.js';
import { LiveLeaderboardPanel } from '../components/arena/LiveLeaderboardPanel.js';
import { RoundReviewOverlay } from '../components/arena/RoundReviewOverlay.js';
import { CodeSprintEditor } from '../components/challenges/CodeSprintEditor.js';
import { VisualPuzzleWorkspace } from '../components/challenges/VisualPuzzleWorkspace.js';
import { McqChallengeWorkspace } from '../components/challenges/McqChallengeWorkspace.js';
import { InteractiveArrayWorkspace } from '../components/challenges/InteractiveArrayWorkspace.js';
import { MatchingWorkspace } from '../components/challenges/MatchingWorkspace.js';
import { ArrangeStepsWorkspace } from '../components/challenges/ArrangeStepsWorkspace.js';
import { FillBlankWorkspace } from '../components/challenges/FillBlankWorkspace.js';
import { PseudocodeWorkspace } from '../components/challenges/PseudocodeWorkspace.js';
import { soundSynth } from '../services/soundSynth.js';
import { Swords, Bot, Users, Play, CheckCircle2, Award, Clock, ArrowRight, ShieldCheck, Zap, LayoutDashboard, Compass, Smartphone, User } from 'lucide-react';

export const ArenaScreen: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);
  const countdown = useGameStore((s) => s.countdown);
  const setScreen = useGameStore((s) => s.setScreen);
  const stageAnnouncement = useGameStore((s) => s.stageAnnouncement);
  const setStageAnnouncement = useGameStore((s) => s.setStageAnnouncement);

  // Mobile View Switcher: 'workspace' | 'arena3d' | 'standings'
  const [mobileTab, setMobileTab] = useState<'workspace' | 'arena3d' | 'standings'>('workspace');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const roundStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (stageAnnouncement) {
      soundSynth.levelUp();
      const timer = setTimeout(() => {
        setStageAnnouncement(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [stageAnnouncement]);

  useEffect(() => {
    if (activeRoom?.status === 'in_round') {
      roundStartTimeRef.current = Date.now();
      setMobileTab('workspace'); // default to workspace when round starts
    }
  }, [activeRoom?.currentRound, activeRoom?.status]);

  if (!activeRoom) {
    return (
      <div className="w-full max-w-full min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-clutch-bg text-white p-6">
        <div className="w-16 h-16 rounded-2xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-4 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          <Swords className="w-8 h-8" />
        </div>
        <h2 className="font-cyber font-bold text-xl mb-2">NO ACTIVE ARENA MATCH</h2>
        <p className="text-xs font-mono text-clutch-muted mb-6 text-center max-w-sm">
          Select an arena queue from the lobby or start an instant 1v1 algorithmic duel against an AI bot.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 w-full max-w-xs sm:max-w-md">
          <button
            onClick={() => setScreen('lobby')}
            className="clutch-btn-secondary px-5 py-2.5 text-xs w-full sm:w-auto text-center"
          >
            Return to Lobby
          </button>
          <button
            onClick={async () => {
              const room = await socketService.createRoom(userProfile, { mode: 'ai_arena', maxPlayers: 2, totalRounds: 3 });
              await socketService.addBot(room.id, 'balanced');
            }}
            className="clutch-btn-primary px-5 py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(124,58,237,0.4)] w-full sm:w-auto"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Launch Instant AI Duel</span>
          </button>
        </div>
      </div>
    );
  }

  const isHost = activeRoom.hostId === userProfile.id;
  const participant = activeRoom.participants[userProfile.id];
  const challenge = activeRoom.activeChallenge;
  const participantCount = Object.keys(activeRoom.participants).length;
  const roomMode = activeRoom.settings?.mode as string;
  const maxPlayers = activeRoom.settings?.maxPlayers || (roomMode === 'duel_1v1' || roomMode === 'ai_arena' ? 2 : 10);
  const isRoomFull = participantCount >= maxPlayers;

  const handleStartMatch = async () => {
    soundSynth.levelUp();
    await socketService.startMatch(activeRoom.id, userProfile.id);
  };

  const handleAddBot = async (diff: any) => {
    if (isRoomFull) return;
    soundSynth.click();
    await socketService.addBot(activeRoom.id, diff);
  };

  const handleToggleReady = () => {
    if (participant) {
      soundSynth.click();
      socketService.setReady(activeRoom.id, userProfile.id, !participant.isReady);
    }
  };

  const handleSubmit = async (answer: any, language?: any) => {
    if (!challenge || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const timeTakenMs = Math.max(300, Date.now() - roundStartTimeRef.current);
      await socketService.submitAnswer({
        roomId: activeRoom.id,
        challengeId: challenge.id,
        roundIndex: activeRoom.currentRound,
        answer,
        language,
        userId: userProfile.id,
        idempotencyKey: `sub-${userProfile.id}-${activeRoom.currentRound}-${Date.now()}`,
        timeTakenMs
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full h-screen h-[100dvh] flex flex-col bg-clutch-bg text-clutch-text overflow-hidden relative font-sans">
      {/* Top Arena Telemetry Header */}
      <ArenaHeader />

      {/* Progressive Stage Transition Banner */}
      {stageAnnouncement && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl animate-bounce pointer-events-auto">
          <div className="bg-gradient-to-r from-violet-950/95 via-purple-900/95 to-cyan-950/95 border-2 border-cyan-400 p-4 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.6)] backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="font-cyber font-black text-sm tracking-wider text-cyan-300">
                  {stageAnnouncement.message}
                </div>
                <div className="text-[11px] font-mono text-purple-200">
                  {stageAnnouncement.subtitle}
                </div>
              </div>
            </div>
            <button
              onClick={() => setStageAnnouncement(null)}
              className="text-cyan-300 hover:text-white text-xs font-mono px-2 py-1 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile Segmented Navigation (Only during in_round state) */}
      {activeRoom.status === 'in_round' && (
        <div className="md:hidden flex bg-clutch-surface border-b border-clutch-border p-1 z-20 shrink-0 gap-1">
          <button
            onClick={() => setMobileTab('workspace')}
            className={`flex-1 py-2 min-h-[40px] text-xs font-semibold rounded-md transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none ${
              mobileTab === 'workspace' ? 'bg-clutch-violet text-white shadow-sm font-bold' : 'text-clutch-muted hover:text-white'
            }`}
          >
            Challenge Code
          </button>
          <button
            onClick={() => setMobileTab('arena3d')}
            className={`flex-1 py-2 min-h-[40px] text-xs font-semibold rounded-md transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none ${
              mobileTab === 'arena3d' ? 'bg-clutch-violet text-white shadow-sm font-bold' : 'text-clutch-muted hover:text-white'
            }`}
          >
            3D Arena
          </button>
          <button
            onClick={() => setMobileTab('standings')}
            className={`flex-1 py-2 min-h-[40px] text-xs font-semibold rounded-md transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-clutch-lavender focus-visible:outline-none ${
              mobileTab === 'standings' ? 'bg-clutch-violet text-white shadow-sm font-bold' : 'text-clutch-muted hover:text-white'
            }`}
          >
            Standings
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 min-h-0 relative flex flex-col md:flex-row overflow-hidden">

        {/* =========================================================
            LOBBY WAITING STAGING STATE
            ========================================================= */}
        {activeRoom.status === 'lobby' && (
          <div className="absolute inset-0 bg-clutch-bg/90 backdrop-blur-md flex items-center justify-center p-4 z-20 overflow-y-auto">
            <div className="w-full max-w-xl clutch-panel-elevated rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-4 shadow">
                <Users className="w-7 h-7" />
              </div>

              <h2 className="font-cyber font-bold text-xl text-white mb-1">ARENA STAGING LOBBY</h2>
              <div className="text-xs font-mono text-clutch-muted mb-6">
                Room Code: <strong className="text-white text-sm tracking-widest px-2 py-0.5 rounded bg-clutch-surface-light border border-clutch-border">{activeRoom.code}</strong>
              </div>

              {/* Combatants List */}
              <div className="w-full mb-6 text-left">
                <div className="flex items-center justify-between text-xs font-mono text-clutch-muted mb-2">
                  <span className="flex items-center gap-2">
                    <span>COMBATANTS ({participantCount}/{maxPlayers})</span>
                    {isRoomFull && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        ROOM FULL
                      </span>
                    )}
                  </span>
                  <span>STATUS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {Object.values(activeRoom.participants).map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: p.loadout?.color || '#7c3aed' }}
                        />
                        <span className="font-medium text-white truncate">{p.username}</span>
                        {p.isHost && (
                          <span className="px-1.5 py-0.2 rounded bg-clutch-violet/30 text-clutch-lavender text-[9px] font-mono">
                            HOST
                          </span>
                        )}
                        {p.isBot && (
                          <span className="px-1.5 py-0.2 rounded bg-clutch-surface text-clutch-subtle text-[9px] font-mono">
                            BOT
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] font-mono font-bold ${p.isReady ? 'text-clutch-emerald' : 'text-clutch-subtle'}`}>
                        {p.isReady ? 'READY' : 'WAITING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Host vs Player Ready Controls */}
              <div className="w-full flex flex-col sm:flex-row gap-3">
                {isHost ? (
                  <>
                    <button
                      onClick={handleStartMatch}
                      className="flex-1 clutch-btn-primary py-3 text-xs flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Arena Match</span>
                    </button>

                    <button
                      onClick={() => handleAddBot('balanced')}
                      disabled={isRoomFull}
                      title={isRoomFull ? `Maximum capacity of ${maxPlayers} combatants reached` : 'Add an AI opponent'}
                      className={`py-3 px-4 text-xs flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all ${
                        isRoomFull
                          ? 'bg-clutch-surface/40 text-clutch-muted border border-clutch-border/40 cursor-not-allowed opacity-50'
                          : 'clutch-btn-secondary'
                      }`}
                    >
                      <Bot className="w-4 h-4 text-clutch-lavender" />
                      <span>{isRoomFull ? `Room Full (${participantCount}/${maxPlayers})` : 'Add AI Bot'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleToggleReady}
                    className={`w-full py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${participant?.isReady
                        ? 'bg-clutch-surface-light border border-clutch-emerald text-clutch-emerald'
                        : 'clutch-btn-primary'
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{participant?.isReady ? 'Ready for Battle ✔' : 'Set Ready'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            ROUND COUNTDOWN OVERLAY
            ========================================================= */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-30 pointer-events-none">
            <span className="font-cyber font-black text-7xl sm:text-9xl text-white drop-shadow-[0_0_40px_rgba(124,58,237,0.8)] animate-ping">
              {countdown}
            </span>
            <span className="font-cyber font-bold text-sm sm:text-base text-clutch-lavender tracking-widest mt-6 uppercase">
              PREPARE FOR BATTLE • LOCK IN
            </span>
          </div>
        )}

        {/* =========================================================
            LEFT COLUMN: 3D ARENA & LEADERBOARD (DESKTOP)
            ========================================================= */}
        <div
          className={`relative transition-all duration-300 ${activeRoom.status === 'in_round'
              ? 'w-full md:w-5/12 h-full'
              : 'w-full h-full'
            } ${mobileTab !== 'arena3d' && activeRoom.status === 'in_round' ? 'hidden md:block' : ''}`}
        >
          <ArenaCanvas />

          {/* Standings Overlay on Desktop */}
          <div className="absolute top-4 right-4 z-20 hidden md:block">
            <LiveLeaderboardPanel />
          </div>

          {/* Mobile Standings View */}
          {mobileTab === 'standings' && (
            <div className="absolute inset-0 bg-clutch-bg/95 p-4 z-20 md:hidden overflow-y-auto">
              <LiveLeaderboardPanel />
            </div>
          )}
        </div>

        {/* =========================================================
            RIGHT COLUMN: CHALLENGE WORKSPACE (DESKTOP & MOBILE ACTIVE)
            ========================================================= */}
        {activeRoom.status === 'in_round' && challenge && (
          <div
            className={`w-full md:w-7/12 h-full flex flex-col p-2 sm:p-5 overflow-hidden z-10 border-l border-clutch-border bg-clutch-bg ${mobileTab !== 'workspace' ? 'hidden md:flex' : 'flex'
              }`}
          >
            {challenge.type === 'code_sprint' || challenge.type === 'bug_hunter' ? (
              <CodeSprintEditor
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            ) : challenge.type === 'interactive_array' ? (
              <InteractiveArrayWorkspace
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            ) : challenge.type === 'matching' ? (
              <MatchingWorkspace
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            ) : challenge.type === 'arrange_steps' ? (
              <ArrangeStepsWorkspace
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            ) : challenge.type === 'fill_in_blank' ? (
              <FillBlankWorkspace
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            ) : challenge.type === 'pseudocode' ? (
              <PseudocodeWorkspace
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            ) : challenge.type === 'visual_puzzle' ? (
              <VisualPuzzleWorkspace
                challenge={challenge}
                onSolve={handleSubmit}
                disabled={isSubmitting}
              />
            ) : (
              <McqChallengeWorkspace
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            )}
          </div>
        )}

        {/* Round Review / Match Ended Overlays */}
        {(activeRoom.status === 'round_review' || activeRoom.status === 'match_ended') && (
          <RoundReviewOverlay />
        )}
      </div>

      {/* Mobile Bottom Navigation Dock (Matching Reference Design) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden shrink-0 z-40 bg-[#070919] border-t border-violet-500/20 shadow-[0_-4px_20px_rgba(0,0,0,0.7)] px-1 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] grid grid-cols-5 items-center justify-items-center w-full"
      >
        <button
          onClick={() => { soundSynth.click(); setScreen('dashboard'); }}
          className="w-full flex flex-col items-center justify-center py-0.5 transition-all duration-150 group relative focus:outline-none active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-transparent text-slate-400 group-hover:text-slate-200">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-tight mt-1 text-slate-400 group-hover:text-slate-200">
            Dashboard
          </span>
        </button>

        <button
          onClick={() => { soundSynth.click(); setScreen('solo_quest'); }}
          className="w-full flex flex-col items-center justify-center py-0.5 transition-all duration-150 group relative focus:outline-none active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-transparent text-slate-400 group-hover:text-slate-200">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-tight mt-1 text-slate-400 group-hover:text-slate-200">
            Practice
          </span>
        </button>

        <button
          onClick={() => { soundSynth.click(); }}
          className="w-full flex flex-col items-center justify-center py-0.5 transition-all duration-150 group relative focus:outline-none active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-violet-600/35 border border-violet-400/40 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]">
            <Swords className="w-4 h-4 scale-110 text-white drop-shadow-[0_0_8px_rgba(196,181,253,0.9)]" />
          </div>
          <span className="text-[10px] sm:text-[11px] tracking-wide mt-1 text-white font-cyber font-bold">
            Arena
          </span>
        </button>

        <button
          onClick={() => { soundSynth.click(); setScreen('brainrot_shorts'); }}
          className="w-full flex flex-col items-center justify-center py-0.5 transition-all duration-150 group relative focus:outline-none active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-transparent text-slate-400 group-hover:text-slate-200 relative">
            <Smartphone className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-500 text-[7px] font-black font-mono text-white shadow-[0_0_4px_rgba(244,63,94,0.8)]">
              ⚡
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-tight mt-1 text-slate-400 group-hover:text-slate-200">
            Shorts
          </span>
        </button>

        <button
          onClick={() => { soundSynth.click(); setScreen('profile'); }}
          className="w-full flex flex-col items-center justify-center py-0.5 transition-all duration-150 group relative focus:outline-none active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-transparent text-slate-400 group-hover:text-slate-200">
            <User className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-tight mt-1 text-slate-400 group-hover:text-slate-200">
            Profile
          </span>
        </button>
      </nav>
    </div>
  );
};
