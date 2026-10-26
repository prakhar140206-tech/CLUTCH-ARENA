import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { DSAOnboardingModal } from '../components/onboarding/DSAOnboardingModal.js';
import { MatchDurationMinutes, PerQuestionSeconds } from '../../../shared/types.js';
import {
  Swords,
  Users,
  Bot,
  Compass,
  ArrowRight,
  Plus,
  Lock,
  Trophy,
  Flame,
  Clock,
  Sparkles,
  Zap,
  Sliders,
  X,
  Target,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  BrainCircuit,
  Timer
} from 'lucide-react';

export const LobbyScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const activeRoom = useGameStore((s) => s.activeRoom);
  const serverConnected = useGameStore((s) => s.serverConnected);

  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedMatchDuration = useGameStore((s) => s.selectedMatchDuration);
  const setSelectedMatchDuration = useGameStore((s) => s.setSelectedMatchDuration);
  const selectedQuestionTimer = useGameStore((s) => s.selectedQuestionTimer);
  const setSelectedQuestionTimer = useGameStore((s) => s.setSelectedQuestionTimer);
  const setOnboardingOpen = useGameStore((s) => s.setOnboardingOpen);

  // Custom Arena Configuration State
  const [customMaxPlayers, setCustomMaxPlayers] = useState<number>(70);
  const [customMode, setCustomMode] = useState<any>('mega_arena_100');

  // Launch official 70-Player Tournament Preset (universal time-based endless match)
  const handleStartTournament70 = async () => {
    try {
      soundSynth.airhorn();
      setIsJoining(true);
      setErrorMessage('');
      await socketService.createRoom(userProfile, {
        mode: 'mega_arena_100',
        maxPlayers: 70,
        matchDurationMinutes: selectedMatchDuration,
        questionDurationSeconds: selectedQuestionTimer,
        roundDurationSeconds: selectedQuestionTimer,
        totalRounds: 9999
      });
      setScreen('arena_3d');
    } catch (err: any) {
      setErrorMessage(`Error launching 70-Player Tournament: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleQuickPlay = async (mode: any, maxPlayers: number = 2) => {
    if (!serverConnected) {
      setErrorMessage('Multiplayer matchmaking requires an active backend server. Please play Solo Quest in offline practice mode!');
      return;
    }
    try {
      soundSynth.click();
      setIsJoining(true);
      setErrorMessage('');
      const room = await socketService.createRoom(userProfile, {
        mode,
        maxPlayers,
        matchDurationMinutes: selectedMatchDuration,
        questionDurationSeconds: selectedQuestionTimer,
        roundDurationSeconds: selectedQuestionTimer,
        totalRounds: 9999
      });
      if (mode === 'ai_arena') {
        await socketService.addBot(room.id, 'balanced');
      }
      setScreen('arena_3d');
    } catch (err: any) {
      setErrorMessage(`Error creating match: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    if (!serverConnected) {
      setErrorMessage('Joining online rooms requires an active backend server. Try Solo Quest for offline practice!');
      return;
    }

    try {
      soundSynth.click();
      setIsJoining(true);
      setErrorMessage('');
      await socketService.joinRoom(joinCodeInput.trim().toUpperCase(), userProfile);
      setScreen('arena_3d');
    } catch (err: any) {
      setErrorMessage(`Could not join arena: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateCustom = async () => {
    try {
      soundSynth.levelUp();
      setIsJoining(true);
      setErrorMessage('');
      await socketService.createRoom(userProfile, {
        mode: customMode,
        maxPlayers: customMaxPlayers,
        matchDurationMinutes: selectedMatchDuration,
        questionDurationSeconds: selectedQuestionTimer,
        roundDurationSeconds: selectedQuestionTimer,
        totalRounds: 9999
      });
      setShowCustomModal(false);
      setScreen('arena_3d');
    } catch (err: any) {
      setErrorMessage(`Error creating custom arena: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <AppShell activeScreen="lobby">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-clutch-rose/10 border border-clutch-rose/40 text-clutch-rose text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-clutch-muted hover:text-white">✕</button>
          </div>
        )}

        {!serverConnected && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">📡</span>
              <div>
                <p className="font-bold text-amber-200">Practice Mode (GitHub Pages Static Host)</p>
                <p className="text-gray-300">Live 1v1 and 70-player multiplayer arenas require an active Node.js server. Solo Quest and Adaptive DSA Practice work locally right now!</p>
              </div>
            </div>
            <button
              onClick={() => setScreen('solo_quest')}
              className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono text-xs font-bold whitespace-nowrap transition"
            >
              Play Solo Quest ⚡
            </button>
          </div>
        )}

        {/* 70-Player Tournament Showcase Banner */}
        <section className="w-full rounded-2xl bg-gradient-to-r from-clutch-surface via-clutch-surface-light to-clutch-surface border border-clutch-border p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-clutch-amber/5 rounded-full blur-[90px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-clutch-amber/20 to-clutch-surface-elevated border border-clutch-amber/40 flex items-center justify-center p-3 shadow-lg shrink-0">
                <img src="/logo.png" alt="CLUTCH" className="w-full h-full object-contain" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded bg-clutch-amber/20 text-clutch-amber border border-clutch-amber/30 text-[10px] font-mono font-bold uppercase">
                    OFFICIAL TOURNAMENT SPEC 🏆
                  </span>
                  <span className="text-[11px] font-mono text-clutch-muted">20s Blitz Clock</span>
                </div>
                <h1 className="font-cyber font-black text-2xl sm:text-3xl text-white tracking-wide">
                  70-PLAYER BLITZ ARENA
                </h1>
                <p className="text-xs sm:text-sm text-clutch-muted max-w-xl font-normal mt-1">
                  70 participants receive synchronized algorithmic questions. 20-second per-question countdowns. Highest accuracy and fastest submission velocity takes the podium.
                </p>
              </div>
            </div>

            <button
              onClick={handleStartTournament70}
              disabled={isJoining}
              className="clutch-btn-primary px-7 py-3.5 text-sm flex items-center gap-2 whitespace-nowrap w-full lg:w-auto justify-center"
            >
              <Zap className="w-4 h-4 text-clutch-amber" />
              <span>{isJoining ? 'Queueing Arena...' : 'Queue 70-Player Match'}</span>
            </button>
          </div>
        </section>

        {/* Universal Time-Based Match Controls */}
        <section className="p-5 rounded-2xl bg-gradient-to-r from-gray-900 via-[#0e1626] to-gray-900 border border-cyan-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-cyan-400" />
                <h3 className="font-cyber font-bold text-base text-white tracking-wide">
                  UNIVERSAL MATCH DURATION & ENGINE SETTINGS
                </h3>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Questions continue endless until match timer expires. Adaptive difficulty scales dynamically.
              </p>
            </div>

            <button
              onClick={() => setOnboardingOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
            >
              <BrainCircuit className="w-4 h-4 text-purple-400" /> Personalize DSA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-800/80">
            {/* Match Duration Selector */}
            <div>
              <label className="text-xs font-mono uppercase text-gray-400 block mb-2">
                Overall Match Duration (Continuous Endless Questions)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([10, 15, 25, 30] as MatchDurationMinutes[]).map(mins => {
                  const isSelected = selectedMatchDuration === mins;
                  return (
                    <button
                      key={mins}
                      onClick={() => setSelectedMatchDuration(mins)}
                      className={`py-2.5 rounded-xl border font-mono text-xs font-bold transition-all ${isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-lg shadow-cyan-500/20'
                          : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                        }`}
                    >
                      {mins} MIN
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-Question Timer Selector */}
            <div>
              <label className="text-xs font-mono uppercase text-gray-400 block mb-2">
                Per-Question Time Limit
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([20, 15] as PerQuestionSeconds[]).map(secs => {
                  const isSelected = selectedQuestionTimer === secs;
                  return (
                    <button
                      key={secs}
                      onClick={() => setSelectedQuestionTimer(secs)}
                      className={`py-2.5 rounded-xl border font-mono text-xs font-bold transition-all ${isSelected
                          ? 'border-purple-400 bg-purple-950/60 text-purple-200 shadow-lg shadow-purple-500/20'
                          : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                        }`}
                    >
                      {secs} SEC {secs === 20 ? '(Default)' : '(Blitz)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Queues & Matchmaking Formats */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-cyber font-bold text-lg text-white">ARENA FORMATS</h2>
              <p className="text-xs font-mono text-clutch-muted">Select matchmaking queue or configure custom room</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1v1 Ranked Duel */}
            <div className="clutch-panel rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender mb-4">
                  <Swords className="w-6 h-6" />
                </div>
                <h3 className="font-cyber font-bold text-base text-white mb-1.5">1v1 Ranked Duel</h3>
                <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                  Head-to-head algorithm duel. Real-time test-case progression, combo streaks, and competitive MMR shifts.
                </p>
              </div>

              <div className="pt-4 border-t border-clutch-border flex items-center justify-between">
                <span className="text-xs font-mono text-clutch-muted">Ranked Elo</span>
                <button
                  onClick={() => handleQuickPlay('duel_1v1', 2)}
                  disabled={isJoining}
                  className="clutch-btn-primary py-2 px-4 text-xs"
                >
                  Find Opponent
                </button>
              </div>
            </div>

            {/* AI Practice Arena */}
            <div className="clutch-panel rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-4">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-cyber font-bold text-base text-white mb-1.5">AI Opponent Arena</h3>
                <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                  Warm up against synthetic adaptive bots designed to test algorithmic speed across edge cases.
                </p>
              </div>

              <div className="pt-4 border-t border-clutch-border flex items-center justify-between">
                <span className="text-xs font-mono text-clutch-muted">Zero MMR Risk</span>
                <button
                  onClick={() => handleQuickPlay('ai_arena', 2)}
                  disabled={isJoining}
                  className="clutch-btn-secondary py-2 px-4 text-xs"
                >
                  Duel Bot
                </button>
              </div>
            </div>

            {/* Custom Private Match */}
            <div className="clutch-panel rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-clutch-lavender mb-4">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="font-cyber font-bold text-base text-white mb-1.5">Custom Private Match</h3>
                <p className="text-xs text-clutch-muted leading-relaxed mb-4">
                  Configure custom player limits, specific round clocks (20s to 600s), and custom challenge topics.
                </p>
              </div>

              <div className="pt-4 border-t border-clutch-border flex items-center justify-between">
                <span className="text-xs font-mono text-clutch-muted">Configurable</span>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="clutch-btn-secondary py-2 px-4 text-xs"
                >
                  Configure Room
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Join by Room Code Section */}
        <section className="clutch-panel rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-cyber font-bold text-base text-white mb-1">JOIN PRIVATE ROOM</h3>
              <p className="text-xs font-mono text-clutch-muted">
                Received a room code from a friend or tournament host? Enter it here to join.
              </p>
            </div>

            <form onSubmit={handleJoinByCode} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="ROOM CODE"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="bg-clutch-surface-light border border-clutch-border text-white text-xs font-mono p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet uppercase tracking-widest min-w-[140px]"
              />
              <button
                type="submit"
                disabled={isJoining || !joinCodeInput.trim()}
                className="clutch-btn-primary px-5 py-2 text-xs"
              >
                Join
              </button>
            </form>
          </div>
        </section>

      </div>

      {/* Custom Match Configuration Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg clutch-panel-elevated rounded-2xl p-6 sm:p-8 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-clutch-border">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-clutch-lavender" />
                <h3 className="font-cyber font-bold text-lg text-white">CUSTOM ARENA CONFIGURATION</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-clutch-subtle hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                  PLAYER CAPACITY
                </label>
                <select
                  value={customMaxPlayers}
                  onChange={(e) => setCustomMaxPlayers(Number(e.target.value))}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                >
                  <option value={2}>2 Combatants (1v1 Duel)</option>
                  <option value={4}>4 Combatants (Squad Clash)</option>
                  <option value={10}>10 Combatants (Party Blitz)</option>
                  <option value={70}>70 Combatants (Grand Tournament)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                  MATCH DURATION (ENDLESS PLAY)
                </label>
                <select
                  value={selectedMatchDuration}
                  onChange={(e) => setSelectedMatchDuration(Number(e.target.value) as any)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                >
                  <option value={10}>10 Minutes (Standard)</option>
                  <option value={15}>15 Minutes (Competitive)</option>
                  <option value={25}>25 Minutes (Tournament)</option>
                  <option value={30}>30 Minutes (Marathon)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                  PER-QUESTION TIMER
                </label>
                <select
                  value={selectedQuestionTimer}
                  onChange={(e) => setSelectedQuestionTimer(Number(e.target.value) as any)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                >
                  <option value={20}>20 Seconds (Standard Rapid)</option>
                  <option value={15}>15 Seconds (Blitz Pro)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateCustom}
                disabled={isJoining}
                className="flex-1 clutch-btn-primary py-3 text-xs"
              >
                Create & Launch Arena
              </button>
              <button
                onClick={() => setShowCustomModal(false)}
                className="clutch-btn-ghost py-3 px-4 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DSA Onboarding & Calibration Modal */}
      <DSAOnboardingModal />
    </AppShell>
  );
};
