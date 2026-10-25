import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { socketService } from '../../services/socketService.js';
import { Clock, Zap, Shield, Sparkles, Copy, Check, Eye, LogOut, Flame } from 'lucide-react';

export const ArenaHeader: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);
  const is3DFallback = useGameStore((s) => s.is3DFallback);
  const toggle3DFallback = useGameStore((s) => s.toggle3DFallback);
  const setScreen = useGameStore((s) => s.setScreen);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeShield, setActiveShield] = useState<boolean>(false);

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
    <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-violet-500/30 backdrop-blur-md z-30 select-none">
      {/* Left: Room Info & Code */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Clutch Logo"
          className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-cyber font-extrabold text-white text-sm tracking-wider">
              {activeRoom?.name || 'CLUTCH ARENA'}
            </span>
            {activeRoom?.code && (
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
                title="Copy Room Code to Invite Friends"
              >
                <span>CODE: {activeRoom.code}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            MODE: {activeRoom?.settings.mode.toUpperCase()} | PLAYERS: {Object.keys(activeRoom?.participants || {}).length}/{activeRoom?.settings.maxPlayers || 16}
          </span>
        </div>
      </div>

      {/* Center: Authoritative Round Clock */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-cyber text-violet-400 font-bold">
            ROUND {activeRoom?.currentRound || 1} / {activeRoom?.settings.totalRounds || 5}
          </span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-sm border ${
            timeLeft <= 30 && timeLeft > 0
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-bounce'
              : 'bg-slate-900/90 border-cyan-500/40 text-cyan-300'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Right: Glitch Powers & Utilities */}
      <div className="flex items-center gap-2">
        {/* Aura Points Flex */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-cyber font-bold text-xs shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{(userProfile.auraPoints || 48500).toLocaleString()} AURA</span>
        </div>

        {/* Streak Combo Pill */}
        {participant && participant.combo > 1 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-900/60 border border-purple-500/60 text-purple-300 font-mono font-bold text-xs animate-pulse">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>x{participant.combo} COMBO</span>
          </div>
        )}


        {/* Glitch Power: Focus Shield */}
        <button
          onClick={() => setActiveShield(!activeShield)}
          className={`p-1.5 rounded border text-xs flex items-center gap-1 transition-all ${
            activeShield
              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title="Glitch Power: Focus Shield (Protects streak from one mistake)"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">Shield</span>
        </button>

        {/* 2D / 3D Fallback Mode */}
        <button
          onClick={toggle3DFallback}
          className={`p-1.5 rounded border text-xs flex items-center gap-1 transition-all ${
            is3DFallback
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title="Toggle 2D HUD / 3D Arena View"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">{is3DFallback ? '2D View' : '3D View'}</span>
        </button>

        {/* Leave Arena Button */}
        <button
          onClick={handleLeave}
          className="p-1.5 rounded border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
          title="Leave Arena Room"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
