import { create } from 'zustand';
import { RoomState, ClientChallenge, SubmissionResponse, AvatarLoadout, UserProfile, DSATopic } from '../../../shared/types.js';

export type ScreenState = 
  | 'home'
  | 'dashboard'
  | 'profile'
  | 'settings'
  | 'auth'
  | 'cinematic'
  | 'lobby'
  | 'solo_quest'
  | 'custom_room'
  | 'arena_3d'
  | 'avatar_customizer'
  | 'brainrot_shorts'
  | 'leaderboard';

interface GameStore {
  currentScreen: ScreenState;
  setScreen: (screen: ScreenState) => void;

  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updateAvatar: (loadout: Partial<AvatarLoadout>) => void;
  loginUser: (username: string, email?: string) => void;
  logoutUser: () => void;

  // Real-Time Room State
  activeRoom: RoomState | null;
  setActiveRoom: (room: RoomState | null) => void;
  countdown: number | null;
  setCountdown: (count: number | null) => void;
  lastSubmissionResult: SubmissionResponse | null;
  setLastSubmissionResult: (res: SubmissionResponse | null) => void;

  // Solo Campaign State
  soloTopic: DSATopic | 'all';
  setSoloTopic: (topic: DSATopic | 'all') => void;
  soloActiveChallenge: ClientChallenge | null;
  setSoloActiveChallenge: (c: ClientChallenge | null) => void;
  soloSolvedIds: string[];
  markSoloSolved: (id: string) => void;

  // Settings
  is3DFallback: boolean;
  toggle3DFallback: () => void;
  sfxEnabled: boolean;
  toggleSfx: () => void;
  editorTheme: string;
  editorFontSize: number;
  preferredLanguage: 'python' | 'javascript' | 'cpp' | 'java';
  setEditorSettings: (settings: Partial<{ editorTheme: string; editorFontSize: number; preferredLanguage: 'python' | 'javascript' | 'cpp' | 'java' }>) => void;
}


const DEFAULT_AVATAR: AvatarLoadout = {
  color: '#8b5cf6',
  visorGlow: '#06b6d4',
  meshStyle: 'cyber_ninja',
  trailEffect: 'electric_cyan',
  emote: 'wave',
  dripAura: 'matrix_drip'
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'guest-' + Math.random().toString(36).substring(2, 9),
  username: 'CyberNinja_' + Math.floor(100 + Math.random() * 900),
  isGuest: true,
  avatar: DEFAULT_AVATAR,
  ratingMMR: 1250,
  auraPoints: 48500,
  auraTitle: 'Algorithm Rizzler',
  equippedTitle: 'Dijkstra’s Favorite Child 👑',
  equippedBadge: '🔥 NO CAP',
  rankTier: 'Byte Knight',
  stats: {
    matchesPlayed: 14,
    matchesWon: 9,
    challengesSolved: 38,
    highestStreak: 7,
    topicsMastered: {
      arrays_and_strings: 85,
      trees_and_bst: 70,
      stacks_and_queues: 90
    }
  },
  inventory: {
    unlockedCosmetics: ['cyber_ninja', 'neon_bot'],
    coins: 450,
    powerCards: {
      uno_reverse: 3,
      sigma_shield: 2,
      gigachad_focus: 1
    }
  }
};

export const useGameStore = create<GameStore>((set) => ({
  currentScreen: 'cinematic',
  setScreen: (screen) => set({ currentScreen: screen }),

  userProfile: DEFAULT_PROFILE,
  updateUserProfile: (updates) => set((s) => ({ userProfile: { ...s.userProfile, ...updates } })),
  updateAvatar: (loadout) => set((s) => ({
    userProfile: {
      ...s.userProfile,
      avatar: { ...s.userProfile.avatar, ...loadout }
    }
  })),

  loginUser: (username, email) => set((s) => ({
    userProfile: {
      ...s.userProfile,
      username,
      email: email || `${username.toLowerCase()}@algorithm.cyber`,
      isGuest: false
    }
  })),

  logoutUser: () => set((s) => ({
    userProfile: {
      ...DEFAULT_PROFILE,
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      username: 'GuestCoder_' + Math.floor(100 + Math.random() * 900),
      isGuest: true
    }
  })),

  activeRoom: null,
  setActiveRoom: (room) => set({ activeRoom: room }),
  countdown: null,
  setCountdown: (countdown) => set({ countdown }),
  lastSubmissionResult: null,
  setLastSubmissionResult: (lastSubmissionResult) => set({ lastSubmissionResult }),

  soloTopic: 'all',
  setSoloTopic: (soloTopic) => set({ soloTopic }),
  soloActiveChallenge: null,
  setSoloActiveChallenge: (soloActiveChallenge) => set({ soloActiveChallenge }),
  soloSolvedIds: [],
  markSoloSolved: (id) => set((s) => ({
    soloSolvedIds: s.soloSolvedIds.includes(id) ? s.soloSolvedIds : [...s.soloSolvedIds, id]
  })),

  is3DFallback: false,
  toggle3DFallback: () => set((s) => ({ is3DFallback: !s.is3DFallback })),
  sfxEnabled: true,
  toggleSfx: () => set((s) => ({ sfxEnabled: !s.sfxEnabled })),

  editorTheme: 'cyber-neon',
  editorFontSize: 14,
  preferredLanguage: 'python',
  setEditorSettings: (settings) => set((s) => ({ ...s, ...settings }))
}));

