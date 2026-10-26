import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { socketService } from '../services/socketService.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
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
  ShieldAlert
} from 'lucide-react';

export const LobbyScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const activeRoom = useGameStore((s) => s.activeRoom);

  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Custom Arena Configuration State
  const [customMaxPlayers, setCustomMaxPlayers] = useState<number>(70);
  const [customTotalRounds, setCustomTotalRounds] = useState<number>(25);
  const [customRoundSeconds, setCustomRoundSeconds] = useState<number>(20);
  const [customMode, setCustomMode] = useState<any>('mega_arena_100');

  // Launch official 70-Player Tournament Preset (25 Qs, 20s per question)
  const handleStartTournament70 = async () => {
    try {
      soundSynth.airhorn();
      setIsJoining(true);
      setErrorMessage('');
      await socketService.createRoom(userProfile, {
        mode: 'mega_arena_100',
        maxPlayers: 70,
        roundDurationSeconds: 20, // 20s per question
        totalRounds: 25 // 25 questions (~10 min tournament session)
      });
      setScreen('arena_3d');
    } catch (err: any) {
      setErrorMessage(`Error launching 70-Player Tournament: ${err.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleQuickPlay = async (mode: any, maxPlayers: number = 2) => {
    try {
      soundSynth.click();
      setIsJoining(true);
      setErrorMessage('');
      const room = await socketService.createRoom(userProfile, {
        mode,
        maxPlayers,
        roundDurationSeconds: 120,
        totalRounds: 5
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
        roundDurationSeconds: customRoundSeconds,
        totalRounds: customTotalRounds
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
                  ROUND COUNT
                </label>
                <select
                  value={customTotalRounds}
                  onChange={(e) => setCustomTotalRounds(Number(e.target.value))}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                >
                  <option value={3}>3 Rounds (Quick Sprint)</option>
                  <option value={5}>5 Rounds (Standard Match)</option>
                  <option value={10}>10 Rounds (Marathon)</option>
                  <option value={25}>25 Rounds (Tournament Spec)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                  CLOCK PER QUESTION
                </label>
                <select
                  value={customRoundSeconds}
                  onChange={(e) => setCustomRoundSeconds(Number(e.target.value))}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                >
                  <option value={20}>20 Seconds (Blitz Reflex)</option>
                  <option value={60}>60 Seconds (Rapid Solving)</option>
                  <option value={180}>3 Minutes (Code Sprint)</option>
                  <option value={600}>10 Minutes (Standard Algorithm)</option>
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
    </AppShell>
  );
};
