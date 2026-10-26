import React, { useState, useEffect } from 'react';
import { soundSynth } from '../../services/soundSynth.js';
import { Volume2, VolumeX, Mic, MicOff, Zap, Shield, Sparkles, Flame, Eye } from 'lucide-react';

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
  isDockedMobile?: boolean;
  className?: string;
}> = ({ onTriggerPowerUp, activePowerUp, isDockedMobile = true, className = '' }) => {
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);
  const [commentary, setCommentary] = useState<string>('AuraBot 9000 active. Lock in, king!');
  const [casterMood, setCasterMood] = useState<'normal' | 'hype' | 'shocked' | 'sigma'>('normal');
  const [isVoiceOn, setIsVoiceOn] = useState(soundSynth.isVoiceEnabled());
  const [isSfxOn, setIsSfxOn] = useState(soundSynth.isSfxEnabled());
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Mobile keyboard detection to prevent toolbar covering code editors or question inputs
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        setIsKeyboardOpen(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        setIsKeyboardOpen(false);
      }
    };
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

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

  // Keyboard shortcuts 1-8 for emotes
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
      {/* Floating Emote Overlay (Pass-through clicks) */}
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

      {/* AuraBot Reaction & Controls Toolbar */}
      <div
        className={`${
          isKeyboardOpen ? 'hidden md:flex' : 'flex'
        } ${
          isDockedMobile
            ? 'w-full shrink-0 border-t border-clutch-border/70 bg-clutch-surface/95 backdrop-blur-xl px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-30 md:fixed md:bottom-3 md:left-1/2 md:-translate-x-1/2 md:w-auto md:border-0 md:bg-transparent md:p-0 md:pb-0 md:z-40'
            : 'fixed bottom-2 left-1/2 -translate-x-1/2 z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-2'
        } flex-col items-center gap-1 max-w-full select-none ${className}`}
      >
        {/* Active Power-up Status Banner */}
        {activePowerUp && (
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black font-cyber font-black text-[10px] tracking-wider animate-pulse flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.6)] shrink-0">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>BUFF ACTIVE: {activePowerUp.toUpperCase().replace('_', ' ')}</span>
          </div>
        )}

        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-slate-950/95 sm:bg-slate-950/90 border border-violet-500/30 backdrop-blur-xl shadow-2xl w-full sm:w-auto max-w-full overflow-hidden">
          {/* AI Caster Mini Face */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 pr-1.5 sm:pr-2 border-r border-slate-800 shrink-0">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-cyber text-xs border shrink-0 ${
                casterMood === 'hype'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-bounce'
                  : 'bg-violet-900/40 border-violet-500/50 text-cyan-300'
              }`}
              title="AuraBot 9000 (AI Hype Caster)"
              aria-label="AuraBot 9000 Status"
            >
              🤖
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] font-cyber font-bold text-cyan-400 tracking-wider">AURABOT</span>
              <span className="text-[8px] font-mono text-slate-400 max-w-[120px] truncate">{commentary}</span>
            </div>
          </div>

          {/* Quick Reaction Emojis (Touch-scrollable on narrow mobile) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5 touch-pan-x flex-1 sm:flex-none">
            {MEME_EMOTES.map((item, idx) => (
              <button
                key={item.emoji}
                onClick={() => spawnEmote(item.emoji)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-900/90 hover:bg-violet-600/30 active:scale-95 border border-slate-800 hover:border-cyan-400/50 transition-all flex items-center justify-center text-xs sm:text-sm relative group shrink-0 touch-manipulation"
                title={`${item.label} (Press ${idx + 1})`}
                aria-label={`Send emote: ${item.label}`}
              >
                <span>{item.emoji}</span>
                <span className="hidden md:inline absolute -top-1 -right-1 text-[8px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 bg-black px-1 rounded-full border border-slate-700">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Sabotage & Power-Up Deck (If Enabled) */}
          {onTriggerPowerUp && (
            <div className="flex items-center gap-1 pl-1 sm:pl-1.5 border-l border-slate-800 shrink-0">
              <button
                onClick={() => {
                  soundSynth.glitch();
                  onTriggerPowerUp('uno_reverse');
                }}
                className="px-2 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-cyber font-bold flex items-center gap-1 border border-violet-400/40 shadow-sm transition-all active:scale-95 shrink-0 touch-manipulation"
                title="Uno Reverse: Swap distractor options or +5s time"
              >
                <span>🔄</span>
                <span className="hidden md:inline">REV</span>
              </button>

              <button
                onClick={() => {
                  soundSynth.levelUp();
                  onTriggerPowerUp('sigma_shield');
                }}
                className="px-2 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-cyber font-bold flex items-center gap-1 border border-emerald-400/40 shadow-sm transition-all active:scale-95 shrink-0 touch-manipulation"
                title="Sigma Shield: Protect combo streak from 1 wrong answer"
              >
                <Shield className="w-3 h-3" />
                <span className="hidden md:inline">SHIELD</span>
              </button>

              <button
                onClick={() => {
                  soundSynth.airhorn();
                  onTriggerPowerUp('gigachad_focus');
                }}
                className="px-2 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black text-[10px] font-cyber font-black flex items-center gap-1 border border-amber-300 shadow-sm transition-all active:scale-95 shrink-0 touch-manipulation animate-pulse"
                title="GigaChad Mode: 2.5x point multiplier if solved fast!"
              >
                <Flame className="w-3 h-3 fill-current" />
                <span className="hidden md:inline">GIGA</span>
              </button>
            </div>
          )}

          {/* Audio / Voice Toggles */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800 shrink-0">
            <button
              onClick={toggleSound}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-colors flex items-center justify-center shrink-0 touch-manipulation ${
                isSfxOn
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={isSfxOn ? 'Mute SFX Synth' : 'Enable SFX Synth'}
              aria-label={isSfxOn ? 'Mute SFX Synth' : 'Enable SFX Synth'}
            >
              {isSfxOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleVoice}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-colors flex items-center justify-center shrink-0 touch-manipulation ${
                isVoiceOn
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={isVoiceOn ? 'Mute AI Hype Caster Voice' : 'Enable AI Hype Caster Voice'}
              aria-label={isVoiceOn ? 'Mute AI Hype Caster Voice' : 'Enable AI Hype Caster Voice'}
            >
              {isVoiceOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
