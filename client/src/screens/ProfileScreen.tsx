import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { CyberNavBar } from '../components/navigation/CyberNavBar.js';
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
  Share2
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
    { title: 'Sigma Grindset', desc: 'Achieved a 7x or greater combo streak', icon: '🗿', unlocked: true },
    { title: 'No Cap Detector', desc: 'Swiped 10 consecutive truth assertions in Shorts', icon: '🧢', unlocked: true },
    { title: 'Algo Architect', desc: 'Completed all Binary Search Tree visual puzzles', icon: '🌲', unlocked: true },
    { title: 'Grandmaster Turing', desc: 'Reached 50,000+ Aura Points', icon: '👑', unlocked: (userProfile.auraPoints || 0) >= 50000 },
    { title: '100-Player Survivor', desc: 'Placed Top 3 in a 100-Player Mega Arena', icon: '🏆', unlocked: true }
  ];

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-y-auto select-none relative">
      <CyberNavBar activeTab="profile" />

      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Cyber Background Glow */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col gap-6 z-10">
        {/* Split Hero: 3D Stage on Left, Profile Details on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 3D Avatar Interactive Stage (5 Columns) */}
          <div className="lg:col-span-5 h-[360px] sm:h-[420px] rounded-2xl bg-slate-900/80 border-2 border-violet-500/30 overflow-hidden relative shadow-2xl backdrop-blur-xl">
            <Canvas camera={{ position: [0, 1.4, 4.2], fov: 42 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 5]} intensity={1.5} />
              <pointLight position={[0, 2, 2]} intensity={2.0} color={userProfile.avatar.visorGlow} />

              <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[2.5, 32]} />
                <meshStandardMaterial color="#0f172a" roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.69, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.4, 2.5, 32]} />
                <meshBasicMaterial color={userProfile.avatar.visorGlow} />
              </mesh>

              <CyberAvatar participant={previewParticipant} isCurrentPlayer={true} />
              <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6.5} autoRotate autoRotateSpeed={1.2} />
            </Canvas>

            {/* Customizer Overlay Button */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                Drag to rotate 3D Avatar
              </span>
              <button
                onClick={() => setScreen('avatar_customizer')}
                className="cyber-btn cyber-btn-cyan px-3.5 py-1.5 text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>LOADOUT STUDIO</span>
              </button>
            </div>
          </div>

          {/* Profile Identity & Stats (7 Columns) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border-2 border-violet-500/30 backdrop-blur-xl flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {isEditing ? (
                    <div className="space-y-2 mb-2">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="bg-slate-950 border border-cyan-400 text-white font-cyber font-bold text-lg px-3 py-1 rounded w-full focus:outline-none"
                      />
                      <textarea
                        value={bioInput}
                        onChange={(e) => setBioInput(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-slate-300 font-mono text-xs p-2 rounded w-full focus:outline-none h-16"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="font-cyber font-black text-2xl sm:text-3xl text-white tracking-wide">
                          {userProfile.username}
                        </h1>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                          {userProfile.rankTier}
                        </span>
                      </div>
                      <div className="text-xs font-cyber font-bold text-amber-300 mb-2">
                        {userProfile.equippedTitle || 'Dijkstra’s Favorite Child 👑'}
                      </div>
                      <p className="text-slate-400 text-xs font-mono leading-relaxed max-w-lg">
                        "{userProfile.bio || 'Grinding O(1) space algorithms. Bro never gets cooked.'}"
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (isEditing) handleSaveBio();
                    else setIsEditing(true);
                  }}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition-colors text-xs font-cyber flex items-center gap-1.5 shrink-0"
                >
                  {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isEditing ? 'SAVE' : 'EDIT'}</span>
                </button>
              </div>

              {/* Badges and Tags Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-cyber font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{(userProfile.auraPoints || 48500).toLocaleString()} AURA</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-mono flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>PREFERRED: {(userProfile.preferredLanguage || 'python').toUpperCase()}</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono">
                  {userProfile.isGuest ? 'GUEST COMBATANT' : 'VERIFIED ACCOUNT'}
                </span>
              </div>
            </div>

            {/* Lifetime Combat Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center font-mono">
              <div>
                <div className="text-lg sm:text-xl font-cyber font-black text-white">
                  {userProfile.stats?.matchesPlayed || 14}
                </div>
                <div className="text-[10px] text-slate-400">Total Matches</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-cyber font-black text-emerald-400">
                  {userProfile.stats?.matchesWon || 9}
                </div>
                <div className="text-[10px] text-slate-400">Victories</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-cyber font-black text-cyan-400">
                  {userProfile.stats?.challengesSolved || 38}
                </div>
                <div className="text-[10px] text-slate-400">Solved Invariants</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-cyber font-black text-rose-400">
                  {userProfile.stats?.highestStreak || 7}x
                </div>
                <div className="text-[10px] text-slate-400">Peak Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Cabinet */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-violet-500/25 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-cyber font-bold text-sm text-white tracking-wider">
              TROPHY & ACHIEVEMENT CABINET
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.title}
                className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${
                  ach.unlocked
                    ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40'
                    : 'bg-slate-950/30 border-slate-900 opacity-40 grayscale'
                }`}
              >
                <div className="text-2xl w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {ach.icon}
                </div>
                <div>
                  <div className="font-cyber font-bold text-xs text-slate-200">{ach.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono leading-tight">{ach.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
