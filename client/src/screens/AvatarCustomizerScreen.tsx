import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CyberAvatar } from '../components/arena3d/CyberAvatar.js';
import { Palette, Sparkles, ArrowLeft, Check } from 'lucide-react';

const COLOR_PALETTES = [
  { name: 'Electric Violet', hex: '#8B5CF6' },
  { name: 'Cyber Cyan', hex: '#06B6D4' },
  { name: 'Acid Lime', hex: '#84CC16' },
  { name: 'Neon Magenta', hex: '#EC4899' },
  { name: 'Solar Amber', hex: '#F59E0B' },
  { name: 'Matrix Emerald', hex: '#10B981' }
];

const GLOW_COLORS = [
  { name: 'Cyan Glow', hex: '#22D3EE' },
  { name: 'Violet Glow', hex: '#A78BFA' },
  { name: 'Lime Glow', hex: '#A3E635' },
  { name: 'Hot Pink Glow', hex: '#F472B6' }
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
    <div className="w-screen h-screen flex flex-col bg-[#040409] text-slate-100 overflow-hidden select-none relative">
      {/* 3D Perspective Ground Grid */}
      <div className="cyber-grid-floor" />

      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#040409]/90 border-b border-violet-500/30 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('lobby')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-xs font-cyber"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>LOBBY</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 text-cyan-400 font-cyber font-bold text-sm">
            <Palette className="w-4 h-4" />
            <span>3D AVATAR LOADOUT STUDIO</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="cyber-btn cyber-btn-cyan px-6 py-1.5 text-xs flex items-center gap-1.5"
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{isSaved ? 'SAVED!' : 'APPLY LOADOUT'}</span>
        </button>
      </div>

      {/* Split View: 3D Preview on Left, Customization Options on Right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: 3D Interactive Avatar Stage */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-radial-gradient">
          <Canvas camera={{ position: [0, 1.5, 4.5], fov: 42 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} />
            <pointLight position={[0, 2, 2]} intensity={2.0} color={selectedGlow} />

            <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[2.5, 32]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.69, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.4, 2.5, 32]} />
              <meshBasicMaterial color={selectedGlow} />
            </mesh>

            <CyberAvatar participant={previewParticipant} isCurrentPlayer={true} />
            <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} autoRotate autoRotateSpeed={1.5} />
          </Canvas>

          <div className="absolute bottom-4 left-4 text-[11px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
            Click and drag to rotate 3D avatar
          </div>
        </div>

        {/* Right: Customization Controls */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full p-6 bg-slate-950/60 border-t md:border-t-0 md:border-l border-violet-500/20 overflow-y-auto space-y-6">
          {/* Armor Base Color */}
          <div>
            <label className="text-xs font-cyber font-bold text-slate-300 block mb-3 uppercase tracking-wider">
              Armor Plate Color
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {COLOR_PALETTES.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                    selectedColor === c.hex
                      ? 'border-cyan-400 bg-cyan-950/30 scale-105'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full shadow-md" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] text-slate-400 font-mono text-center truncate w-full">
                    {c.name.split(' ')[1]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Visor Glow Color */}
          <div>
            <label className="text-xs font-cyber font-bold text-slate-300 block mb-3 uppercase tracking-wider">
              Holographic Visor Glow
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GLOW_COLORS.map((g) => (
                <button
                  key={g.hex}
                  onClick={() => setSelectedGlow(g.hex)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                    selectedGlow === g.hex
                      ? 'border-cyan-400 bg-cyan-950/30'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: g.hex }} />
                  <span className="text-xs text-slate-300 font-mono truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Archetype */}
          <div>
            <label className="text-xs font-cyber font-bold text-slate-300 block mb-3 uppercase tracking-wider">
              Cyber Archetype
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-cyber">
              {[
                { id: 'cyber_ninja', label: 'Cyber Ninja' },
                { id: 'neon_bot', label: 'Neon Sentinel' },
                { id: 'holo_wizard', label: 'Algorithm Mage' },
                { id: 'quantum_mech', label: 'Quantum Mech' }
              ].map((arch) => (
                <button
                  key={arch.id}
                  onClick={() => setSelectedMesh(arch.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedMesh === arch.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {arch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emote Stance */}
          <div>
            <label className="text-xs font-cyber font-bold text-slate-300 block mb-3 uppercase tracking-wider">
              Victory Emote
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['wave', 'dance', 'celebrate'].map((em) => (
                <button
                  key={em}
                  onClick={() => setSelectedEmote(em as any)}
                  className={`p-2 rounded border capitalize transition-all ${
                    selectedEmote === em
                      ? 'border-violet-400 bg-violet-600/30 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Gen-Z Drip Aura Effect */}
          <div>
            <label className="text-xs font-cyber font-bold text-amber-300 flex items-center justify-between mb-3 uppercase tracking-wider">
              <span>Drip Aura Corona (Gen-Z FX)</span>
              <span className="text-[10px] text-amber-400 font-mono">AURA LEVEL 48.5K</span>
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-cyber">
              {[
                { id: 'none', label: 'None (Stealth)', icon: '🛡️' },
                { id: 'sigma_gold', label: 'Sigma Gold Glow', icon: '✨' },
                { id: 'neon_inferno', label: 'Neon Flame Inferno', icon: '🔥' },
                { id: 'celestial_void', label: 'Celestial Void', icon: '🌌' },
                { id: 'matrix_drip', label: 'Matrix Cascade Drip', icon: '⚡' }
              ].map((aura) => (
                <button
                  key={aura.id}
                  onClick={() => setSelectedDripAura(aura.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    selectedDripAura === aura.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{aura.icon}</span>
                  <span className="truncate">{aura.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Equipped Gen-Z Title */}
          <div>
            <label className="text-xs font-cyber font-bold text-cyan-300 block mb-3 uppercase tracking-wider">
              Equipped Player Title (Flex in Lobby & Arena)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              {[
                'Dijkstra’s Favorite Child 👑',
                'Certified Code Demon 😈',
                'O(1) Space Rizzler ⚡',
                'Never Gets Cooked 🧑‍🍳',
                'Brainrot Survivor 🗿',
                'No Cap Binary Searcher 🧢'
              ].map((title) => (
                <button
                  key={title}
                  onClick={() => setSelectedTitle(title)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedTitle === title
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

