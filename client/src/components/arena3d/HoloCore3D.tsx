import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, Ring } from '@react-three/drei';
import * as THREE from 'three';

const QuantumCore: React.FC<{ theme?: 'cyan' | 'violet' | 'amber' }> = ({ theme = 'cyan' }) => {
  const outerWireframeRef = useRef<THREE.Mesh>(null!);
  const innerCoreRef = useRef<THREE.Mesh>(null!);
  const ring1Ref = useRef<THREE.Group>(null!);
  const ring2Ref = useRef<THREE.Group>(null!);
  const ring3Ref = useRef<THREE.Group>(null!);

  const colors = useMemo(() => {
    if (theme === 'amber') {
      return { primary: '#f59e0b', secondary: '#fbbf24', core: '#d97706', glow: '#78350f' };
    }
    if (theme === 'violet') {
      return { primary: '#8b5cf6', secondary: '#c084fc', core: '#6d28d9', glow: '#3b0764' };
    }
    return { primary: '#00f0ff', secondary: '#38bdf8', core: '#0284c7', glow: '#082f49' };
  }, [theme]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (outerWireframeRef.current) {
      outerWireframeRef.current.rotation.x = t * 0.25;
      outerWireframeRef.current.rotation.y = t * 0.35;
    }

    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.x = -t * 0.4;
      innerCoreRef.current.rotation.z = t * 0.2;
      const scale = 1 + Math.sin(t * 3) * 0.08;
      innerCoreRef.current.scale.set(scale, scale, scale);
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5;
      ring1Ref.current.rotation.y = t * 0.3;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.45;
      ring2Ref.current.rotation.z = t * 0.25;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -t * 0.3;
      ring3Ref.current.rotation.z = -t * 0.4;
    }
  });

  return (
    <group>
      {/* Central Pulsing Crystal Core */}
      <mesh ref={innerCoreRef}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.core}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.9}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe Holographic Casing */}
      <mesh ref={outerWireframeRef}>
        <icosahedronGeometry args={[2.0, 1]} />
        <meshStandardMaterial
          color={colors.secondary}
          emissive={colors.primary}
          emissiveIntensity={1.2}
          wireframe={true}
          transparent={true}
          opacity={0.65}
        />
      </mesh>

      {/* Gyroscopic Energy Rings */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[2.8, 0.03, 16, 64]} />
          <meshStandardMaterial color={colors.primary} emissive={colors.primary} emissiveIntensity={2} />
        </mesh>
      </group>

      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[3.4, 0.025, 16, 64]} />
          <meshStandardMaterial color={colors.secondary} emissive={colors.secondary} emissiveIntensity={1.8} />
        </mesh>
      </group>

      <group ref={ring3Ref}>
        <mesh>
          <torusGeometry args={[4.0, 0.02, 16, 64]} />
          <meshStandardMaterial color={colors.core} emissive={colors.primary} emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* Quantum Sparkles / Holographic Bitstream */}
      <Sparkles count={45} scale={7} size={2.5} speed={0.4} color={colors.primary} opacity={0.7} />
    </group>
  );
};

interface HoloCore3DProps {
  theme?: 'cyan' | 'violet' | 'amber';
  height?: string;
  enableControls?: boolean;
}

export const HoloCore3D: React.FC<HoloCore3DProps> = ({
  theme = 'cyan',
  height = '100%',
  enableControls = true
}) => {
  return (
    <div style={{ width: '100%', height }} className="relative select-none pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[0, 0, 0]} intensity={3} color={theme === 'amber' ? '#f59e0b' : theme === 'violet' ? '#8b5cf6' : '#00f0ff'} distance={15} />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <QuantumCore theme={theme} />
        </Float>

        {enableControls && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={true}
            autoRotateSpeed={0.8}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 2.3}
          />
        )}
      </Canvas>
    </div>
  );
};
