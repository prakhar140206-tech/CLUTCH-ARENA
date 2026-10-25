import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore.js';
import { CyberAvatar } from './CyberAvatar.js';
import { FloatingMonoliths } from './FloatingMonoliths.js';

export const ArenaCanvas: React.FC = () => {
  const activeRoom = useGameStore((s) => s.activeRoom);
  const userProfile = useGameStore((s) => s.userProfile);
  const is3DFallback = useGameStore((s) => s.is3DFallback);

  if (is3DFallback) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#080811] text-cyan-400 p-8 border border-cyan-500/20">
        <div className="font-cyber text-2xl font-bold mb-2">HOLOGRAPHIC 2D TACTICAL HUD ACTIVE</div>
        <p className="text-slate-400 text-sm max-w-md text-center mb-6">
          Low-spec / mobile performance optimization mode engaged. 3D rendering bypassed for maximum FPS.
        </p>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto w-full max-w-2xl p-4 bg-slate-900/60 rounded-lg border border-violet-500/30">
          {activeRoom && Object.values(activeRoom.participants).map(p => (
            <div key={p.id} className="p-2 rounded bg-slate-800/80 border border-slate-700 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center font-bold text-xs" style={{ backgroundColor: p.loadout?.color || '#8B5CF6' }}>
                {p.username[0]}
              </div>
              <span className="text-xs truncate w-full font-medium">{p.username}</span>
              <span className="text-[10px] text-cyan-400 font-mono">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const participants = activeRoom ? Object.values(activeRoom.participants) : [
    // Default demo participant if testing arena in solo
    {
      id: userProfile.id,
      username: userProfile.username,
      isBot: false,
      isHost: true,
      isReady: true,
      score: 450,
      combo: 3,
      maxCombo: 5,
      isEliminated: false,
      loadout: userProfile.avatar,
      currentStatus: 'coding' as const,
      position3D: { x: 0, y: 0, z: 0 }
    }
  ];

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 14, 24], fov: 48 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#080811');
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 15]} intensity={1.2} color="#ffffff" />
        <pointLight position={[0, 8, 0]} intensity={2.5} color="#06b6d4" distance={30} />
        <pointLight position={[-15, 6, -15]} intensity={1.8} color="#8b5cf6" distance={30} />
        <pointLight position={[15, 6, 15]} intensity={1.8} color="#ec4899" distance={30} />

        <Suspense fallback={null}>
          <FloatingMonoliths />

          {/* Render Avatars */}
          {participants.map((p) => (
            <CyberAvatar
              key={p.id}
              participant={p}
              isCurrentPlayer={p.id === userProfile.id}
            />
          ))}
        </Suspense>

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={10}
          maxDistance={45}
          autoRotate={!activeRoom || activeRoom.status === 'lobby'}
          autoRotateSpeed={0.5}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Mini 3D Arena HUD Overlay */}
      <div className="absolute bottom-3 left-3 pointer-events-none text-[11px] font-mono text-cyan-400/80 bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-500/30">
        <span>ARENA_COORD: [SPATIAL_V4] | PLAYERS: {participants.length}</span>
      </div>
    </div>
  );
};
