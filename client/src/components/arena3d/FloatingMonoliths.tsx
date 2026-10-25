import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const FloatingMonoliths: React.FC = () => {
  const treeGroupRef = useRef<THREE.Group>(null);
  const monolithsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (treeGroupRef.current) {
      treeGroupRef.current.rotation.y = t * 0.2;
    }
    if (monolithsRef.current) {
      monolithsRef.current.rotation.y = -t * 0.05;
    }
  });

  return (
    <>
      {/* Central Rotating Algorithmic Structure (Holographic Binary Tree) */}
      <group ref={treeGroupRef} position={[0, 4.5, 0]}>
        {/* Root Node */}
        <mesh position={[0, 1.5, 0]}>
          <octahedronGeometry args={[0.7, 0]} />
          <meshBasicMaterial color="#06b6d4" wireframe />
        </mesh>
        
        {/* Left Branch & Node */}
        <mesh position={[-2, 0, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#8b5cf6" wireframe />
        </mesh>
        
        {/* Right Branch & Node */}
        <mesh position={[2, 0, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#8b5cf6" wireframe />
        </mesh>

        {/* Tree Edges */}
        <line>
          <bufferGeometry attach="geometry" {...createLineGeometry([0, 1.5, 0, -2, 0, 0])} />
          <lineBasicMaterial attach="material" color="#06b6d4" transparent opacity={0.5} />
        </line>
        <line>
          <bufferGeometry attach="geometry" {...createLineGeometry([0, 1.5, 0, 2, 0, 0])} />
          <lineBasicMaterial attach="material" color="#06b6d4" transparent opacity={0.5} />
        </line>
      </group>

      {/* Orbiting Monolith Memory Blocks */}
      <group ref={monolithsRef}>
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const angle = (idx / 6) * Math.PI * 2;
          const radius = 22;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const height = 4 + (idx % 3) * 2;
          return (
            <mesh key={idx} position={[x, height / 2 - 1, z]}>
              <boxGeometry args={[1.5, height, 1.5]} />
              <meshStandardMaterial
                color="#0f172a"
                emissive="#6366f1"
                emissiveIntensity={0.2}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          );
        })}
      </group>

      {/* Arena Cyber Grid Platform */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[26, 64]} />
        <meshStandardMaterial color="#0a0a16" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Outer Hex Neon Ring */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[25.7, 26, 64]} />
        <meshBasicMaterial color="#8b5cf6" side={THREE.DoubleSide} />
      </mesh>

      {/* Inner Tactical Circles */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.9, 10, 64]} />
        <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
    </>
  );
};

function createLineGeometry(points: number[]) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(points);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  return geometry;
}
