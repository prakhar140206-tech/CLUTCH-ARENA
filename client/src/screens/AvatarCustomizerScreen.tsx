import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CyberAvatar } from '../components/arena3d/CyberAvatar.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { soundSynth } from '../services/soundSynth.js';
import { Palette, Sparkles, Check, ArrowLeft, Shield, Award } from 'lucide-react';

const COLOR_PALETTES = [
  { name: 'Electric Violet', hex: '#7c3aed' },
  { name: 'Soft Lavender', hex: '#c4b5fd' },
  { name: 'Cyber Cyan', hex: '#06b6d4' },
  { name: 'Acid Lime', hex: '#10b981' },
  { name: 'Solar Amber', hex: '#f59e0b' },
  { name: 'Neon Magenta', hex: '#ec4899' }
];

const GLOW_COLORS = [
  { name: 'Violet Glow', hex: '#8b5cf6' },
  { name: 'Lavender Glow', hex: '#c4b5fd' },
  { name: 'Cyan Glow', hex: '#22d3ee' },
  { name: 'Hot Pink Glow', hex: '#f472b6' }
];

export const AvatarCustomizerScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const updateAvatar = useGameStore((s) => s.updateAvatar);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);

  const [selectedColor, setSelectedColor] = useState(userProfile.avatar.color);
  const [selectedGlow, setSelectedGlow] = useState(userProfile.avatar.visorGlow);
  const [selectedMesh, setSelectedMesh] = useState(userProfile.avatar.meshStyle);
  const [selectedEmote, setSelectedEmote] = useState(userProfile.avatar.emote);
  const [selectedDripAura, setSelectedDripAura] = useState<any>(userProfile.avatar.dripAura || 'matrix_drip');
  const [selectedTitle, setSelectedTitle] = useState(userProfile.equippedTitle || 'Dijkstra’s Favorite Child 👑');
  const [selectedBadge, setSelectedBadge] = useState(userProfile.equippedBadge || '🔥 NO CAP');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    soundSynth.levelUp();
    updateAvatar({
      color: selectedColor,
      visorGlow: selectedGlow,
      meshStyle: selectedMesh,
      emote: selectedEmote,
      dripAura: selectedDripAura
    });
    updateUserProfile({
      equippedTitle: selectedTitle,
      equippedBadge: selectedBadge
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const previewParticipant: any = {
    id: userProfile.id,
    username: userProfile.username,
    isBot: false,
    score: 0,
    combo: 1,
    isEliminated: false,
    loadout: {
      color: selectedColor,
      visorGlow: selectedGlow,
      meshStyle: selectedMesh,
      trailEffect: 'electric_cyan',
      emote: selectedEmote,
      dripAura: selectedDripAura
    },
    position3D: { x: 0, y: 0, z: 0 },
    auraPoints: userProfile.auraPoints,
    equippedTitle: selectedTitle
  };

  return (
    <AppShell activeScreen="avatar_customizer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-clutch-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-cyber font-bold text-xl text-white">
                3D AVATAR LOADOUT STUDIO
              </h1>
              <p className="text-xs font-mono text-clutch-muted">
                Customize your spatial combatant avatar, visor emissions, and titles
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="clutch-btn-primary px-6 py-2 text-xs flex items-center gap-1.5"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Loadout Saved ✔' : 'Save Loadout'}</span>
          </button>
        </div>

        {/* Split Grid: 3D Stage on Left, Customizer Options on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* 3D Viewport (5 cols) */}
          <div className="lg:col-span-5 h-[260px] sm:h-[450px] clutch-panel-elevated rounded-2xl overflow-hidden relative shadow-2xl flex flex-col justify-between p-3 sm:p-4">
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/40 font-bold">
                INTERACTIVE 3D PREVIEW
              </span>
              <span className="text-[10px] font-mono text-clutch-subtle">Drag to rotate</span>
            </div>

            <div className="absolute inset-0">
              <Canvas camera={{ position: [0, 1.4, 4.2], fov: 42 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 8, 5]} intensity={1.5} />
                <pointLight position={[0, 2, 2]} intensity={2.0} color={selectedGlow} />

                <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[2.5, 32]} />
                  <meshStandardMaterial color="#0c0f24" roughness={0.4} />
                </mesh>
                <mesh position={[0, -0.69, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.4, 2.5, 32]} />
                  <meshBasicMaterial color={selectedGlow} />
                </mesh>

                <CyberAvatar participant={previewParticipant} isCurrentPlayer={true} />
                <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6.5} autoRotate autoRotateSpeed={1.0} />
              </Canvas>
            </div>

            <div className="z-10 mt-auto bg-clutch-surface/85 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-clutch-border text-center">
              <span className="text-xs font-cyber font-bold text-white block">{userProfile.username}</span>
              <span className="text-[10px] font-mono text-clutch-lavender">{selectedTitle}</span>
            </div>
          </div>

          {/* Options Panel (7 cols) */}
          <div className="lg:col-span-7 clutch-panel rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Color Swatches */}
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-2.5">
                PRIMARY COMBATANT SUIT COLOR
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {COLOR_PALETTES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedColor === c.hex
                        ? 'border-clutch-violet bg-clutch-surface-elevated scale-105 shadow-md'
                        : 'border-clutch-border bg-clutch-surface-light hover:border-clutch-violet/50'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: c.hex }} />
                    <span className="text-[9px] font-mono text-clutch-muted truncate w-full text-center">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visor Glow */}
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-2.5">
                VISOR & AURA EMISSION GLOW
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GLOW_COLORS.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setSelectedGlow(g.hex)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      selectedGlow === g.hex
                        ? 'border-clutch-violet bg-clutch-surface-elevated font-bold text-white shadow-md'
                        : 'border-clutch-border bg-clutch-surface-light text-clutch-muted hover:border-clutch-violet/50'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: g.hex }} />
                    <span className="text-[10px] font-mono truncate">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mesh Style */}
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-2.5">
                TACTICAL MESH CLASS
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'cyber_ninja', label: 'Cyber Ninja', desc: 'Sleek aerodynamic combat mesh' },
                  { id: 'neon_bot', label: 'Neon Sentinel', desc: 'Heavy algorithmic frame' },
                  { id: 'holo_wizard', label: 'Holo Wizard', desc: 'Crystalline energy matrix' },
                  { id: 'quantum_mech', label: 'Quantum Mech', desc: 'Overclocked compute rig' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMesh(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedMesh === m.id
                        ? 'border-clutch-violet bg-clutch-surface-elevated text-white shadow-md'
                        : 'border-clutch-border bg-clutch-surface-light text-clutch-muted hover:border-clutch-violet/50'
                    }`}
                  >
                    <div className="font-cyber font-bold text-xs">{m.label}</div>
                    <div className="text-[10px] font-mono text-clutch-subtle mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-clutch-border">
              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                  EQUIPPED CALLSIGN TITLE
                </label>
                <select
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                >
                  <option value="Dijkstra’s Favorite Child 👑">Dijkstra’s Favorite Child 👑</option>
                  <option value="O(1) Space Sigma 🗿">O(1) Space Sigma 🗿</option>
                  <option value="Binary Tree Whisperer 🌲">Binary Tree Whisperer 🌲</option>
                  <option value="Recursion Without Fear ⚡">Recursion Without Fear ⚡</option>
                  <option value="Graph Theory Sorcerer 🔮">Graph Theory Sorcerer 🔮</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                  VICTORY BADGE
                </label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                >
                  <option value="🔥 NO CAP">🔥 NO CAP</option>
                  <option value="⚡ GIGACHAD SPEED">⚡ GIGACHAD SPEED</option>
                  <option value="🛡️ ZERO RUNTIME ERRORS">🛡️ ZERO RUNTIME ERRORS</option>
                  <option value="👑 ARENA SLAYER">👑 ARENA SLAYER</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
