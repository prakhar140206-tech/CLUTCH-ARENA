import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Participant } from '../../../../shared/types.js';

interface CyberAvatarProps {
  participant: Participant;
  isCurrentPlayer?: boolean;
}

export const CyberAvatar: React.FC<CyberAvatarProps> = ({ participant, isCurrentPlayer = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const visorRef = useRef<THREE.Mesh>(null);

  const baseColor = participant.loadout?.color || '#8B5CF6';
  const glowColor = participant.loadout?.visorGlow || '#06B6D4';
  const pos = participant.position3D || { x: 0, y: 0, z: 0 };

  const dripAura = participant.loadout?.dripAura || 'none';
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Idle floating bob
    groupRef.current.position.y = pos.y + Math.sin(t * 2 + pos.x) * 0.15 + 0.8;

    // Slight head rotation when coding or idle
    if (headRef.current) {
      if (participant.currentStatus === 'coding') {
        headRef.current.rotation.x = 0.2 + Math.sin(t * 8) * 0.05;
        headRef.current.rotation.y = Math.sin(t * 4) * 0.15;
      } else {
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.2;
      }
    }

    // Drip Aura rotation
    if (auraRef.current) {
      auraRef.current.rotation.z = t * 1.5;
      auraRef.current.rotation.x = Math.PI / 4 + Math.sin(t) * 0.2;
    }
  });

  const getStatusBadge = () => {
    switch (participant.currentStatus) {
      case 'coding':
        return <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] px-1.5 py-0.5 rounded animate-pulse">⚡ COOKING</span>;
      case 'solved':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-1.5 py-0.5 rounded">✔ NO CAP</span>;
      case 'failed':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-1.5 py-0.5 rounded">✖ COOKED</span>;
      case 'eliminated':
        return <span className="bg-red-900/60 text-red-400 border border-red-700 text-[10px] px-1.5 py-0.5 rounded">☠ DOWN BAD</span>;
      default:
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] px-1.5 py-0.5 rounded">LOCK IN</span>;
    }
  };

  const getDripColor = () => {
    switch (dripAura) {
      case 'sigma_gold': return '#F59E0B';
      case 'neon_inferno': return '#F43F5E';
      case 'celestial_void': return '#8B5CF6';
      case 'matrix_drip': return '#10B981';
      default: return null;
    }
  };

  const dripColor = getDripColor();

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      {/* 3D Floating Nameplate and Status HUD */}
      <Html position={[0, 1.9, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div className={`flex flex-col items-center pointer-events-none select-none transition-all ${participant.isEliminated ? 'opacity-40 grayscale' : ''}`}>
          {/* Equipped Gen-Z Title */}
          {participant.equippedTitle && (
            <div className="text-[9px] font-cyber font-extrabold text-amber-300 tracking-wider mb-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
              {participant.equippedTitle}
            </div>
          )}

          <div className="flex items-center gap-1 mb-0.5">
            {getStatusBadge()}
            {participant.combo > 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-rose-600 text-black font-black text-[10px] px-1 rounded animate-bounce shadow">
                🔥 x{participant.combo}
              </span>
            )}
          </div>
          <div className={`px-2 py-0.5 rounded text-xs font-cyber font-bold tracking-wider whitespace-nowrap shadow-lg flex items-center gap-1.5 ${
            isCurrentPlayer
              ? 'bg-cyan-500/90 text-slate-950 border border-cyan-200'
              : 'bg-slate-900/90 text-slate-100 border border-violet-500/50'
          }`}>
            {participant.isBot && <span className="text-[10px] text-amber-400">🤖</span>}
            <span>{participant.username}</span>
            <span className="text-cyan-400 font-mono font-normal">[{participant.score} pts]</span>
          </div>
        </div>
      </Html>

      {/* Stylized Low-Poly Cyber Avatar Body */}
      {/* Head */}
      <mesh ref={headRef} position={[0, 0.7, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshStandardMaterial color={baseColor} metalness={0.7} roughness={0.2} />
        
        {/* Glowing Visor */}
        <mesh ref={visorRef} position={[0, 0.05, 0.3]}>
          <boxGeometry args={[0.45, 0.18, 0.1]} />
          <meshBasicMaterial color={glowColor} />
        </mesh>
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.22, 0.8, 6]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Glowing Energy Core */}
      <mesh position={[0, 0.1, 0.18]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Left Shoulder & Arm */}
      <mesh position={[-0.45, 0.15, 0]}>
        <capsuleGeometry args={[0.1, 0.45, 4, 8]} />
        <meshStandardMaterial color={baseColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Right Shoulder & Arm */}
      <mesh position={[0.45, 0.15, 0]}>
        <capsuleGeometry args={[0.1, 0.45, 4, 8]} />
        <meshStandardMaterial color={baseColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Base Hover Thruster / Ring */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.4, 16]} />
        <meshBasicMaterial color={glowColor} side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>

      {/* Drip Aura Orbital Ring */}
      {dripColor && (
        <mesh ref={auraRef} position={[0, 0.2, 0]}>
          <torusGeometry args={[0.75, 0.04, 8, 24]} />
          <meshBasicMaterial color={dripColor} wireframe />
        </mesh>
      )}

      {/* Player Ring Indicator */}
      {isCurrentPlayer && (
        <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.85, 32]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

