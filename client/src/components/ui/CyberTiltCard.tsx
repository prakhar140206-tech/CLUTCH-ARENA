import React, { useRef, useState } from 'react';

interface CyberTiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald';
  onClick?: () => void;
}

export const CyberTiltCard: React.FC<CyberTiltCardProps> = ({
  children,
  className = '',
  glowColor = 'cyan',
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [sheenPos, setSheenPos] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });

  const calculateTilt = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setSheenPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.22
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    calculateTilt(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      calculateTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      calculateTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const resetTilt = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setSheenPos((prev) => ({ ...prev, opacity: 0 }));
  };

  const glowStyles = {
    cyan: 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_15px_35px_rgba(0,240,255,0.22)]',
    violet: 'border-violet-500/30 hover:border-violet-400 hover:shadow-[0_15px_35px_rgba(139,92,246,0.25)]',
    amber: 'border-amber-500/30 hover:border-amber-400 hover:shadow-[0_15px_35px_rgba(245,158,11,0.25)]',
    rose: 'border-rose-500/30 hover:border-rose-400 hover:shadow-[0_15px_35px_rgba(244,63,94,0.25)]',
    emerald: 'border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_15px_35px_rgba(16,185,129,0.25)]'
  }[glowColor];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetTilt}
      onClick={onClick}
      style={{
        transform,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease-out, box-shadow 0.25s ease'
      }}
      className={`relative rounded-2xl bg-slate-900/70 backdrop-blur-xl border ${glowStyles} tech-corner overflow-hidden cursor-pointer active:scale-[0.98] transition-all select-none ${className}`}
    >
      {/* Dynamic Sheen Light following cursor/touch */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 220px at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,${sheenPos.opacity}), transparent 80%)`
        }}
      />
      {children}
    </div>
  );
};
