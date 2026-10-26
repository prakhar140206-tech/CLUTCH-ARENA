import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { API_BASE_URL } from '../config/api.js';
import { 
  DSATopic, 
  SupportedLanguage, 
  ChallengeType, 
  DSAOnboardingPreferences 
} from '../../../shared/types.js';
import {
  Settings,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Eye,
  Monitor,
  Code2,
  Trash2,
  LogOut,
  Sparkles,
  Check,
  RotateCcw,
  ShieldAlert,
  BrainCircuit,
  GraduationCap,
  Target,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);
  const logoutUser = useGameStore((s) => s.logoutUser);
  const is3DFallback = useGameStore((s) => s.is3DFallback);
  const toggle3DFallback = useGameStore((s) => s.toggle3DFallback);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const editorTheme = useGameStore((s) => s.editorTheme);
  const editorFontSize = useGameStore((s) => s.editorFontSize);
  const preferredLanguage = useGameStore((s) => s.preferredLanguage);
  const setEditorSettings = useGameStore((s) => s.setEditorSettings);
  const setOnboardingOpen = useGameStore((s) => s.setOnboardingOpen);
  const setDSAPreferences = useGameStore((s) => s.setDSAPreferences);

  const existingPrefs = userProfile.dsaPreferences;

  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [voiceOn, setVoiceOn] = useState<boolean>(soundSynth.isVoiceEnabled());

  // DSA Adaptive Preferences State
  const [dsaLanguages, setDsaLanguages] = useState<SupportedLanguage[]>(
    existingPrefs?.languages?.length ? existingPrefs.languages : ['python']
  );
  const [dsaExperience, setDsaExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'assess_my_level'>(
    existingPrefs?.experienceLevel || 'intermediate'
  );
  const [dsaPacing, setDsaPacing] = useState<'steady' | 'balanced' | 'aggressive' | 'accelerated' | 'mastery_first'>(
    existingPrefs?.progressionPacing || 'steady'
  );
  const [dsaTopics, setDsaTopics] = useState<DSATopic[]>(
    existingPrefs?.preferredTopics?.length ? existingPrefs.preferredTopics : ['arrays_and_strings', 'searching_and_sorting']
  );
  const [dsaFormats, setDsaFormats] = useState<ChallengeType[]>(
    existingPrefs?.preferredFormats?.length ? existingPrefs.preferredFormats : ['mcq', 'code_sprint']
  );
  const [savingDSA, setSavingDSA] = useState<boolean>(false);

  const toggleDsaLanguage = (lang: SupportedLanguage) => {
    if (dsaLanguages.includes(lang)) {
      if (dsaLanguages.length > 1) setDsaLanguages(dsaLanguages.filter(l => l !== lang));
    } else {
      setDsaLanguages([...dsaLanguages, lang]);
    }
  };

  const toggleDsaTopic = (topic: DSATopic) => {
    if (dsaTopics.includes(topic)) {
      if (dsaTopics.length > 1) setDsaTopics(dsaTopics.filter(t => t !== topic));
    } else {
      setDsaTopics([...dsaTopics, topic]);
    }
  };

  const toggleDsaFormat = (fmt: ChallengeType) => {
    if (dsaFormats.includes(fmt)) {
      if (dsaFormats.length > 1) setDsaFormats(dsaFormats.filter(f => f !== fmt));
    } else {
      setDsaFormats([...dsaFormats, fmt]);
    }
  };

  const handleSaveDSAPreferences = async () => {
    setSavingDSA(true);
    soundSynth.levelUp();
    const updated: DSAOnboardingPreferences = {
      userId: userProfile.id,
      languages: dsaLanguages,
      experienceLevel: dsaExperience,
      preferredTopics: dsaTopics,
      preferredFormats: dsaFormats,
      goals: existingPrefs?.goals || ['interview_prep'],
      progressionPacing: dsaPacing,
      diagnosticScore: existingPrefs?.diagnosticScore,
      assessedLevel: existingPrefs?.assessedLevel,
      completedAt: Date.now()
    };

    try {
      await fetch(`${API_BASE_URL}/api/user/dsa-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {}

    setDSAPreferences(updated);
    updateUserProfile({
      dsaPreferences: updated,
      preferredLanguage: dsaLanguages[0]
    });
    setSavingDSA(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const ALL_TOPIC_OPTIONS: { id: DSATopic; label: string }[] = [
    { id: 'arrays_and_strings', label: 'Arrays & Strings' },
    { id: 'searching_and_sorting', label: 'Search & Sort' },
    { id: 'linked_lists', label: 'Linked Lists' },
    { id: 'stacks_and_queues', label: 'Stacks & Queues' },
    { id: 'recursion_and_backtracking', label: 'Recursion' },
    { id: 'trees_and_bst', label: 'Trees & BST' },
    { id: 'graphs', label: 'Graphs' },
    { id: 'greedy_algorithms', label: 'Greedy' },
    { id: 'dynamic_programming', label: 'DP' },
    { id: 'hashing', label: 'Hashing' },
    { id: 'heaps_and_priority_queues', label: 'Heaps' },
    { id: 'bit_manipulation', label: 'Bitwise' },
    { id: 'complexity_analysis', label: 'Complexity' }
  ];

  const ALL_FORMAT_OPTIONS: { id: ChallengeType; label: string }[] = [
    { id: 'mcq', label: 'Multiple Choice' },
    { id: 'code_sprint', label: 'Coding Sprint' },
    { id: 'bug_hunter', label: 'Debugging' },
    { id: 'predict_output', label: 'Code Output' },
    { id: 'complexity', label: 'Complexity Analysis' },
    { id: 'visual_puzzle', label: 'Visual Puzzles' },
    { id: 'fill_in_blank', label: 'Fill-in-the-Blank' },
    { id: 'matching', label: 'Matching Pairs' },
    { id: 'arrange_steps', label: 'Arrange Steps' },
    { id: 'pseudocode', label: 'Pseudocode Tracing' },
    { id: 'interactive_array', label: '3D/2D Array Matrix' }
  ];

  const handleToggleVoice = () => {
    const next = soundSynth.toggleVoice();
    setVoiceOn(next);
  };

  const handleToggleAudio = () => {
    toggleSfx();
    soundSynth.toggleSfx();
  };

  const handleSave = () => {
    soundSynth.levelUp();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleLogout = () => {
    soundSynth.vineBoom();
    logoutUser();
    setScreen('home');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset local settings and combat stats?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <AppShell activeScreen="settings">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-clutch-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-cyber font-bold text-xl text-white">
                CLIENT SETTINGS
              </h1>
              <p className="text-xs font-mono text-clutch-muted">
                Configure audio synthesis, 3D graphics rendering, and IDE preferences
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="clutch-btn-primary px-5 py-2 text-xs flex items-center gap-1.5"
          >
            {savedToast ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{savedToast ? 'Saved ✔' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Section 1: Audio Engine */}
        <div className="clutch-panel rounded-2xl p-6">
          <h2 className="font-cyber font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-clutch-lavender" />
            <span>SYNTHETIC AUDIO ENGINE</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-clutch-border">
              <div>
                <div className="text-sm font-semibold text-white">Synthesizer Sound Effects</div>
                <div className="text-xs font-mono text-clutch-muted">Web Audio API procedural sound cues (clicks, vine booms, level-ups)</div>
              </div>
              <button
                onClick={handleToggleAudio}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  sfxEnabled ? 'bg-clutch-violet' : 'bg-clutch-surface-light border border-clutch-border'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${sfxEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-semibold text-white">Speech Synthesis Hype Caster</div>
                <div className="text-xs font-mono text-clutch-muted">Speech synthesis caster announcing streaks and round results</div>
              </div>
              <button
                onClick={handleToggleVoice}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  voiceOn ? 'bg-clutch-violet' : 'bg-clutch-surface-light border border-clutch-border'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${voiceOn ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Graphics & Rendering */}
        <div className="clutch-panel rounded-2xl p-6">
          <h2 className="font-cyber font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-clutch-lavender" />
            <span>GRAPHICS & 3D HARDWARE</span>
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-semibold text-white">Low-Power 2D Fallback Mode</div>
              <div className="text-xs font-mono text-clutch-muted">Bypasses WebGL 3D rendering to save GPU and battery on low-end hardware</div>
            </div>
            <button
              onClick={toggle3DFallback}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                is3DFallback ? 'bg-clutch-amber' : 'bg-clutch-surface-light border border-clutch-border'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${is3DFallback ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section 3: Code Editor Preferences */}
        <div className="clutch-panel rounded-2xl p-6">
          <h2 className="font-cyber font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-clutch-lavender" />
            <span>CODE SPRINT PREFERENCES</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-1.5">DEFAULT PROGRAMMING LANGUAGE</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setEditorSettings({ preferredLanguage: e.target.value as any })}
                className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node)</option>
                <option value="cpp">C++ (G++17)</option>
                <option value="java">Java 21</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-1.5">EDITOR FONT SIZE</label>
              <select
                value={editorFontSize}
                onChange={(e) => setEditorSettings({ editorFontSize: Number(e.target.value) })}
                className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
              >
                <option value={12}>12px (Compact)</option>
                <option value={14}>14px (Standard)</option>
                <option value={16}>16px (Comfortable)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: DSA Adaptive Learning Engine Preferences */}
        <div className="clutch-panel rounded-2xl p-6 border-cyan-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-clutch-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-cyber font-bold text-sm text-white">DSA ADAPTIVE ENGINE PREFERENCES</h2>
                <p className="text-xs font-mono text-clutch-muted">Personalize programming languages, learning progression, topic focus, and question types</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnboardingOpen(true)}
                className="clutch-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 border-purple-500/40 text-purple-300 hover:border-purple-400"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Recalibrate Diagnostic</span>
              </button>
              <button
                onClick={handleSaveDSAPreferences}
                disabled={savingDSA}
                className="clutch-btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingDSA ? 'Saving...' : 'Apply Preferences'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* Languages */}
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-2 font-semibold">
                ACTIVE PROGRAMMING LANGUAGES (Select one or more)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'python' as SupportedLanguage, label: 'Python 3' },
                  { id: 'cpp' as SupportedLanguage, label: 'C++ (G++17)' },
                  { id: 'java' as SupportedLanguage, label: 'Java 21' },
                  { id: 'javascript' as SupportedLanguage, label: 'JavaScript' },
                  { id: 'c' as SupportedLanguage, label: 'C (GCC)' }
                ].map((lang) => {
                  const active = dsaLanguages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => toggleDsaLanguage(lang.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        active
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-clutch-surface-light border-clutch-border text-clutch-muted hover:border-clutch-subtle'
                      }`}
                    >
                      {active ? '✔ ' : '+ '}{lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Level & Progression Pacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5 font-semibold">
                  EXPERIENCE LEVEL
                </label>
                <select
                  value={dsaExperience}
                  onChange={(e) => setDsaExperience(e.target.value as any)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-cyan-400 font-mono capitalize"
                >
                  <option value="beginner">Beginner (Foundations & Easy)</option>
                  <option value="intermediate">Intermediate (Medium Tier)</option>
                  <option value="advanced">Advanced (Hard & Extreme)</option>
                  <option value="assess_my_level">Assess My Level (Diagnostic Calibrated)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5 font-semibold">
                  DIFFICULTY PROGRESSION PACING
                </label>
                <select
                  value={dsaPacing}
                  onChange={(e) => setDsaPacing(e.target.value as any)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-cyan-400 font-mono capitalize"
                >
                  <option value="steady">Steady (Patient, 3+ fast proofs before tier promotion)</option>
                  <option value="balanced">Balanced (Standard adaptive scaling)</option>
                  <option value="aggressive">Aggressive (Rapid promotion to higher tiers)</option>
                </select>
              </div>
            </div>

            {/* Question Formats */}
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-2 font-semibold">
                PREFERRED QUESTION FORMATS (Adaptive engine prioritizes these)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_FORMAT_OPTIONS.map((fmt) => {
                  const active = dsaFormats.includes(fmt.id);
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => toggleDsaFormat(fmt.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                        active
                          ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-semibold'
                          : 'bg-clutch-surface-light border-clutch-border text-clutch-subtle hover:border-clutch-muted'
                      }`}
                    >
                      {active ? '● ' : '○ '}{fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Topics */}
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-2 font-semibold">
                CORE DSA TOPIC FOCUS (13 Disciplines)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TOPIC_OPTIONS.map((topic) => {
                  const active = dsaTopics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleDsaTopic(topic.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                        active
                          ? 'bg-clutch-violet/20 border-clutch-violet text-clutch-lavender font-semibold'
                          : 'bg-clutch-surface-light border-clutch-border text-clutch-subtle hover:border-clutch-muted'
                      }`}
                    >
                      {active ? '✔ ' : '+ '}{topic.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Account Actions */}
        <div className="clutch-panel rounded-2xl p-6 border-clutch-rose/30">
          <h2 className="font-cyber font-bold text-sm text-clutch-rose mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>ACCOUNT & STORAGE</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-clutch-muted">
              Pilot session: <strong className="text-white">{userProfile.username}</strong> ({userProfile.isGuest ? 'Guest' : 'Authenticated'})
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleResetData}
                className="clutch-btn-ghost text-xs text-clutch-muted hover:text-white"
              >
                Reset Combat Cache
              </button>

              <button
                onClick={handleLogout}
                className="clutch-btn-secondary py-2 px-4 text-xs text-clutch-rose hover:border-clutch-rose"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
};
