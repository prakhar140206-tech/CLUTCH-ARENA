export type Difficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'advanced'
  | 'extreme_hard'
  // Legacy aliases for backward compatibility
  | 'beginner'
  | 'intermediate'
  | 'expert';

export type ChallengeType =
  | 'mcq'
  | 'code_sprint'
  | 'predict_output'
  | 'bug_hunter'
  | 'complexity'
  | 'visual_puzzle'
  | 'fill_in_blank'
  | 'matching'
  | 'arrange_steps'
  | 'pseudocode'
  | 'interactive_array';

export type DSATopic =
  | 'arrays_and_strings'
  | 'searching_and_sorting'
  | 'linked_lists'
  | 'stacks_and_queues'
  | 'recursion_and_backtracking'
  | 'trees_and_bst'
  | 'graphs'
  | 'greedy_algorithms'
  | 'dynamic_programming'
  | 'hashing'
  | 'heaps_and_priority_queues'
  | 'bit_manipulation'
  | 'complexity_analysis'
  // Legacy aliases
  | 'sliding_window'
  | 'heaps';

export type SupportedLanguage = 'python' | 'cpp' | 'java' | 'c' | 'javascript';

export type MatchDurationMinutes = 10 | 15 | 20 | 25 | 30 | 45 | 60;
export type PerQuestionSeconds = 10 | 15 | 20 | 30;

export type ProgressiveStageLevel = 1 | 2 | 3 | 4;

export interface StageTransitionPayload {
  stage: ProgressiveStageLevel;
  stageName: string;
  difficulty: Difficulty;
  message: string;
  subtitle: string;
}

export type GameMode =
  | 'solo_quest'
  | 'ai_arena'
  | 'duel_1v1'
  | 'team_clash'
  | 'last_brain_standing'
  | 'mega_arena_100';

export interface VisualPuzzleData {
  puzzleType: 'bst_insert' | 'stack_queue_rail' | 'linked_list_pointer' | 'min_heap_bubble' | 'graph_bfs';
  instruction: string;
  initialState: any;
  targetGoal: any;
  allowedOperations: string[];
}

export interface MatchingPairData {
  leftColumn: Array<{ id: string; text: string }>;
  rightColumn: Array<{ id: string; text: string }>;
  correctPairs?: Array<{ leftId: string; rightId: string }>;
}

export interface ArrangeStepsData {
  items: Array<{ id: string; text: string; code?: string }>;
  correctOrderIds?: string[];
}

export interface FillBlankData {
  template: string; // e.g. "for i in range(n): if arr[i] > max_val: {{BLANK_1}} = {{BLANK_2}}"
  blanks: Array<{
    id: string;
    label: string;
    hint?: string;
    acceptedAnswers?: string[];
  }>;
}

