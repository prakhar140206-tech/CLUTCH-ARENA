import React, { useState } from 'react';
import { useGameStore, ScreenState } from '../../store/gameStore.js';
import { soundSynth } from '../../services/soundSynth.js';
import { CLUTCH_LOGO } from '../../config/assets.js';
import {
  LayoutDashboard,
  Swords,
  Compass,
  User,
  Settings,
  Home,
  Flame,
  Volume2,
  VolumeX,
  Palette,
  LogIn,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
  Smartphone,
  Sparkles,
  Zap,
  Users
} from 'lucide-react';
import { FriendsModal } from '../friends/FriendsModal.js';

interface AppShellProps {
  children: React.ReactNode;
  activeScreen?: ScreenState;
  showSidebar?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeScreen,
  showSidebar = true
}) => {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const userProfile = useGameStore((s) => s.userProfile);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const toggleSfx = useGameStore((s) => s.toggleSfx);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [friendsModalOpen, setFriendsModalOpen] = useState<boolean>(false);

  const active = activeScreen || currentScreen;

  const handleNav = (screen: ScreenState) => {
    if (sfxEnabled) soundSynth.click();
    setScreen(screen);
  };

  const handleToggleSound = () => {
    toggleSfx();
    soundSynth.toggleSfx();
  };

  const navItems: Array<{
    id: ScreenState;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lobby', label: 'Arena & Lobby', icon: Swords, badge: 'LIVE' },
    { id: 'solo_quest', label: 'Solo Quest', icon: Compass },
    { id: 'brainrot_shorts', label: 'DSA Shorts', icon: Smartphone, badge: 'BLITZ' },
    { id: 'profile', label: 'Player Profile', icon: User },
    { id: 'avatar_customizer', label: 'Avatar Studio', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const bottomNavItems: Array<{
    id: ScreenState;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'solo_quest', label: 'Practice', icon: Compass },
    { id: 'lobby', label: 'Arena', icon: Swords },
    { id: 'brainrot_shorts', label: 'Shorts', icon: Smartphone, badge: '⚡' },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="w-full max-w-full h-screen h-[100dvh] flex bg-clutch-bg text-clutch-text overflow-hidden select-none relative font-sans">
      {/* 3D Perspective Wireframe Floor */}
      <div className="cyber-grid-floor" />

      {/* Subtle Purple Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-clutch-violet/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-clutch-violet-light/5 rounded-full blur-[150px] pointer-events-none" />

      {/* =========================================================
          DESKTOP / TABLET SIDEBAR
          ========================================================= */}
      {showSidebar && (
        <aside
          className={`hidden md:flex flex-col border-r border-clutch-border bg-clutch-surface/95 backdrop-blur-xl z-30 transition-all duration-300 relative shrink-0 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Logo & Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-clutch-border/70">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 group text-left overflow-hidden"
              title="CLUTCH Arena Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-clutch-violet/30 to-clutch-surface-elevated border border-clutch-violet/40 flex items-center justify-center shrink-0 p-1.5 shadow-[0_0_15px_rgba(124,58,237,0.3)] group-hover:border-clutch-violet transition-colors">
                <img
                  src={CLUTCH_LOGO}
                  alt="CLUTCH"
                  className="w-full h-full object-contain"
                />
              </div>

              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-cyber font-black text-sm tracking-wider text-white group-hover:text-clutch-lavender transition-colors flex items-center gap-1.5">
                    CLUTCH <span className="text-[10px] px-1.5 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/40">ARENA</span>
                  </span>
                  <span className="text-[10px] font-mono text-clutch-muted tracking-tight">
                    DSA Battle Platform
                  </span>
                </div>
              )}
            </button>

            {/* Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-md text-clutch-subtle hover:text-white hover:bg-clutch-surface-light border border-transparent hover:border-clutch-border transition-colors"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-clutch-violet/25 to-clutch-violet-light/10 text-white border border-clutch-violet/50 shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                      : 'text-clutch-muted hover:text-white hover:bg-clutch-surface-light border border-transparent'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-clutch-lavender' : 'text-clutch-subtle'}`} />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-clutch-violet/30 text-clutch-lavender border border-clutch-violet/40">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Quick Status at bottom */}
          <div className="p-3 border-t border-clutch-border/70 bg-clutch-surface/60">
            <div
              onClick={() => handleNav('profile')}
              className={`flex items-center gap-3 p-2 rounded-lg hover:bg-clutch-surface-light transition-colors cursor-pointer ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-cyber font-bold text-xs text-white shrink-0 border border-clutch-border shadow"
                style={{ backgroundColor: userProfile.avatar.color }}
              >
                {userProfile.username.charAt(0)}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {userProfile.username}
                  </div>
                  <div className="text-[10px] font-mono text-clutch-lavender flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{userProfile.rankTier}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* =========================================================
          MAIN APPLICATION VIEWPORT
          ========================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full max-w-full">
        {/* Top Header Bar */}
        <header className="h-14 sm:h-16 border-b border-clutch-border bg-clutch-surface/90 backdrop-blur-xl px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-20 shrink-0 w-full max-w-full">
          {/* Mobile Brand Logo */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2"
            >
              <img src={CLUTCH_LOGO} alt="CLUTCH" className="w-8 h-8 object-contain" />
              <span className="font-cyber font-black text-sm text-white">CLUTCH</span>
            </button>
          </div>

          {/* Desktop Search / Quick Action Input */}
          <div className="hidden md:flex items-center gap-2 max-w-md w-full relative">
            <Search className="w-4 h-4 text-clutch-subtle absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search challenges, algorithms, rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-clutch-surface-light text-xs text-clutch-text pl-9 pr-4 py-2 rounded-lg border border-clutch-border focus:outline-none focus:border-clutch-violet focus:ring-1 focus:ring-clutch-violet transition-all font-mono placeholder:text-clutch-subtle"
            />
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Live Server Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-clutch-surface-light border border-clutch-border text-[11px] font-mono text-clutch-muted">
              <span className="w-2 h-2 rounded-full bg-clutch-emerald animate-pulse" />
              <span>ARENA ONLINE</span>
            </div>

            {/* Friends System Trigger */}
            {!userProfile.isGuest && (
              <button
                onClick={() => setFriendsModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-clutch-surface-light border border-clutch-border hover:border-clutch-violet hover:bg-clutch-violet/10 text-xs font-mono font-medium text-clutch-lavender transition-all shadow-sm"
                title="Friends & Match Invites"
              >
                <Users className="w-3.5 h-3.5 text-clutch-lavender" />
                <span className="hidden sm:inline">Friends</span>
              </button>
            )}

            {/* Aura Points Pill */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-clutch-surface-elevated border border-clutch-violet/40 text-[11px] sm:text-xs font-mono font-bold text-clutch-lavender shadow-sm">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-clutch-amber fill-current" />
              <span>{(userProfile.auraPoints || 0).toLocaleString()}</span>
              <span className="text-[9px] sm:text-[10px] text-clutch-muted hidden xs:inline sm:inline">AURA</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-1.5 sm:p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${
                sfxEnabled
                  ? 'bg-clutch-violet/20 border-clutch-violet/40 text-clutch-lavender'
                  : 'bg-clutch-surface-light border-clutch-border text-clutch-subtle hover:text-white'
              }`}
              title={sfxEnabled ? 'Audio Active (Click to Mute)' : 'Audio Muted'}
            >
              {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* User Profile Avatar / Sign In */}
            {userProfile.isGuest ? (
              <button
                onClick={() => handleNav('auth')}
                className="clutch-btn-primary py-1 sm:py-1.5 px-2.5 sm:px-3 text-xs flex items-center gap-1.5"
              >
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => handleNav('profile')}
                className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-2 pr-2 sm:pr-3 rounded-full bg-clutch-surface-light border border-clutch-border hover:border-clutch-violet transition-colors"
              >
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: userProfile.avatar.color }}
                >
                  {userProfile.username.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-white max-w-[80px] truncate hidden sm:inline">
                  {userProfile.username}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area with Independent Scroll - Strictly terminates above the bottom nav dock */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full min-h-0 relative z-10">
          {children}
        </main>

        {/* =========================================================
            MOBILE DOCK NAVIGATION (MATCHING REFERENCE DESIGN)
            ========================================================= */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden shrink-0 z-40 bg-[#070919] border-t border-violet-500/20 shadow-[0_-4px_20px_rgba(0,0,0,0.7)] px-1 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] grid grid-cols-5 items-center justify-items-center w-full"
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="w-full flex flex-col items-center justify-center py-0.5 transition-all duration-150 group relative focus:outline-none active:scale-95"
              >
                {/* Rounded Square Container (Active has soft violet plate matching user reference) */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 relative ${
                    isCurrent
                      ? 'bg-violet-600/35 border border-violet-400/40 text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                      : 'bg-transparent text-slate-400 group-hover:text-slate-200 group-hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-150 ${
                    isCurrent ? 'scale-110 text-white drop-shadow-[0_0_8px_rgba(196,181,253,0.9)]' : ''
                  }`} />
                  
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-500 text-[7px] font-black font-mono text-white shadow-[0_0_4px_rgba(244,63,94,0.8)]">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Clean Label directly below icon */}
                <span
                  className={`text-[10px] sm:text-[11px] tracking-tight mt-1 leading-none transition-colors ${
                    isCurrent
                      ? 'text-white font-cyber font-bold tracking-wide'
                      : 'text-slate-400 font-mono group-hover:text-slate-200 font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Friends Modal */}
      <FriendsModal
        isOpen={friendsModalOpen}
        onClose={() => setFriendsModalOpen(false)}
      />
    </div>
  );
};
