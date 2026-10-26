import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CyberAvatar } from '../components/arena3d/CyberAvatar.js';
import {
  User,
  Shield,
  Palette,
  Flame,
  Award,
  Sparkles,
  Edit3,
  Check,
  Zap,
  Code2,
  Trophy,
  Share2,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>(userProfile.username);
  const [bioInput, setBioInput] = useState<string>(
    userProfile.bio || 'Grinding O(1) space algorithms. Bro never gets cooked.'
  );

  const handleSaveBio = () => {
    soundSynth.levelUp();
    updateUserProfile({
      username: usernameInput.trim() || userProfile.username,
      bio: bioInput.trim()
    });
    setIsEditing(false);
  };

  const previewParticipant: any = {
    id: userProfile.id,
    username: usernameInput || userProfile.username,
    isBot: false,
    score: 0,
    combo: userProfile.stats?.highestStreak || 3,
    isEliminated: false,
    loadout: userProfile.avatar,
    position3D: { x: 0, y: 0, z: 0 },
    auraPoints: userProfile.auraPoints,
    equippedTitle: userProfile.equippedTitle
  };

  const achievements = [
    { title: 'GigaChad O(1) Solver', desc: 'Solved a problem in under 5 seconds', icon: '⚡', unlocked: true },
    { title: 'Sigma Grindset', desc: 'Achieved a 5x or greater streak', icon: '🗿', unlocked: true },
    { title: 'No Cap Detector', desc: 'Swiped 10 consecutive truth assertions in Shorts', icon: '🧢', unlocked: true },
    { title: 'Tree Architect', desc: 'Completed all Binary Search Tree visual puzzles', icon: '🌲', unlocked: true },
    { title: 'Grandmaster Turing', desc: 'Reached 50,000+ Aura Points', icon: '👑', unlocked: (userProfile.auraPoints || 0) >= 50000 },
    { title: 'Arena Contender', desc: 'Competed in competitive multiplayer arenas', icon: '🏆', unlocked: true }
  ];

  const winRate = userProfile.stats?.matchesPlayed
    ? Math.round(((userProfile.stats?.matchesWon || 0) / userProfile.stats.matchesPlayed) * 100)
    : 64;

  return (
    <AppShell activeScreen="profile">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        
        {/* Top Header Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 3D Avatar Interactive Stage (5 cols) */}
          <div className="lg:col-span-5 h-[340px] sm:h-[380px] rounded-2xl clutch-panel-elevated overflow-hidden relative shadow-2xl flex flex-col justify-between p-4">
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/40 font-bold">
                SPATIAL 3D AVATAR
              </span>
              <span className="text-[10px] font-mono text-clutch-subtle">Drag to rotate</span>
            </div>

            <div className="absolute inset-0">
              <Canvas camera={{ position: [0, 1.4, 4.2], fov: 42 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 8, 5]} intensity={1.5} />
                <pointLight position={[0, 2, 2]} intensity={2.0} color={userProfile.avatar.visorGlow || '#8b5cf6'} />

                <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[2.5, 32]} />
                  <meshStandardMaterial color="#0c0f24" roughness={0.4} />
                </mesh>
                <mesh position={[0, -0.69, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.4, 2.5, 32]} />
                  <meshBasicMaterial color={userProfile.avatar.visorGlow || '#8b5cf6'} />
                </mesh>

                <CyberAvatar participant={previewParticipant} isCurrentPlayer={true} />
                <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6.5} autoRotate autoRotateSpeed={1.0} />
              </Canvas>
            </div>

            <div className="z-10 mt-auto pt-3">
              <button
                onClick={() => setScreen('avatar_customizer')}
                className="w-full clutch-btn-primary py-2 text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Customize 3D Loadout</span>
              </button>
            </div>
          </div>

          {/* Profile Identity & Details (7 cols) */}
          <div className="lg:col-span-7 clutch-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-clutch-border">
                <div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="bg-clutch-surface-light border border-clutch-border text-white text-base font-cyber font-bold px-3 py-1 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                      />
                    ) : (
                      <h1 className="font-cyber font-bold text-2xl text-white">
                        {userProfile.username}
                      </h1>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30 font-bold">
                      {userProfile.rankTier}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-clutch-lavender mt-1">
                    {userProfile.equippedTitle || 'Algorithm Rizzler 👑'}
                  </div>
                </div>

                {isEditing ? (
                  <button
                    onClick={handleSaveBio}
                    className="clutch-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="clutch-btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <span className="text-[10px] font-mono text-clutch-subtle block mb-1">CALLSIGN BIO</span>
                {isEditing ? (
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    rows={2}
                    className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                  />
                ) : (
                  <p className="text-xs text-clutch-muted leading-relaxed font-mono">
                    "{userProfile.bio || 'Grinding O(1) space algorithms. Bro never gets cooked.'}"
                  </p>
                )}
              </div>

              {/* Verified Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border">
                  <span className="text-[10px] font-mono text-clutch-subtle block">RATING MMR</span>
                  <span className="font-cyber font-bold text-lg text-white">{userProfile.ratingMMR}</span>
                </div>
                <div className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border">
                  <span className="text-[10px] font-mono text-clutch-subtle block">AURA POINTS</span>
                  <span className="font-cyber font-bold text-lg text-clutch-amber">
                    {(userProfile.auraPoints || 48500).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border">
                  <span className="text-[10px] font-mono text-clutch-subtle block">WIN RATE</span>
                  <span className="font-cyber font-bold text-lg text-clutch-emerald">{winRate}%</span>
                </div>
                <div className="p-3 rounded-xl bg-clutch-surface-light border border-clutch-border">
                  <span className="text-[10px] font-mono text-clutch-subtle block">MAX STREAK</span>
                  <span className="font-cyber font-bold text-lg text-clutch-lavender">
                    {userProfile.stats?.highestStreak || 7}x
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-clutch-border flex items-center justify-between text-[11px] font-mono text-clutch-subtle mt-4">
              <span>Account Status: {userProfile.isGuest ? 'Guest Pilot' : 'Authenticated Pilot'}</span>
              <span>Preferred Language: {userProfile.preferredLanguage || 'Python 3'}</span>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="clutch-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-clutch-border">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-clutch-lavender" />
              <h2 className="font-cyber font-bold text-base text-white">ACHIEVEMENTS & BADGES</h2>
            </div>
            <span className="text-xs font-mono text-clutch-muted">
              {achievements.filter(a => a.unlocked).length}/{achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {achievements.map((a) => (
              <div
                key={a.title}
                className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${
                  a.unlocked
                    ? 'bg-clutch-surface-light border-clutch-border text-white'
                    : 'bg-clutch-surface/40 border-clutch-border/30 text-clutch-subtle opacity-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-clutch-surface-elevated border border-clutch-border flex items-center justify-center text-xl shrink-0">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-cyber font-bold text-xs truncate">{a.title}</h3>
                  <p className="text-[11px] text-clutch-muted truncate mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
};
