import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { socketService } from '../../services/socketService.js';
import { Clock, Copy, Check, Eye, LogOut, Flame, Shield, Volume2, VolumeX } from 'lucide-react';
import { soundSynth } from '../../services/soundSynth.js';
import { CLUTCH_LOGO } from '../../config/assets.js';

export const ArenaHeader: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);
  const is3DFallback = useGameStore((s) => s.is3DFallback);
  const toggle3DFallback = useGameStore((s) => s.toggle3DFallback);
  const setScreen = useGameStore((s) => s.setScreen);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const toggleSfx = useGameStore((s) => s.toggleSfx);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Synchronized dual countdown timers based on server authoritative matchExpiresAt & questionExpiresAt
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRoom?.questionExpiresAt || activeRoom?.roundExpiresAt) {
        const qExp = activeRoom.questionExpiresAt || activeRoom.roundExpiresAt!;
        const remainingQ = Math.max(0, Math.ceil((qExp - Date.now()) / 1000));
        setTimeLeft(remainingQ);
      } else {
        setTimeLeft(0);
      }

      if (activeRoom?.matchExpiresAt) {
        const remainingMatch = Math.max(0, Math.ceil((activeRoom.matchExpiresAt - Date.now()) / 1000));
        setMatchTimeLeft(remainingMatch);
      } else {
        setMatchTimeLeft(0);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [activeRoom?.roundExpiresAt, activeRoom?.questionExpiresAt, activeRoom?.matchExpiresAt]);

  const copyRoomCode = () => {
    if (!activeRoom?.code) return;
    navigator.clipboard.writeText(activeRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeave = () => {
    if (activeRoom) {
      socketService.leaveRoom(activeRoom.id, userProfile.id);
    }
    setScreen('lobby');
  };

  const participant = activeRoom?.participants[userProfile.id];

  return (
    <header className="w-full max-w-full overflow-x-hidden flex items-center justify-between px-2.5 sm:px-6 py-2 sm:py-3 bg-clutch-surface/95 border-b border-clutch-border backdrop-blur-xl z-30 select-none shrink-0 font-sans">
      {/* Left: Brand, Room Name & Invite Code */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button onClick={handleLeave} title="Exit Arena" className="hover:opacity-80 transition-opacity shrink-0">
          <img
            src={CLUTCH_LOGO}
            alt="CLUTCH"
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
          />
        </button>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-cyber font-bold text-white text-xs sm:text-sm tracking-wide truncate max-w-[80px] xs:max-w-[130px] sm:max-w-none">
              {activeRoom?.name || 'CLUTCH ARENA'}
            </span>
            {activeRoom?.code && (
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1 text-[9.5px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-clutch-surface-light border border-clutch-border text-clutch-lavender hover:border-clutch-violet transition-colors shrink-0"
                title="Copy Room Code to Invite"
              >
                <span>{activeRoom.code}</span>
                {copiedCode ? <Check className="w-3 h-3 text-clutch-emerald" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-clutch-muted font-mono hidden sm:inline">
            MODE: {activeRoom?.settings.mode.toUpperCase()} • PLAYERS: {Object.keys(activeRoom?.participants || {}).length}/{activeRoom?.settings.maxPlayers || 16}
          </span>
        </div>
      </div>

      {/* Center: Dual Clocks */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Progressive Difficulty Stage Badge (Desktop only to prevent mobile clutter) */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-violet-950/60 border border-violet-500/50 font-mono text-xs text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping"></span>
          <span className="font-cyber font-bold tracking-wider text-[11px] sm:text-xs">
            {activeRoom?.stageName || `LEVEL ${activeRoom?.currentStage || 1}: EASY`}
          </span>
        </div>

        {/* Overall Match Clock */}
        {activeRoom?.matchExpiresAt && (
          <div className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cyan-950/40 border border-cyan-500/40 font-mono text-[11px] sm:text-xs text-cyan-300">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-cyan-400 hidden xs:inline">Match:</span>
            <span className="font-bold">{formatTime(matchTimeLeft)}</span>
          </div>
        )}

        {/* Per-Question Rapid Clock */}
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-[10px] sm:text-[11px] font-cyber text-clutch-lavender font-bold hidden xs:inline sm:inline">
            Q#{activeRoom?.currentRound || 1}
          </span>
          <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-mono font-bold text-xs sm:text-sm border transition-all ${timeLeft <= 5 && timeLeft > 0
              ? 'bg-clutch-rose/20 border-clutch-rose text-clutch-rose animate-bounce'
              : 'bg-clutch-surface-elevated border-clutch-violet/40 text-clutch-lavender'
            }`}>
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Right: Telemetry & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Combo Multiplier Pill */}
        {participant && (participant.combo || 0) > 1 && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-clutch-amber/20 border border-clutch-amber/40 text-clutch-amber text-xs font-mono font-bold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{participant.combo}x COMBO</span>
          </div>
        )}

        {/* 3D Fallback Mode Toggle */}
        <button
          onClick={toggle3DFallback}
          className={`p-1.5 rounded-lg border text-xs transition-colors hidden sm:flex items-center justify-center ${is3DFallback
              ? 'bg-clutch-amber/20 border-clutch-amber/40 text-clutch-amber'
              : 'bg-clutch-surface-light border-clutch-border text-clutch-subtle hover:text-white'
            }`}
          title={is3DFallback ? '2D Mode Engaged (Click for 3D)' : '3D Mode Engaged (Click for 2D)'}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            toggleSfx();
            soundSynth.toggleSfx();
          }}
          className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center justify-center ${sfxEnabled
              ? 'bg-clutch-violet/20 border-clutch-violet/40 text-clutch-lavender'
              : 'bg-clutch-surface-light border-clutch-border text-clutch-subtle'
            }`}
        >
          {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Leave Room Button */}
        <button
          onClick={handleLeave}
          className="p-1.5 rounded-lg bg-clutch-surface-light border border-clutch-border hover:border-clutch-rose hover:text-clutch-rose text-clutch-subtle transition-colors"
          title="Leave Match"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
