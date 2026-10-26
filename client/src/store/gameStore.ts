import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  RoomState,
  ClientChallenge,
  SubmissionResponse,
  AvatarLoadout,
  UserProfile,
  DSATopic,
  MatchDurationMinutes,
  PerQuestionSeconds,
  ConceptMasteryRecord,
  SupportedLanguage,
  DSAOnboardingPreferences
} from '../../../shared/types.js';

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

  // DSA Onboarding & Personalization
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  dsaPreferences: DSAOnboardingPreferences | null;
  setDSAPreferences: (prefs: DSAOnboardingPreferences | null) => void;

  // Universal Time-Based Match Settings
  selectedMatchDuration: MatchDurationMinutes;
  setSelectedMatchDuration: (d: MatchDurationMinutes) => void;
  selectedQuestionTimer: PerQuestionSeconds;
  setSelectedQuestionTimer: (q: PerQuestionSeconds) => void;

  // Concept Mastery Map
  conceptMastery: Record<string, ConceptMasteryRecord>;
  setConceptMastery: (m: Record<string, ConceptMasteryRecord>) => void;

  // Real-Time Room State
  activeRoom: RoomState | null;
  setActiveRoom: (room: RoomState | null) => void;
  countdown: number | null;
  setCountdown: (count: number | null) => void;
  stageAnnouncement: { stage: number; stageName: string; difficulty: string; message: string; subtitle: string } | null;
  setStageAnnouncement: (announcement: { stage: number; stageName: string; difficulty: string; message: string; subtitle: string } | null) => void;
  lastSubmissionResult: SubmissionResponse | null;
  setLastSubmissionResult: (res: SubmissionResponse | null) => void;

  // Connection State
  serverConnected: boolean;
  setServerConnected: (connected: boolean) => void;

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
  preferredLanguage: SupportedLanguage;
  setEditorSettings: (settings: Partial<{ editorTheme: string; editorFontSize: number; preferredLanguage: SupportedLanguage }>) => void;
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
  ratingMMR: 1200,
  auraPoints: 0,
  auraTitle: 'Novice Coder',
  equippedTitle: 'Recruit Pilot ⚔️',
  equippedBadge: '⚔️ CONTENDER',
  rankTier: 'Novice Bit',
  stats: {
    matchesPlayed: 0,
    matchesWon: 0,
    challengesSolved: 0,
    highestStreak: 0,
    topicsMastered: {}
  },
  inventory: {
    unlockedCosmetics: ['cyber_ninja'],
    coins: 0,
    powerCards: {
      uno_reverse: 0,
      sigma_shield: 0,
      gigachad_focus: 0
    }
  }
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      currentScreen: 'dashboard',
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

      onboardingOpen: false,
      setOnboardingOpen: (onboardingOpen) => set({ onboardingOpen }),
      dsaPreferences: null,
      setDSAPreferences: (dsaPreferences) => set({ dsaPreferences }),

      selectedMatchDuration: 10,
      setSelectedMatchDuration: (selectedMatchDuration) => set({ selectedMatchDuration }),
      selectedQuestionTimer: 20,
      setSelectedQuestionTimer: (selectedQuestionTimer) => set({ selectedQuestionTimer }),

      conceptMastery: {},
      setConceptMastery: (conceptMastery) => set({ conceptMastery }),

      activeRoom: null,
      setActiveRoom: (room) => set({ activeRoom: room }),
      countdown: null,
      setCountdown: (countdown) => set({ countdown }),
      stageAnnouncement: null,
      setStageAnnouncement: (stageAnnouncement) => set({ stageAnnouncement }),
      lastSubmissionResult: null,
      setLastSubmissionResult: (lastSubmissionResult) => set({ lastSubmissionResult }),

      serverConnected: false,
      setServerConnected: (serverConnected) => set({ serverConnected }),

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
    }),
    {
      name: 'clutch_player_state_v2',
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState || !persistedState.userProfile) return persistedState;
        const p = persistedState.userProfile;
        // Purge legacy hardcoded mock stats
        if (p.auraPoints === 48500) p.auraPoints = 0;
        if (p.stats?.challengesSolved === 38 && p.stats?.matchesPlayed === 14 && p.stats?.highestStreak === 7) {
          p.stats = {
            matchesPlayed: 0,
            matchesWon: 0,
            challengesSolved: 0,
            highestStreak: 0,
            topicsMastered: {}
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        userProfile: state.userProfile,
        soloSolvedIds: state.soloSolvedIds,
        editorTheme: state.editorTheme,
        editorFontSize: state.editorFontSize,
        preferredLanguage: state.preferredLanguage,
        sfxEnabled: state.sfxEnabled,
        is3DFallback: state.is3DFallback
      })
    }
  )
);


