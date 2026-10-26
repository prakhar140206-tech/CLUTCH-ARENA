import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { API_BASE_URL } from '../../config/api.js';
import { CLIENT_DIAGNOSTIC_QUESTIONS } from '../../data/defaultChallenges.js';
import { 
  SupportedLanguage, 
  DSATopic, 
  ChallengeType, 
  Difficulty,
  ClientChallenge,
  DSAOnboardingPreferences 
} from '../../../../shared/types.js';
import { 
  Sparkles, 
  Code, 
  Terminal, 
  BrainCircuit, 
  Target, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Award,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';

interface DiagnosticQuestion {
  id: string;
  title: string;
  prompt: string;
  options?: string[];
  codeSnippet?: string;
}

const AVAILABLE_LANGUAGES: Array<{ id: SupportedLanguage; name: string; icon: string }> = [
  { id: 'python', name: 'Python 3', icon: '🐍' },
  { id: 'cpp', name: 'C++ 20', icon: '⚡' },
  { id: 'java', name: 'Java 21', icon: '☕' },
  { id: 'c', name: 'C (ISO C17)', icon: '⚙️' }
];

const EXPERIENCE_LEVELS: Array<{ id: 'beginner' | 'intermediate' | 'advanced' | 'assess_my_level'; title: string; desc: string; icon: string }> = [
  { id: 'beginner', title: 'Novice Explorer', desc: 'New to algorithms or building basic fundamentals', icon: '🌱' },
  { id: 'intermediate', title: 'Data Warrior', desc: 'Comfortable with trees, recursion, sorting & stacks', icon: '⚔️' },
  { id: 'advanced', title: 'Apex Architect', desc: 'Tackles DP, advanced graphs, heaps and amortized bounds', icon: '👑' },
  { id: 'assess_my_level', title: 'Assess My Level', desc: 'Take a rapid 2-minute diagnostic calibration challenge', icon: '🎯' }
];

const DSA_TOPICS_LIST: Array<{ id: DSATopic; name: string }> = [
  { id: 'arrays_and_strings', name: 'Arrays & Strings' },
  { id: 'searching_and_sorting', name: 'Searching & Sorting' },
  { id: 'linked_lists', name: 'Linked Lists' },
  { id: 'stacks_and_queues', name: 'Stacks & Queues' },
  { id: 'recursion_and_backtracking', name: 'Recursion & Backtracking' },
  { id: 'trees_and_bst', name: 'Trees & BST' },
  { id: 'graphs', name: 'Graphs & BFS/DFS' },
  { id: 'greedy_algorithms', name: 'Greedy Algorithms' },
  { id: 'dynamic_programming', name: 'Dynamic Programming' },
  { id: 'hashing', name: 'Hashing & Hash Maps' },
  { id: 'heaps_and_priority_queues', name: 'Heaps & Priority Queues' },
  { id: 'bit_manipulation', name: 'Bit Manipulation' },
  { id: 'complexity_analysis', name: 'Big-O Complexity' }
];

const QUESTION_FORMATS: Array<{ id: ChallengeType; label: string }> = [
  { id: 'mcq', label: 'Concept MCQs' },
  { id: 'code_sprint', label: 'Live Code Sprints' },
  { id: 'predict_output', label: 'Output Prediction' },
  { id: 'bug_hunter', label: 'Bug Hunter Debugging' },
  { id: 'fill_in_blank', label: 'Fill In The Blanks' },
  { id: 'matching', label: 'Concept Matching' },
  { id: 'arrange_steps', label: 'Arrange Algorithm Steps' },
  { id: 'pseudocode', label: 'Pseudocode Tracing' },
  { id: 'interactive_array', label: '3D Interactive Arrays' }
];

const LEARNING_GOALS: Array<{ id: 'interview_prep' | 'competitive_programming' | 'academic_dsa' | 'casual_fun'; label: string; desc: string }> = [
  { id: 'interview_prep', label: 'Tech Interview Prep', desc: 'FAANG / Tier-1 software engineering interviews' },
  { id: 'competitive_programming', label: 'Competitive Arena', desc: 'Speed problem-solving & rating climb' },
  { id: 'academic_dsa', label: 'University Exam Mastery', desc: 'Master college curriculum & proofs' },
  { id: 'casual_fun', label: 'Casual Gaming & Brain Workout', desc: 'Daily algorithmic puzzles & brainrot challenges' }
];

export const DSAOnboardingModal: React.FC = () => {
  const onboardingOpen = useGameStore((s) => s.onboardingOpen);
  const setOnboardingOpen = useGameStore((s) => s.setOnboardingOpen);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [step, setStep] = useState<number>(1);
  const [selectedLanguages, setSelectedLanguages] = useState<SupportedLanguage[]>(['python']);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'assess_my_level'>('beginner');
  const [selectedTopics, setSelectedTopics] = useState<DSATopic[]>(['arrays_and_strings', 'searching_and_sorting', 'trees_and_bst']);
  const [selectedFormats, setSelectedFormats] = useState<ChallengeType[]>(['mcq', 'code_sprint', 'predict_output', 'interactive_array']);
  const [selectedGoals, setSelectedGoals] = useState<Array<'interview_prep' | 'competitive_programming' | 'academic_dsa' | 'casual_fun'>>(['interview_prep']);
  const [pacing, setPacing] = useState<'steady' | 'accelerated' | 'mastery_first'>('steady');

  // Diagnostic calibration state
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>(CLIENT_DIAGNOSTIC_QUESTIONS);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [assessedResult, setAssessedResult] = useState<{ level: Difficulty; score: number } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (onboardingOpen) {
      // Fetch diagnostic calibration questions (with client fallback)
      fetch(`${API_BASE_URL}/api/diagnostic-questions`)
        .then(res => res.json())
        .then(data => {
          if (data.questions && data.questions.length > 0) setDiagnosticQuestions(data.questions);
        })
        .catch(() => {
          setDiagnosticQuestions(CLIENT_DIAGNOSTIC_QUESTIONS);
        });
    }
  }, [onboardingOpen]);

  if (!onboardingOpen) return null;

  const toggleLanguage = (lang: SupportedLanguage) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const toggleTopic = (topic: DSATopic) => {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter(t => t !== topic));
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const toggleFormat = (fmt: ChallengeType) => {
    if (selectedFormats.includes(fmt)) {
      if (selectedFormats.length > 1) {
        setSelectedFormats(selectedFormats.filter(f => f !== fmt));
      }
    } else {
      setSelectedFormats([...selectedFormats, fmt]);
    }
  };

  const toggleGoal = (goal: 'interview_prep' | 'competitive_programming' | 'academic_dsa' | 'casual_fun') => {
    if (selectedGoals.includes(goal)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter(g => g !== goal));
      }
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleDiagnosticAnswer = (qId: string, ans: string) => {
    setDiagnosticAnswers(prev => ({ ...prev, [qId]: ans }));
  };

  const submitDiagnostic = async () => {
    setIsAssessing(true);
    try {
      const answersArray = Object.entries(diagnosticAnswers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const res = await fetch(`${API_BASE_URL}/api/user/diagnostic-assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray, userId: userProfile.id })
      });
      const data = await res.json();
      if (data.assessedLevel) {
        setAssessedResult({ level: data.assessedLevel, score: data.correctCount });
      }
    } catch {
      setAssessedResult({ level: 'medium', score: 1 });
    } finally {
      setIsAssessing(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const prefs: DSAOnboardingPreferences = {
      userId: userProfile.id,
      languages: selectedLanguages,
      experienceLevel,
      preferredTopics: selectedTopics,
      preferredFormats: selectedFormats,
      goals: selectedGoals,
      progressionPacing: pacing,
      diagnosticScore: assessedResult?.score,
      assessedLevel: assessedResult?.level,
      completedAt: Date.now()
    };

    try {
      await fetch(`${API_BASE_URL}/api/user/dsa-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
    } catch {}

    const setDSAPreferences = useGameStore.getState().setDSAPreferences;
    setDSAPreferences(prefs);
    updateUserProfile({
      dsaPreferences: prefs,
      preferredLanguage: selectedLanguages[0]
    });
    setSaving(false);
    setOnboardingOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0d1117] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800/80 bg-gradient-to-r from-purple-950/40 via-[#0d1117] to-cyan-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CLUTCH <span className="text-cyan-400">DSA Calibration</span>
              </h2>
              <p className="text-xs text-gray-400">Personalize your languages, topic mastery & learning trajectory</p>
            </div>
          </div>
          <button 
            onClick={() => setOnboardingOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2 bg-[#090d13] border-b border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono text-cyan-400">Step {step} of 4</span>
          <div className="flex space-x-1.5">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-cyan-400' : s < step ? 'w-4 bg-purple-500' : 'w-4 bg-gray-700'}`} 
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Languages */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" /> Choose Your Programming Languages
                </h3>
                <p className="text-xs text-gray-400 mt-1">Select all languages you want to practice and compete with.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_LANGUAGES.map(lang => {
                  const isSelected = selectedLanguages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      onClick={() => toggleLanguage(lang.id)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-lg shadow-cyan-500/10' 
                          : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{lang.icon}</span>
                        <div>
                          <p className="font-semibold text-sm">{lang.name}</p>
                          <p className="text-[11px] text-gray-500">Native sandbox runner</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400 flex-shrink-0" />
                Tournament rules and competitive duels can enforce standardized language pools for fairness.
              </div>
            </div>
          )}

          {/* STEP 2: Initial Experience or Diagnostic Assessment */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-400" /> What is your current DSA experience?
                </h3>
                <p className="text-xs text-gray-400 mt-1">Set your starting tier or let our diagnostic quiz calibrate your level.</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {EXPERIENCE_LEVELS.map(lvl => {
                  const isSelected = experienceLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => setExperienceLevel(lvl.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-950/30 text-white shadow-lg shadow-purple-500/10' 
                          : 'border-gray-800 bg-gray-900/40 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{lvl.icon}</span>
                          <div>
                            <p className="font-semibold text-sm">{lvl.title}</p>
                            <p className="text-xs text-gray-400">{lvl.desc}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* If "Assess My Level" selected, render quick diagnostic challenge */}
              {experienceLevel === 'assess_my_level' && (
                <div className="mt-4 p-4 rounded-xl border border-cyan-500/40 bg-[#0b131f] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Rapid Calibration Quiz
                    </span>
                    {assessedResult && (
                      <span className="text-xs font-bold text-green-400 bg-green-950/60 border border-green-500/40 px-2 py-0.5 rounded-md">
                        Calibrated Level: {assessedResult.level.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {diagnosticQuestions.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 text-xs space-y-2">
                      <p className="font-semibold text-gray-200">Q{idx + 1}. {q.prompt}</p>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {q.options.map(opt => {
                            const isChosen = diagnosticAnswers[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleDiagnosticAnswer(q.id, opt)}
                                className={`p-2 rounded text-left transition border text-xs font-mono ${
                                  isChosen 
                                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200' 
                                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {!assessedResult && (
                    <button
                      onClick={submitDiagnostic}
                      disabled={isAssessing || Object.keys(diagnosticAnswers).length === 0}
                      className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                    >
                      {isAssessing ? 'Calibrating...' : 'Evaluate & Calibrate Tier'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Preferred Topics & Formats */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> Focus Topics & Preferred Formats
                </h3>
                <p className="text-xs text-gray-400 mt-1">Select the DSA disciplines you want prioritized in endless matches.</p>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-gray-400 mb-2 block">13 Core DSA Topics</label>
                <div className="flex flex-wrap gap-1.5">
                  {DSA_TOPICS_LIST.map(topic => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                            : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {topic.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-gray-400 mb-2 block">Question Formats</label>
                <div className="grid grid-cols-3 gap-2">
                  {QUESTION_FORMATS.map(fmt => {
                    const isSelected = selectedFormats.includes(fmt.id);
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => toggleFormat(fmt.id)}
                        className={`p-2 rounded-lg border text-left text-xs transition ${
                          isSelected
                            ? 'bg-purple-950/60 border-purple-400 text-purple-200'
                            : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Goals & Pacing */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" /> Competitive & Learning Goals
                </h3>
                <p className="text-xs text-gray-400 mt-1">Configure your progression speed and objective.</p>
              </div>

              <div className="space-y-2">
                {LEARNING_GOALS.map(goal => {
                  const isSelected = selectedGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`w-full p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-yellow-500/80 bg-yellow-950/20 text-white'
                          : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{goal.label}</p>
                          <p className="text-xs text-gray-500">{goal.desc}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-gray-400 mb-2 block">Progression Pacing</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'steady', label: 'Balanced', desc: 'Standard 3-correct promotions' },
                    { id: 'accelerated', label: 'Speedrunner', desc: 'Faster promotion upon fast streaks' },
                    { id: 'mastery_first', label: 'Mastery First', desc: 'Deep guided remediation focus' }
                  ].map(p => {
                    const isSelected = pacing === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPacing(p.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 text-white'
                            : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <p className="font-semibold text-xs">{p.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-[#090d13] border-t border-gray-800/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition flex items-center gap-1.5 text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white transition flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-cyan-500/20"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white transition flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-green-500/20"
            >
              {saving ? 'Saving...' : 'Lock In Preferences 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