export interface InteractiveArrayData {
  initialArray: number[] | string[] | number[][];
  isMatrix?: boolean;
  pointers?: Array<{ id: string; label: string; initialIndex: number; color?: string }>;
  targetDescription: string;
  actionType: 'select_subarray' | 'move_pointers' | 'swap_elements' | 'find_pivot' | 'matrix_traverse';
  validationTarget?: any;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface Challenge {
  id: string;
  title: string;
  topic: DSATopic;
  difficulty: Difficulty;
  type: ChallengeType;
  prompt: string;
  codeSnippet?: string;
  options?: string[]; // for mcq / predict_output / complexity
  correctAnswer?: string | number | string[] | any; // server-authoritative
  explanation: string;
  referenceSolution?: string;
  testCases?: TestCase[]; // for code sprint & bug hunter
  starterCode?: Record<string, string>; // e.g. python, javascript, cpp, java, c
  visualData?: VisualPuzzleData;
  matchingData?: MatchingPairData;
  arrangeStepsData?: ArrangeStepsData;
  fillBlankData?: FillBlankData;
  interactiveArrayData?: InteractiveArrayData;
  languageRequirement?: SupportedLanguage[];
  timeLimitSeconds: number;
  provenance?: 'verified_bank' | 'ai_generated_validated' | 'diagnostic';
  hints?: string[];
}

// Client-safe view of a challenge where solutions/hidden tests are stripped
export type ClientChallenge = Omit<Challenge, 'correctAnswer'> & {
  testCases?: Array<Omit<TestCase, 'isHidden'> & { isHidden?: boolean }>;
  matchingData?: Omit<MatchingPairData, 'correctPairs'>;
  arrangeStepsData?: Omit<ArrangeStepsData, 'correctOrderIds'>;
  fillBlankData?: {
    template: string;
    blanks: Array<Omit<FillBlankData['blanks'][number], 'acceptedAnswers'>>;
  };
  interactiveArrayData?: Omit<InteractiveArrayData, 'validationTarget'>;
};

export interface AvatarLoadout {
  color: string;
  visorGlow: string;
  meshStyle: 'cyber_ninja' | 'neon_bot' | 'holo_wizard' | 'quantum_mech';
  trailEffect: 'electric_cyan' | 'violet_matrix' | 'acid_pulse' | 'plasma_fire';
  emote: 'dance' | 'wave' | 'celebrate' | 'meditate';
  dripAura?: 'none' | 'sigma_gold' | 'neon_inferno' | 'celestial_void' | 'matrix_drip';
}

export interface Participant {
  id: string;
  username: string;
  isBot: boolean;
  botDifficulty?: 'beginner' | 'balanced' | 'speedrunner' | 'strategist' | 'advanced' | 'adaptive';
  isHost: boolean;
  isReady: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  isEliminated: boolean;
  teamId?: string; // 'violet' | 'cyan' for team clash
  loadout: AvatarLoadout;
  position3D?: { x: number; y: number; z: number };
  currentStatus?: 'idle' | 'coding' | 'submitted' | 'solved' | 'failed' | 'eliminated' | 'offline';
  pingMs?: number;
  auraPoints?: number;
  equippedTitle?: string;
  activeBuff?: 'uno_reverse' | 'sigma_shield' | 'brain_freeze' | 'gigachad_focus' | null;
  correctCount?: number;
  totalTimeTakenMs?: number;
  avgTimeTakenSec?: number;
  levelStats?: Record<number, { attempted: number; solved: number; totalTimeMs: number }>;
}

export interface RoomSettings {
  maxPlayers: number;
  totalRounds: number;
  roundDurationSeconds: number;
  matchDurationMinutes?: MatchDurationMinutes;
  questionDurationSeconds?: PerQuestionSeconds;
  topicFilter?: DSATopic | 'all';
  difficulty?: Difficulty | 'mixed';
  mode: GameMode;
  allowSpectators: boolean;
  botFillCount?: number;
  eliminationThreshold?: number; // for last brain standing
  isPrivate?: boolean;
  allowedLanguages?: SupportedLanguage[];
  progressiveDifficulty?: boolean;
}

export interface RoomState {
  id: string;
  code: string;
  name: string;
  hostId: string;
  settings: RoomSettings;
  status: 'lobby' | 'countdown' | 'in_round' | 'round_review' | 'match_ended';
  currentRound: number;
  roundExpiresAt?: number;
  matchExpiresAt?: number;
  questionExpiresAt?: number;
  currentStage?: ProgressiveStageLevel;
  stageName?: string;
  activeChallenge?: ClientChallenge;
  participants: Record<string, Participant>;
  leaderboard: Array<{
    id: string;
    username: string;
    score: number;
    rank: number;
    combo: number;
    isEliminated: boolean;
    correctCount?: number;
    avgTimeTakenSec?: number;
    totalTimeTakenMs?: number;
    rewardCoins?: number;
    rewardBadge?: string;
    levelStats?: Record<number, { attempted: number; solved: number; totalTimeMs: number }>;
  }>;
  roundWinnerId?: string;
}

export interface SubmissionPayload {
  roomId: string;
  challengeId: string;
  roundIndex: number;
  answer: any;
  language?: SupportedLanguage;
  idempotencyKey: string;
  timeTakenMs: number;
}

export interface SubmissionResponse {
  success: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
  speedBonus: number;
  comboMultiplier: number;
  totalScore: number;
  feedback: string;
  testCaseResults?: Array<{
    id: string;
    passed: boolean;
    actualOutput?: string;
    expectedOutput?: string;
    error?: string;
  }>;
  explanation?: string;
  isEliminated?: boolean;
  auraDelta?: number;
  partialCreditRatio?: number;
}

export interface GlitchPower {
  id: 'hint_pulse' | 'focus_shield' | 'double_xp' | 'comeback_boost';
  name: string;
  description: string;
  cooldownSeconds: number;
  icon: string;
}

export interface DSAOnboardingPreferences {
  userId: string;
  languages: SupportedLanguage[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'assess_my_level';
  preferredTopics: DSATopic[];
  preferredFormats: ChallengeType[];
  goals: Array<'interview_prep' | 'competitive_programming' | 'academic_dsa' | 'casual_fun'>;
  progressionPacing: 'steady' | 'balanced' | 'aggressive' | 'accelerated' | 'mastery_first';
  completedAt?: number;
  diagnosticScore?: number;
  assessedLevel?: Difficulty;
}

export interface ConceptMasteryRecord {
  topic: DSATopic;
  masteryScore: number; // 0 - 100
  currentDifficulty: Difficulty;
  questionsAttempted: number;
  questionsSolved: number;
  recentAccuracy: number; // percentage 0 - 100
  averageResponseTimeMs: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  needsRemediation: boolean;
  remediationStep?: {
    conceptKey: string;
    explanation: string;
    workedExample: string;
    practiceChallengeId?: string;
    reassessed: boolean;
  };
  lastUpdated: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  preferredLanguage?: SupportedLanguage;
  isGuest: boolean;
  avatar: AvatarLoadout;
  ratingMMR: number;
  auraPoints: number;
  auraTitle: string;
  equippedTitle?: string;
  equippedBadge?: string;
  rankTier: 'Novice Bit' | 'Byte Knight' | 'Algorithm Sentinel' | 'Tree Master' | 'Grandmaster Architect';
  dsaPreferences?: DSAOnboardingPreferences;
  conceptMastery?: Record<string, ConceptMasteryRecord>;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    challengesSolved: number;
    highestStreak: number;
    topicsMastered: Record<string, number>;
  };
  inventory: {
    unlockedCosmetics: string[];
    coins: number;
    powerCards?: Record<string, number>;
  };
  achievements?: Array<{
    id: string;
    title: string;
    desc: string;
    icon: string;
    unlockedAt?: string;
  }>;
}
