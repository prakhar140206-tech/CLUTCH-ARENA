import React from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { ArenaCanvas } from '../components/arena3d/ArenaCanvas.js';
import { ArenaHeader } from '../components/arena/ArenaHeader.js';
import { LiveLeaderboardPanel } from '../components/arena/LiveLeaderboardPanel.js';
import { RoundReviewOverlay } from '../components/arena/RoundReviewOverlay.js';
import { CodeSprintEditor } from '../components/challenges/CodeSprintEditor.js';
import { VisualPuzzleWorkspace } from '../components/challenges/VisualPuzzleWorkspace.js';
import { McqChallengeWorkspace } from '../components/challenges/McqChallengeWorkspace.js';
import { HypeReactionStream } from '../components/arena/HypeReactionStream.js';
import { soundSynth } from '../services/soundSynth.js';
import { Swords, Bot, Users } from 'lucide-react';

export const ArenaScreen: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);
  const countdown = useGameStore((s) => s.countdown);

  const [activeBuff, setActiveBuff] = React.useState<string | null>(null);

  if (!activeRoom) return null;

  const isHost = activeRoom.hostId === userProfile.id;
  const participant = activeRoom.participants[userProfile.id];
  const challenge = activeRoom.activeChallenge;

  const handleStartMatch = async () => {
    await socketService.startMatch(activeRoom.id, userProfile.id);
  };

  const handleAddBot = async (diff: any) => {
    await socketService.addBot(activeRoom.id, diff);
  };

  const handleToggleReady = () => {
    if (participant) {
      socketService.setReady(activeRoom.id, userProfile.id, !participant.isReady);
    }
  };

  const handleTriggerPowerUp = (type: 'uno_reverse' | 'sigma_shield' | 'brain_freeze' | 'gigachad_focus') => {
    setActiveBuff(type);
    if (type === 'gigachad_focus') {
      soundSynth.speakHype('GigaChad mode activated! 2.5x points on the line!', 'hype');
    } else if (type === 'sigma_shield') {
      soundSynth.speakHype('Sigma shield deployed! Zero cap damage!', 'sigma');
    } else if (type === 'uno_reverse') {
      soundSynth.speakHype('Uno reverse! Turning the tables!', 'hype');
    }
    setTimeout(() => {
      setActiveBuff(null);
    }, 12000);
  };

  const roundStartTimeRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (activeRoom.status === 'in_round') {
      roundStartTimeRef.current = Date.now();
    }
  }, [activeRoom.currentRound, activeRoom.status]);

  const handleSubmit = async (answer: any, language?: any) => {
    if (!challenge) return;
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
  };


  return (
    <div className="w-screen h-screen flex flex-col bg-[#080811] overflow-hidden relative">
      {/* Top Arena Header */}
      <ArenaHeader />

      {/* Main Game Arena Container */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* 3D Arena Viewport (Left / Top) */}
        <div className={`relative transition-all duration-300 ${
          activeRoom.status === 'in_round' ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full h-full'
        }`}>
          <ArenaCanvas />

          {/* Standings Overlay */}
          <div className="absolute top-4 right-4 z-20">
            <LiveLeaderboardPanel />
          </div>

          {/* Lobby Waiting Overlay */}
          {activeRoom.status === 'lobby' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20">
              <div className="w-full max-w-md bg-slate-900/90 border border-violet-500/40 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-cyber font-extrabold text-lg">
                  <Users className="w-5 h-5" />
                  <span>ARENA STAGING LOBBY</span>
                </div>

                <div className="text-slate-400 text-xs mb-6 font-mono">
                  Room Code: <strong className="text-white text-base tracking-widest">{activeRoom.code}</strong>
                </div>

                {/* Combatants Grid */}
                <div className="w-full grid grid-cols-2 gap-2 mb-6 max-h-48 overflow-y-auto pr-1">
                  {Object.values(activeRoom.participants).map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.loadout?.color || '#8B5CF6' }}
                        />
                        <span className="truncate">{p.username}</span>
                      </div>
                      {p.isReady ? (
                        <span className="text-[10px] text-emerald-400 font-mono">READY</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">WAITING</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Host Controls vs Player Ready */}
                <div className="w-full flex flex-col gap-3">
                  {isHost ? (
                    <>
                      <button
                        onClick={handleStartMatch}
                        className="w-full cyber-btn cyber-btn-cyan py-3 text-xs flex items-center justify-center gap-2"
                      >
                        <Swords className="w-4 h-4" />
                        <span>ENGAGE MATCH</span>
                      </button>

                      {/* Add AI Bot Options */}
                      <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5 text-amber-400" /> Add Bot:
                        </span>
                        {(['balanced', 'speedrunner', 'strategist', 'adaptive'] as const).map((diff) => (
                          <button
                            key={diff}
                            onClick={() => handleAddBot(diff)}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 font-mono capitalize"
                          >
                            +{diff}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={handleToggleReady}
                      className={`w-full cyber-btn py-3 text-xs ${
                        participant?.isReady ? 'cyber-btn-outline' : 'cyber-btn-violet'
                      }`}
                    >
                      {participant?.isReady ? 'CANCEL READY' : 'SET READY'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-40">
              <span className="text-cyan-400 font-cyber font-bold text-lg mb-2">ARENA INITIALIZING</span>
              <div className="font-cyber font-black text-8xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500 animate-ping">
                {countdown === 0 ? 'START!' : countdown}
              </div>
            </div>
          )}
        </div>

        {/* Challenge Interactive Workspace (Right / Bottom) */}
        {activeRoom.status === 'in_round' && challenge && (
          <div className="w-full md:w-1/2 h-1/2 md:h-full p-4 overflow-hidden flex flex-col">
            {challenge.type === 'code_sprint' ? (
              <CodeSprintEditor
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={participant?.currentStatus === 'solved' || participant?.currentStatus === 'failed'}
              />
            ) : challenge.type === 'visual_puzzle' ? (
              <VisualPuzzleWorkspace
                challenge={challenge}
                onSolve={handleSubmit}
                disabled={participant?.currentStatus === 'solved' || participant?.currentStatus === 'failed'}
              />
            ) : (
              <McqChallengeWorkspace
                challenge={challenge}
                onSubmit={handleSubmit}
                disabled={participant?.currentStatus === 'solved' || participant?.currentStatus === 'failed'}
              />
            )}
          </div>
        )}
      </div>

      {/* Round & Match Review Overlay */}
      <RoundReviewOverlay />

      {/* Floating Twitch/TikTok Reaction Stream & Power-Up Bar */}
      <HypeReactionStream
        onTriggerPowerUp={handleTriggerPowerUp}
        activePowerUp={activeBuff}
      />
    </div>
  );
};

