import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore.js';

interface ArenaHero3DProps {
  height?: string;
}

const MonolithPillar: React.FC<{
  position: [number, number, number];
  height: number;
  color: string;
  glowColor: string;
}> = ({ position, height, color, glowColor }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, height, 0.5]} />
      <meshStandardMaterial
        color={color}
        emissive={glowColor}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
};

const PurpleHoloScene: React.FC = () => {
  const coreRef = useRef<THREE.Group>(null!);
  const ring1Ref = useRef<THREE.Group>(null!);
  const ring2Ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.4;
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.15;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.6;
      ring1Ref.current.rotation.y = t * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.5;
      ring2Ref.current.rotation.z = t * 0.25;
    }
  });

  const pillars = useMemo(() => {
    const list: Array<{ pos: [number, number, number]; h: number }> = [];
    const count = 10;
    const radius = 3.8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const h = 1.2 + Math.abs(Math.sin(i * 1.4)) * 1.6;
      list.push({ pos: [x, -1 + h / 2, z], h });
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Central Vivid Violet Crystal Octahedron */}
      <group ref={coreRef}>
        <mesh>
          <octahedronGeometry args={[1.3, 0]} />
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#8b5cf6"
            emissiveIntensity={2.2}
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>

        {/* Inner Crystalline Core */}
        <mesh scale={0.6}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#7c3aed"
            emissiveIntensity={3}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Gyroscopic Energy Rings */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[2.4, 0.03, 16, 64]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={2.5} />
        </mesh>
      </group>

      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[3.0, 0.025, 16, 64]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Outer Hexagonal Arena Pillars */}
      {pillars.map((p, idx) => (
        <MonolithPillar
          key={idx}
          position={p.pos}
          height={p.h}
          color="#0c0f24"
          glowColor="#7c3aed"
        />
      ))}

      {/* Floor Grid Ring */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 4.4, 32]} />
        <meshBasicMaterial color="#1e2552" wireframe transparent opacity={0.6} />
      </mesh>

      {/* Purple Ambient Sparkles */}
      <Sparkles count={40} scale={6.5} size={2.5} speed={0.4} color="#a78bfa" opacity={0.65} />
    </group>
  );
};

export const ArenaHero3D: React.FC<ArenaHero3DProps> = ({ height = '100%' }) => {
  const is3DFallback = useGameStore((s) => s.is3DFallback);

  if (is3DFallback) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-clutch-surface/40 border border-clutch-border/40 rounded-2xl relative overflow-hidden"
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender">
            <span className="font-cyber font-black text-xl">3D</span>
          </div>
          <span className="text-xs font-mono text-clutch-muted">Hardware 2D Mode Engaged</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full h-full relative select-none overflow-hidden touch-pan-y pointer-events-none sm:pointer-events-auto">
      <Canvas
        camera={{ position: [0, 2.8, 8.5], fov: 46 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 10, 6]} intensity={1.8} color="#ffffff" />
        <pointLight position={[0, 0, 0]} intensity={3.5} color="#8b5cf6" distance={14} />
        <pointLight position={[-4, 3, -4]} intensity={1.5} color="#c4b5fd" distance={12} />

        <Suspense fallback={null}>
          <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.5}>
            <PurpleHoloScene />
          </Float>
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.9}
          maxPolarAngle={Math.PI / 1.9}
          minPolarAngle={Math.PI / 2.6}
        />
      </Canvas>
    </div>
  );
};
