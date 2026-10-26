import React from 'react';

interface GrandmasterBadgeProps {
  elo?: number;
  rankTitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showWings?: boolean;
}

export const GrandmasterBadge: React.FC<GrandmasterBadgeProps> = ({
  elo = 2140,
  rankTitle = 'GRANDMASTER',
  size = 'md',
  className = '',
  showWings = true
}) => {
  const isHero = size === 'hero';
  const isLg = size === 'lg' || isHero;
  const isSm = size === 'sm';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Background Radial Glow */}
      <div className={`absolute inset-0 bg-amber-500/15 rounded-full blur-xl pointer-events-none ${isHero ? 'scale-150' : ''}`} />

      {/* Winged Metallic Crest */}
      <div className="relative flex items-center justify-center">
        {showWings && (
          <svg
            className={`${isHero ? 'w-48 h-28' : isLg ? 'w-36 h-20' : isSm ? 'w-20 h-12' : 'w-28 h-16'} text-amber-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.45)]`}
            viewBox="0 0 200 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Wings */}
            <path
              d="M90 55 C65 40, 35 25, 10 38 C30 50, 55 60, 85 65 Z"
              fill="url(#goldGrad)"
              opacity="0.95"
            />
            <path
              d="M90 60 C70 50, 40 40, 20 52 C40 62, 65 70, 85 72 Z"
              fill="url(#goldGradLight)"
              opacity="0.85"
            />
            <path
              d="M90 65 C75 60, 50 55, 35 65 C50 72, 70 78, 85 80 Z"
              fill="url(#goldGradDark)"
              opacity="0.75"
            />

            {/* Right Wings */}
            <path
              d="M110 55 C135 40, 165 25, 190 38 C170 50, 145 60, 115 65 Z"
              fill="url(#goldGrad)"
              opacity="0.95"
            />
            <path
              d="M110 60 C130 50, 160 40, 180 52 C160 62, 135 70, 115 72 Z"
              fill="url(#goldGradLight)"
              opacity="0.85"
            />
            <path
              d="M110 65 C125 60, 150 55, 165 65 C150 72, 130 78, 115 80 Z"
              fill="url(#goldGradDark)"
              opacity="0.75"
            />

            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="goldGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
              <linearGradient id="goldGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Center Shield / Gem */}
        <div className={`absolute flex flex-col items-center justify-center z-10 ${
          isHero ? 'scale-125' : isSm ? 'scale-75' : ''
        }`}>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#854d0e] p-0.5 shadow-[0_0_20px_rgba(234,179,8,0.6)] flex items-center justify-center transform rotate-45">
            <div className="w-full h-full bg-[#12171e] rounded-lg flex items-center justify-center transform -rotate-45 border border-amber-300/40">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[12px] sm:text-sm font-black font-cyber text-amber-200 tracking-wider">
                  {elo}
                </span>
                <span className="text-[7px] font-mono font-bold text-amber-400 tracking-tighter">
                  ELO
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rank Title Ribbon */}
      <div className={`mt-1 sm:mt-2 text-center ${isHero ? 'mt-4' : ''}`}>
        <span className={`font-cyber font-black tracking-widest text-amber-300 uppercase drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] ${
          isHero ? 'text-sm sm:text-base' : isLg ? 'text-xs' : isSm ? 'text-[9px]' : 'text-[11px]'
        }`}>
          {rankTitle}
        </span>
      </div>
    </div>
  );
};
