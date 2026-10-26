import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { socketService } from '../../services/socketService.js';
import { Clock, Copy, Check, Eye, LogOut, Flame, Shield, Volume2, VolumeX } from 'lucide-react';
import { soundSynth } from '../../services/soundSynth.js';

export const ArenaHeader: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);
  const is3DFallback = useGameStore((s) => s.is3DFallback);
  const toggle3DFallback = useGameStore((s) => s.toggle3DFallback);
  const setScreen = useGameStore((s) => s.setScreen);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const toggleSfx = useGameStore((s) => s.toggleSfx);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Synchronized countdown timer based on server authoritative roundExpiresAt
  useEffect(() => {
    if (!activeRoom?.roundExpiresAt) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeRoom.roundExpiresAt! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 250);

    return () => clearInterval(interval);
  }, [activeRoom?.roundExpiresAt]);

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
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3 bg-clutch-surface/95 border-b border-clutch-border backdrop-blur-xl z-30 select-none shrink-0 font-sans">
      {/* Left: Brand, Room Name & Invite Code */}
      <div className="flex items-center gap-3">
        <button onClick={handleLeave} title="Exit Arena" className="hover:opacity-80 transition-opacity">
          <img
            src="/logo.png"
            alt="CLUTCH"
            className="w-7 h-7 object-contain"
          />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-cyber font-bold text-white text-xs sm:text-sm tracking-wide">
              {activeRoom?.name || 'CLUTCH ARENA'}
            </span>
            {activeRoom?.code && (
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-surface-light border border-clutch-border text-clutch-lavender hover:border-clutch-violet transition-colors"
                title="Copy Room Code to Invite"
              >
                <span>CODE: {activeRoom.code}</span>
                {copiedCode ? <Check className="w-3 h-3 text-clutch-emerald" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
          <span className="text-[10px] text-clutch-muted font-mono hidden sm:inline">
            MODE: {activeRoom?.settings.mode.toUpperCase()} • PLAYERS: {Object.keys(activeRoom?.participants || {}).length}/{activeRoom?.settings.maxPlayers || 16}
          </span>
        </div>
      </div>

      {/* Center: Authoritative Round Clock */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-cyber text-clutch-lavender font-bold hidden sm:inline">
            ROUND {activeRoom?.currentRound || 1} / {activeRoom?.settings.totalRounds || 5}
          </span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-xs sm:text-sm border ${
            timeLeft <= 10 && timeLeft > 0
              ? 'bg-clutch-rose/20 border-clutch-rose text-clutch-rose animate-pulse'
              : 'bg-clutch-surface-elevated border-clutch-violet/40 text-clutch-lavender'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
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
          className={`p-1.5 rounded-lg border text-xs transition-colors hidden sm:flex items-center justify-center ${
            is3DFallback
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
          className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center justify-center ${
            sfxEnabled
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
