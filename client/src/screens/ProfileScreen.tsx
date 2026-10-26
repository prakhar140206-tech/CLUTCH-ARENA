import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { GrandmasterBadge } from '../components/ui/GrandmasterBadge.js';
import { soundSynth } from '../services/soundSynth.js';
import { API_BASE_URL } from '../config/api.js';
import {
  User,
  Shield,
  Flame,
  Award,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  TreeDeciduous,
  Network,
  Binary,
  Layers
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const userProfile = useGameStore((s) => s.userProfile);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);
  const conceptMastery = useGameStore((s) => s.conceptMastery);
  const setConceptMastery = useGameStore((s) => s.setConceptMastery);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMastery = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/dsa-mastery?userId=${userProfile.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.mastery && isMounted) {
            setConceptMastery(data.mastery);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMastery();
    return () => {
      isMounted = false;
    };
  }, [userProfile.id]);

  // 4 Core Topic Mastery Cards matching Image 3 Bottom-Right
  const masteryCards = [
    {
      key: 'trees',
      title: 'Trees',
      icon: TreeDeciduous,
      accuracy: 88,
      difficulty: 'Hard Mastery',
      solved: 45,
      target: 50,
      color: '#22c55e'
    },
    {
      key: 'graphs',
      title: 'Graphs',
      icon: Network,
      accuracy: 75,
      difficulty: 'Hard Mastery',
      solved: 75,
      target: 50,
      color: '#10b981'
    },
    {
      key: 'dp',
      title: 'Dynamic Programming',
      icon: Binary,
      accuracy: 62,
      difficulty: 'Hard Mastery',
      solved: 32,
      target: 50,
      color: '#06b6d4'
    },
    {
      key: 'arrays',
      title: 'Arrays & Strings',
      icon: Layers,
      accuracy: 95,
      difficulty: 'Hard Mastery',
      solved: 98,
      target: 50,
      color: '#84cc16'
    }
  ];

  return (
    <AppShell activeScreen="profile">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans pb-8">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="font-cyber font-black text-xl sm:text-2xl text-white tracking-wider uppercase">
            USER PROFILE &amp; MASTERY
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            COMPETITIVE TELEMETRY
          </span>
        </div>

        {/* User Card with Avatar & Grandmaster Crest Banner */}
        <div className="rounded-2xl bg-[#0f151c]/95 border border-white/10 p-6 sm:p-8 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.7)] relative overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            {/* Avatar with Green Glow Ring */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-2xl text-white border-2 border-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.5)] shrink-0"
              style={{ backgroundColor: userProfile.avatar?.color || '#10b981' }}
            >
              {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'G'}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-cyber font-black text-lg sm:text-2xl text-white tracking-wide truncate">
                {userProfile.username || 'GR36_99'}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                ONLINE
              </span>
            </div>
          </div>

          {/* Grandmaster Badge */}
          <div className="shrink-0 p-2">
            <GrandmasterBadge
              elo={userProfile.ratingMMR || 2140}
              rankTitle={userProfile.rankTier || 'GRANDMASTER'}
              size="md"
            />
          </div>
        </div>

        {/* =========================================================
            DSA TOPIC MASTERY (2x2 Grid matching Image 3 Bottom-Right)
            ========================================================= */}
        <div className="flex flex-col gap-4">
          <h3 className="font-cyber font-bold text-sm uppercase tracking-wider text-white">
            DSA TOPIC MASTERY
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {masteryCards.map((topic) => {
              const Icon = topic.icon;
              return (
                <div
                  key={topic.key}
                  className="rounded-2xl bg-[#0f151c]/95 border border-white/10 p-5 sm:p-6 shadow-[0_6px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between gap-4 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-cyber font-black text-sm text-white tracking-wide">
                        {topic.title}
                      </span>
                    </div>

                    <span className="font-cyber font-black text-sm text-emerald-400">
                      {topic.accuracy}%
                    </span>
                  </div>

                  {/* Animated Neon Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-cyan-400 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>

                  {/* Level & Solved Statistics */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      {topic.difficulty}
                    </span>
                    <span className="text-slate-400 font-bold">
                      {topic.solved}/{topic.target} solved
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
