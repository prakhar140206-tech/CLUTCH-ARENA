import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { RoundReviewOverlay } from '../components/arena/RoundReviewOverlay.js';
import {
  Swords,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Terminal,
  Send,
  HelpCircle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Code,
  FileText,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';

export const ArenaScreen: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);
  const setScreen = useGameStore((s) => s.setScreen);
  const lastResult = useGameStore((s) => s.lastSubmissionResult);

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(18);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'code' | 'options'>('options');
  const [peekCodeOpen, setPeekCodeOpen] = useState<boolean>(false);

  const roundStartTimeRef = useRef<number>(Date.now());

  // Dual/Question timer sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRoom?.questionExpiresAt || activeRoom?.roundExpiresAt) {
        const qExp = activeRoom.questionExpiresAt || activeRoom.roundExpiresAt!;
        const remainingQ = Math.max(0, Math.ceil((qExp - Date.now()) / 1000));
        setTimeLeft(remainingQ);
      } else {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 18));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoom?.roundExpiresAt, activeRoom?.questionExpiresAt]);

  useEffect(() => {
    if (activeRoom?.status === 'in_round') {
      roundStartTimeRef.current = Date.now();
      setSelectedOption('');
      setShowHint(false);
    }
  }, [activeRoom?.currentRound, activeRoom?.status]);

  const challenge = activeRoom?.activeChallenge;

  // Fallback mock challenge matching the screenshot if no room is loaded
  const fallbackChallenge = {
    id: 'ch-rev-linked-list',
    title: 'REVERSE A LINKED LIST',
    topic: 'linked_lists',
    difficulty: 'medium',
    prompt: 'Given the head of a singly linked list, reverse the list and return its head.',
    codeSnippet: `def reverseList(head):
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev`,
    options: [
      'def head(i): return ctread(1)',
      'def code(i): return dtread(1)',
      'def code(i): return ctread(2)',
      'def code(i): return btread(1)'
    ],
    hint: 'Use three pointers: prev, curr, and next_temp to reverse references in place in O(N) time and O(1) space.',
    hints: ['Use three pointers: prev, curr, and next_temp to reverse references in place in O(N) time and O(1) space.'],
    explanation: 'Reverse singly linked list iteratively using three pointers in O(N) time.'
  };

  const activeChallenge = challenge || fallbackChallenge;
  const options = activeChallenge.options || fallbackChallenge.options;

  // Find Opponent
  const participantsList = activeRoom ? Object.values(activeRoom.participants) : [];
  const opponent =
    participantsList.find((p) => p.id !== userProfile.id) || {
      id: 'bot_cyber_knight',
      username: 'cyber_knight',
      score: 180,
      loadout: { color: '#06b6d4', visorGlow: '#06b6d4', meshStyle: 'cyber_ninja' as const, trailEffect: 'electric_cyan' as const, emote: 'wave' as const }
    };

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitting) return;
    soundSynth.click();
    setIsSubmitting(true);
    try {
      const timeTakenMs = Math.max(300, Date.now() - roundStartTimeRef.current);
      if (activeRoom) {
        await socketService.submitAnswer({
          roomId: activeRoom.id,
          challengeId: activeChallenge.id,
          roundIndex: activeRoom.currentRound,
          answer: selectedOption,
          timeTakenMs
        });
      } else {
        soundSynth.auraGlow();
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyCode = () => {
    if (activeChallenge.codeSnippet) {
      navigator.clipboard.writeText(activeChallenge.codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    }
  };

  return (
    <AppShell activeScreen="arena_3d">
      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-7xl mx-auto font-sans pb-6">
        {/* =========================================================
            1. MATCH ARENA HEADER BANNER (P1 VS P2 + Responsive Timer)
            ========================================================= */}
        <div className="w-full rounded-2xl bg-[#0f151c]/95 border border-emerald-500/30 p-3.5 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.7),0_0_20px_rgba(34,197,94,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Player 1 (Left) */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg text-white border-2 border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.5)] shrink-0"
                style={{ backgroundColor: userProfile.avatar?.color || '#10b981' }}
              >
                {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'G'}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-xs font-mono font-bold text-slate-400 uppercase">
                  Player 1
                </span>
                <span className="font-cyber font-black text-xs sm:text-base text-white tracking-wide truncate max-w-[90px] xs:max-w-[120px] sm:max-w-none">
                  {userProfile.username || 'GR36_99'}
                </span>
                <span className="text-[9px] sm:text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                  <span>🏆</span> {userProfile.ratingMMR || 2140}
                </span>
              </div>
            </div>

            {/* Center: Stylized Metallic VS + Glowing Countdown Clock */}
            <div className="flex flex-col items-center justify-center shrink-0 px-1 sm:px-6">
              <span className="font-cyber font-black text-sm sm:text-2xl text-slate-200 tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                VS
              </span>

              {/* Central Clock Pill Badge with Urgency Pulse */}
              <div
                className={`mt-1 px-3 sm:px-6 py-0.5 sm:py-1 rounded-full border flex items-center gap-1.5 font-mono font-black text-xs sm:text-lg transition-all ${
                  timeLeft <= 15
                    ? 'border-rose-500 bg-rose-950/60 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                    : 'border-emerald-500/40 bg-[#0a0f14] text-cyan-400 shadow-[0_0_15px_rgba(34,197,94,0.35)]'
                }`}
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-inherit" />
                <span>{formatCountdown(timeLeft)}</span>
              </div>
            </div>

            {/* Player 2 (Right) */}
            <div className="flex items-center gap-2 sm:gap-4 justify-end min-w-0 text-right">
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-xs font-mono font-bold text-slate-400 uppercase">
                  Player 2
                </span>
                <span className="font-cyber font-black text-xs sm:text-base text-white tracking-wide truncate max-w-[90px] xs:max-w-[120px] sm:max-w-none">
                  {opponent.username}
                </span>
                <span className="text-[9px] sm:text-xs font-mono font-bold text-amber-400 flex items-center gap-1 justify-end">
                  <span>🏆</span> {opponent.score ? 2890 : 2890}
                </span>
              </div>

              <div
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg text-white border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0"
                style={{ backgroundColor: (opponent as any).loadout?.color || (opponent as any).avatar?.color || '#06b6d4' }}
              >
                {opponent.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            MOBILE TACTICAL TAB SWITCHER (Visible only on < lg screens)
            ========================================================= */}
        <div className="flex lg:hidden items-center p-1 rounded-xl bg-[#090d11] border border-white/10 gap-1 shadow-sm">
          <button
            onClick={() => setMobileTab('code')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-cyber font-bold flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'code'
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>CODE &amp; SPEC</span>
          </button>

          <button
            onClick={() => setMobileTab('options')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-cyber font-bold flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'options'
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>ANSWERS ({selectedOption ? '1 Selected' : '4'})</span>
          </button>
        </div>

        {/* =========================================================
            2. CENTRAL BATTLEFIELD: CODE BOX (LEFT) + OPTIONS (RIGHT)
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Left Column: Code Editor & Problem Spec (Hidden on mobile if user selected options tab) */}
          <div
            className={`lg:col-span-8 rounded-2xl bg-[#0f151c]/95 border border-white/10 p-3.5 sm:p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.7)] relative overflow-hidden ${
              mobileTab === 'options' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Top Editor Tab Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#151d26] border-t border-x border-emerald-500/30 text-emerald-400 font-bold text-xs">
                  <Terminal className="w-3 h-3" />
                  <span>code.py</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-slate-500 text-[11px]">
                  <span>python</span>
                  <span>&gt;</span>
                  <span>alg</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyCode}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Problem Title & Description Banner */}
            <div className="mb-3.5">
              <h3 className="font-cyber font-black text-xs sm:text-base text-emerald-400 tracking-wider uppercase mb-1">
                {activeChallenge.title || 'REVERSE A LINKED LIST'}
              </h3>
              <p className="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed">
                {activeChallenge.prompt}
              </p>
            </div>

            {/* Code Workspace with Line Numbers */}
            <div className="flex-1 bg-[#090d10] rounded-xl border border-white/5 p-3 sm:p-4 font-mono text-xs text-slate-200 overflow-x-auto relative flex min-h-[220px]">
              {/* Line Numbers */}
              <div className="select-none text-slate-600 pr-2.5 sm:pr-4 text-right border-r border-white/5 font-mono text-[11px] leading-5 shrink-0">
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Syntax Highlighted Code */}
              <div className="pl-2.5 sm:pl-4 flex-1 overflow-x-auto leading-5 text-[11px] sm:text-xs">
                <pre className="text-slate-200">
                  <span className="text-purple-400">def</span> <span className="text-blue-400">reverseList</span>(head):{'\n'}
                  {'    '}prev = <span className="text-cyan-400">None</span>{'\n'}
                  {'    '}curr = head{'\n'}
                  {'    '}<span className="text-purple-400">while</span> curr:{'\n'}
                  {'        '}next_temp = curr.next{'\n'}
                  {'        '}curr.next = prev{'\n'}
                  {'        '}prev = curr{'\n'}
                  {'        '}curr = next_temp{'\n'}
                  {'    '}<span className="text-purple-400">return</span> prev{'\n'}
                  {'\n'}
                  <span className="text-slate-500"># verify head pointer integrity</span>{'\n'}
                  <span className="text-cyan-300">print</span>(<span className="text-emerald-400">"Reversed head:"</span>, reverseList(head))
                </pre>
              </div>
            </div>

            {/* AI Hint Drawer (Expandable) */}
            {showHint && (
              <div className="mt-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 font-mono text-xs text-cyan-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-300">AuraBot Tactical Hint:</strong>{' '}
                  {(activeChallenge as any).hints?.[0] || (activeChallenge as any).hint || (activeChallenge as any).explanation || fallbackChallenge.hint}
                </div>
              </div>
            )}

            {/* Mobile Next Action: Switch to Options */}
            <div className="lg:hidden mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 rounded-xl bg-[#141b22] border border-white/10 text-xs font-mono text-slate-300 hover:text-cyan-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
              </button>

              <button
                onClick={() => setMobileTab('options')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-cyber font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <span>Select Answer ({options.length} options) →</span>
              </button>
            </div>
          </div>

          {/* Right Column: 4 Option Cards & Action Dock (Hidden on mobile if user selected code tab) */}
          <div
            className={`lg:col-span-4 flex flex-col justify-between gap-3 sm:gap-4 ${
              mobileTab === 'code' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Mobile Collapsible Peek Code Accordion */}
            <div className="lg:hidden">
              <button
                onClick={() => setPeekCodeOpen(!peekCodeOpen)}
                className="w-full p-2.5 rounded-xl bg-[#141b22] border border-white/10 hover:border-emerald-500/30 text-xs font-mono text-slate-300 flex items-center justify-between transition-colors shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Peek Problem &amp; Code</span>
                </span>
                {peekCodeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {peekCodeOpen && (
                <div className="mt-2 p-3 rounded-xl bg-[#0a0f14] border border-emerald-500/30 font-mono text-xs text-slate-200 overflow-x-auto max-h-48 animate-fade-in shadow-inner">
                  <p className="text-[11px] text-emerald-400 font-bold mb-1.5">{activeChallenge.prompt}</p>
                  <pre className="text-[11px] leading-relaxed text-slate-300 whitespace-pre">
                    {activeChallenge.codeSnippet || fallbackChallenge.codeSnippet}
                  </pre>
                </div>
              )}
            </div>

            {/* 4 Options Stack */}
            <div className="flex flex-col gap-2.5 sm:gap-3 flex-1">
              {options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === opt;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      soundSynth.click();
                      setSelectedOption(opt);
                    }}
                    className={`w-full p-3 sm:p-4 rounded-xl border text-left font-mono transition-all flex items-center gap-3 min-h-[52px] sm:min-h-[56px] active:scale-[0.99] touch-manipulation ${
                      isSelected
                        ? 'bg-[#15231c] border-emerald-400 shadow-[0_0_18px_rgba(34,197,94,0.4)] text-white scale-[1.01]'
                        : 'bg-[#11171d]/90 border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white'
                    }`}
                  >
                    {/* Emerald Letter Badge (A, B, C, D) */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-cyber font-black text-xs sm:text-sm shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                          : 'bg-[#162029] text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {letter}
                    </div>

                    {/* Option Text */}
                    <span className="text-xs sm:text-sm font-mono truncate flex-1">
                      {opt}
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI Hint Trigger Button */}
            <button
              onClick={() => setShowHint(!showHint)}
              className="w-full py-2 sm:py-2.5 px-4 rounded-xl bg-[#141b22] border border-white/10 hover:border-cyan-500/40 text-xs font-mono font-bold text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showHint ? 'Hide Tactical Hint' : 'AI Tactical Hint'}</span>
            </button>

            {/* Giant Cyber Action Button: "LOCK & SUBMIT ANSWER" (Desktop & Tablet) */}
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || isSubmitting}
              className="w-full clutch-btn-neon py-3.5 sm:py-4 text-sm sm:text-base font-black tracking-wider items-center justify-center gap-2 uppercase active:scale-95 shadow-[0_0_30px_rgba(34,197,94,0.5)] hidden lg:flex"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>LOCK &amp; SUBMIT ANSWER</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            STICKY MOBILE BOTTOM SUBMIT BAR (Thumb-friendly & always visible)
            ========================================================= */}
        <div className="lg:hidden sticky bottom-1 z-30 pt-2 pb-1">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-[#090d10]/95 border border-emerald-500/40 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.95),0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0 pl-1.5">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Your Selection</span>
              <span className="text-xs font-mono font-black text-emerald-400 truncate">
                {selectedOption
                  ? `[${String.fromCharCode(65 + options.indexOf(selectedOption))}] ${selectedOption.slice(0, 16)}${selectedOption.length > 16 ? '...' : ''}`
                  : 'Tap an option above'}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedOption || isSubmitting}
              className={`py-2.5 px-5 rounded-xl font-cyber font-black text-xs tracking-wider uppercase flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md ${
                selectedOption && !isSubmitting
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.6)] cursor-pointer'
                  : 'bg-white/10 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'LOCKING...' : 'LOCK & SUBMIT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Round & Match Victory Ceremony Overlay */}
      <RoundReviewOverlay />
    </AppShell>
  );
};
