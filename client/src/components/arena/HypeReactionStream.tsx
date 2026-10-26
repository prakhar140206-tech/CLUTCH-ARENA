import React, { useState, useEffect, useRef } from 'react';
import { soundSynth } from '../../services/soundSynth.js';
import { Volume2, VolumeX, Mic, MicOff, Zap, Shield, Sparkles, Flame, ChevronUp, ChevronDown, X } from 'lucide-react';

interface FloatingEmote {
  id: number;
  emoji: string;
  x: number;
  speed: number;
}

const MEME_EMOTES = [
  { emoji: '🔥', label: 'Cooking' },
  { emoji: '💀', label: 'Cooked' },
  { emoji: '🗿', label: 'Sigma' },
  { emoji: '🧢', label: 'Cap' },
  { emoji: '👑', label: 'Aura' },
  { emoji: '🤓', label: 'O(1)' },
  { emoji: '⚡', label: 'Speed' },
  { emoji: '🧑‍🍳', label: 'Let Him Cook' }
];

export const HypeReactionStream: React.FC<{
  onTriggerPowerUp?: (type: 'uno_reverse' | 'sigma_shield' | 'brain_freeze' | 'gigachad_focus') => void;
  activePowerUp?: string | null;
  className?: string;
}> = ({ onTriggerPowerUp, activePowerUp, className = '' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);
  const [commentary, setCommentary] = useState<string>('AuraBot 9000 active. Lock in, king!');
  const [casterMood, setCasterMood] = useState<'normal' | 'hype' | 'shocked' | 'sigma'>('normal');
  const [isVoiceOn, setIsVoiceOn] = useState(soundSynth.isVoiceEnabled());
  const [isSfxOn, setIsSfxOn] = useState(soundSynth.isSfxEnabled());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when user clicks outside the opened panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const spawnEmote = (emoji: string) => {
    soundSynth.click();
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 80) + 10; // 10% - 90% horizontal position
    const speed = 2.5 + Math.random() * 1.5;

    setFloatingEmotes((prev) => [...prev.slice(-25), { id, emoji, x, speed }]);

    setTimeout(() => {
      setFloatingEmotes((prev) => prev.filter((e) => e.id !== id));
    }, 2800);
  };

  const toggleSound = () => {
    const next = soundSynth.toggleSfx();
    setIsSfxOn(next);
  };

  const toggleVoice = () => {
    const next = soundSynth.toggleVoice();
    setIsVoiceOn(next);
  };

  // Keyboard shortcuts 1-8 for quick emotes even when collapsed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = parseInt(e.key);
      if (key >= 1 && key <= MEME_EMOTES.length) {
        spawnEmote(MEME_EMOTES[key - 1].emoji);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating Emote Overlay (Pass-through clicks across the whole screen) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none">
        {floatingEmotes.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-16 select-none animate-float-up text-3xl md:text-4xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
            style={{
              left: `${item.x}%`,
              animationDuration: `${item.speed}s`
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Single Expandable AuraBot Widget */}
      <div
        ref={containerRef}
        className={`fixed bottom-3.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pb-[env(safe-area-inset-bottom)] ${className}`}
      >
        {/* Expanded Options Card (Floats neatly ABOVE the button when opened) */}
        {isOpen && (
          <div className="absolute bottom-full mb-2 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[380px] max-w-lg p-3 rounded-2xl bg-slate-950/95 border border-violet-500/40 backdrop-blur-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(124,58,237,0.3)] animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 space-y-2.5">
            {/* Header: AuraBot Status, Commentary & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-cyber text-xs border shrink-0 ${
                    casterMood === 'hype'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-bounce'
                      : 'bg-violet-900/40 border-violet-500/50 text-cyan-300'
                  }`}
                >
                  🤖
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-cyber font-bold text-cyan-400 tracking-wider">AURABOT 9000</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-700/50 uppercase">
                      AI CASTER
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-300 truncate max-w-[200px] sm:max-w-[280px]">
                    {commentary}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors shrink-0 border border-slate-800"
                title="Close AuraBot Tray"
                aria-label="Close AuraBot Tray"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Power-up Status Banner */}
            {activePowerUp && (
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black font-cyber font-black text-[9px] tracking-wider animate-pulse flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <Zap className="w-3 h-3 fill-current" />
                <span>BUFF ACTIVE: {activePowerUp.toUpperCase().replace('_', ' ')}</span>
              </div>
            )}

            {/* Quick Meme Reaction Emotes */}
            <div>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1.5 px-0.5">
                <span>HYPE REACTIONS</span>
                <span className="hidden sm:inline text-slate-500">KEYBOARD SHORTCUTS 1-8</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {MEME_EMOTES.map((item, idx) => (
                  <button
                    key={item.emoji}
                    onClick={() => spawnEmote(item.emoji)}
                    className="w-full sm:w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-violet-600/30 hover:border-cyan-400/60 active:scale-95 border border-slate-800 transition-all flex items-center justify-center text-base sm:text-sm relative group shadow-sm touch-manipulation"
                    title={`${item.label} (Press ${idx + 1})`}
                    aria-label={`Send emote: ${item.label}`}
                  >
                    <span>{item.emoji}</span>
                    <span className="hidden sm:inline absolute -top-1 -right-1 text-[7px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 bg-black px-1 rounded-full border border-slate-700">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls & Power-Up Deck (Bottom Section) */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              {/* Sound & Voice Toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleSound}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-semibold transition-all flex items-center gap-1.5 touch-manipulation ${
                    isSfxOn
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title={isSfxOn ? 'Mute SFX Synth' : 'Enable SFX Synth'}
                  aria-label={isSfxOn ? 'Mute SFX Synth' : 'Enable SFX Synth'}
                >
                  {isSfxOn ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{isSfxOn ? 'SFX ON' : 'SFX OFF'}</span>
                </button>

                <button
                  onClick={toggleVoice}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-semibold transition-all flex items-center gap-1.5 touch-manipulation ${
                    isVoiceOn
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title={isVoiceOn ? 'Mute AI Hype Caster Voice' : 'Enable AI Hype Caster Voice'}
                  aria-label={isVoiceOn ? 'Mute AI Hype Caster Voice' : 'Enable AI Hype Caster Voice'}
                >
                  {isVoiceOn ? <Mic className="w-3.5 h-3.5 text-violet-400" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span>{isVoiceOn ? 'VOICE ON' : 'VOICE OFF'}</span>
                </button>
              </div>

              {/* Sabotage & Power-Up Deck (If Enabled) */}
              {onTriggerPowerUp && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      soundSynth.glitch();
                      onTriggerPowerUp('uno_reverse');
                    }}
                    className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[9px] font-cyber font-bold flex items-center gap-1 border border-violet-400/40 shadow-sm transition-all active:scale-95 touch-manipulation"
                    title="Uno Reverse: Swap distractor options or +5s time"
                  >
                    <span>🔄</span>
                    <span>REV</span>
                  </button>

                  <button
                    onClick={() => {
                      soundSynth.levelUp();
                      onTriggerPowerUp('sigma_shield');
                    }}
                    className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[9px] font-cyber font-bold flex items-center gap-1 border border-emerald-400/40 shadow-sm transition-all active:scale-95 touch-manipulation"
                    title="Sigma Shield: Protect combo streak from 1 wrong answer"
                  >
                    <Shield className="w-3 h-3" />
                    <span>SHIELD</span>
                  </button>

                  <button
                    onClick={() => {
                      soundSynth.airhorn();
                      onTriggerPowerUp('gigachad_focus');
                    }}
                    className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black text-[9px] font-cyber font-black flex items-center gap-1 border border-amber-300 shadow-sm transition-all active:scale-95 animate-pulse touch-manipulation"
                    title="GigaChad Mode: 2.5x point multiplier if solved fast!"
                  >
                    <Flame className="w-3 h-3 fill-current" />
                    <span>GIGA</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* The ONE BUTTON To Open/Close AuraBot Options */}
        <button
          onClick={() => {
            soundSynth.click();
            setIsOpen(!isOpen);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl border transition-all duration-200 select-none shadow-lg active:scale-95 min-h-[40px] touch-manipulation ${
            isOpen
              ? 'bg-violet-900/60 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              : 'bg-slate-950/90 hover:bg-slate-900 border-violet-500/40 hover:border-cyan-400/80 text-white shadow-[0_0_15px_rgba(124,58,237,0.35)] backdrop-blur-xl hover:scale-105'
          }`}
          title={isOpen ? 'Click to close AuraBot options' : 'Click to open AuraBot reactions & audio controls'}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close AuraBot menu' : 'Open AuraBot reactions and audio controls'}
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-900/80 to-purple-700/50 border border-violet-400/60 flex items-center justify-center text-sm shadow shrink-0">
            🤖
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-cyber font-black text-xs tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-cyan-300 to-white">
              AURABOT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white ml-0.5 transition-transform" />
          )}
        </button>
      </div>
    </>
  );
};
