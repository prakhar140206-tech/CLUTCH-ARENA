export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ChallengeType = 
  | 'mcq'
  | 'predict_output'
  | 'bug_hunter'
  | 'complexity'
  | 'visual_puzzle'
  | 'code_sprint';

export type DSATopic =
  | 'arrays_and_strings'
  | 'searching_and_sorting'
  | 'complexity_analysis'
  | 'linked_lists'
  | 'stacks_and_queues'
  | 'trees_and_bst'
  | 'heaps'
  | 'graphs'
  | 'dynamic_programming'
  | 'sliding_window'
  | 'bit_manipulation';

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
  starterCode?: Record<string, string>; // e.g. python, javascript, cpp, java
  visualData?: VisualPuzzleData;
  timeLimitSeconds: number;
}

// Client-safe view of a challenge where solutions/hidden tests are stripped
export type ClientChallenge = Omit<Challenge, 'correctAnswer'> & {
  testCases?: Array<Omit<TestCase, 'isHidden'> & { isHidden?: boolean }>;
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
}

export interface RoomSettings {
  maxPlayers: number;
  totalRounds: number;
  roundDurationSeconds: number;
  topicFilter?: DSATopic | 'all';
  difficulty?: Difficulty | 'mixed';
  mode: GameMode;
  allowSpectators: boolean;
  botFillCount?: number;
  eliminationThreshold?: number; // for last brain standing
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
  }>;
  roundWinnerId?: string;
}


export interface SubmissionPayload {
  roomId: string;
  challengeId: string;
  roundIndex: number;
  answer: any;
  language?: 'python' | 'javascript' | 'cpp' | 'java';
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
}

export interface GlitchPower {
  id: 'hint_pulse' | 'focus_shield' | 'double_xp' | 'comeback_boost';
  name: string;
  description: string;
  cooldownSeconds: number;
  icon: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  preferredLanguage?: 'python' | 'javascript' | 'cpp' | 'java';
  isGuest: boolean;
  avatar: AvatarLoadout;
  ratingMMR: number;
  auraPoints: number;
  auraTitle: string;
  equippedTitle?: string;
  equippedBadge?: string;
  rankTier: 'Novice Bit' | 'Byte Knight' | 'Algorithm Sentinel' | 'Tree Master' | 'Grandmaster Architect';
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


