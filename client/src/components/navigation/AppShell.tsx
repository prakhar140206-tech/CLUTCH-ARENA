import React, { useState } from 'react';
import { useGameStore, ScreenState } from '../../store/gameStore.js';
import { soundSynth } from '../../services/soundSynth.js';
import { CLUTCH_LOGO } from '../../config/assets.js';
import {
  LayoutDashboard,
  Swords,
  Target,
  Trophy,
  BarChart3,
  Package,
  Settings,
  MessageSquare,
  Bell,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Shield,
  Compass,
  Menu,
  X,
  Smartphone,
  Flame
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
  const [friendsModalOpen, setFriendsModalOpen] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const active = activeScreen || currentScreen;

  const handleNav = (screen: ScreenState) => {
    if (sfxEnabled) soundSynth.click();
    setMobileDrawerOpen(false);
    setScreen(screen);
  };

  const handleToggleSound = () => {
    toggleSfx();
    soundSynth.toggleSfx();
  };

  // 7 Core Sidebar Nav Items exactly matching the reference design
  const navItems: Array<{
    id: ScreenState;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'arena_3d', label: 'Arena', icon: Swords },
    { id: 'solo_quest', label: 'Practice', icon: Target },
    { id: 'lobby', label: 'Tournaments', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
    { id: 'avatar_customizer', label: 'Inventory', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Mobile Bottom Nav Items - 5 ergonomic thumb-friendly slots with elevated center Arena action
  const mobileNavItems: Array<{
    id: ScreenState | 'menu';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isCenter?: boolean;
  }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'solo_quest', label: 'Practice', icon: Target },
    { id: 'arena_3d', label: 'Arena', icon: Swords, isCenter: true },
    { id: 'leaderboard', label: 'Ranks', icon: BarChart3 },
    { id: 'menu', label: 'Menu', icon: Menu }
  ];

  // Drawer all-features navigation list
  const drawerNavItems: Array<{
    id: ScreenState;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', description: 'Command center & stats', icon: LayoutDashboard },
    { id: 'arena_3d', label: 'Live 1v1 Arena', description: 'Real-time PvP coding match', icon: Swords, badge: 'HOT', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { id: 'solo_quest', label: 'Practice Odyssey', description: 'Adaptive DSA solo questions', icon: Target },
    { id: 'lobby', label: 'Tournaments & Lobbies', description: 'Custom rooms & brackets', icon: Trophy },
    { id: 'leaderboard', label: 'Global Leaderboard', description: 'Seasonal ranked standings', icon: BarChart3 },
    { id: 'avatar_customizer', label: '3D Loadout Studio', description: 'Visor glow, cosmetics & titles', icon: Package },
    { id: 'brainrot_shorts', label: 'Viral DSA Shorts', description: 'Bite-sized mobile clips', icon: Smartphone, badge: 'VIRAL', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { id: 'profile', label: 'Profile & Mastery', description: 'Discipline radar & history', icon: Shield },
    { id: 'settings', label: 'Settings & Alerts', description: 'Audio & notifications', icon: Settings }
  ];

  // Page Header Title mapping
  const getPageTitle = (): string => {
    switch (active) {
      case 'dashboard':
        return 'Dashboard';
      case 'arena_3d':
        return '1v1 Match Arena';
      case 'lobby':
        return 'Custom Room Lobby';
      case 'leaderboard':
        return 'Global Leaderboard';
      case 'profile':
        return 'User Profile & Mastery';
      case 'settings':
        return 'Settings';
      case 'solo_quest':
        return 'Practice & Solo Quest';
      case 'avatar_customizer':
        return '3D Loadout Studio';
      case 'brainrot_shorts':
        return 'Viral DSA Shorts';
      default:
        return 'CLUTCH-ARENA';
    }
  };

  return (
    <div className="w-screen h-screen flex bg-[#090d10] text-slate-100 overflow-hidden select-none relative font-sans">
      {/* Background Perspective Grid Floor */}
      <div className="cyber-grid-floor opacity-60" />

      {/* Ambient Neon Atmosphere Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* =========================================================
          DESKTOP / TABLET TITANIUM SIDEBAR
          ========================================================= */}
      {showSidebar && (
        <aside
          className={`hidden md:flex flex-col border-r border-white/5 bg-[#0e141a]/95 backdrop-blur-2xl z-30 transition-all duration-300 relative shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
            sidebarCollapsed ? 'w-20' : 'w-60'
          }`}
        >
          {/* Top Logo & Branding */}
          <div className="h-20 flex items-center justify-between px-5 border-b border-white/5">
            <button
              onClick={() => handleNav('dashboard')}
              className="flex items-center gap-3 text-left overflow-hidden group"
              title="CLUTCH-ARENA"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center shrink-0 p-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:border-emerald-400 transition-colors">
                <img
                  src={CLUTCH_LOGO}
                  alt="CLUTCH Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                />
              </div>

              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-cyber font-black text-sm tracking-wider text-white group-hover:text-emerald-400 transition-colors">
                    CLUTCH-ARENA
                  </span>
                  <span className="text-[9px] font-mono text-emerald-500/70 tracking-tight font-bold">
                    CYBER COMBAT ARENA
                  </span>
                </div>
              )}
            </button>

            {/* Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCurrent =
                active === item.id ||
                (item.id === 'arena_3d' && active === 'lobby') ||
                (item.id === 'lobby' && active === 'arena_3d' && false);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isCurrent
                      ? 'clutch-nav-active'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isCurrent ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-slate-500'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer with Settings & Futuristic Accent Corner */}
          <div className="p-4 border-t border-white/5 flex flex-col gap-2 relative">
            <button
              onClick={() => handleNav('settings')}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>

            {/* Stylized Bottom-Left Corner Cyber Accent Line */}
            <div className="w-8 h-1 bg-gradient-to-r from-emerald-500 to-transparent rounded-full opacity-60 mt-1" />
          </div>
        </aside>
      )}

      {/* =========================================================
          MAIN APPLICATION VIEWPORT
          ========================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header Bar (Responsive & Clean on all viewports) */}
        <header className="h-14 sm:h-20 border-b border-white/5 bg-[#0e141a]/95 backdrop-blur-2xl px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4 z-20 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          {/* Left: Mobile Brand & Screen Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => handleNav('dashboard')}
              className="flex items-center gap-2 md:hidden active:scale-95 transition-transform shrink-0"
              title="Dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/40 p-1 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                <img src={CLUTCH_LOGO} alt="CLUTCH" className="w-full h-full object-contain" />
              </div>
            </button>

            <h1 className="font-cyber font-bold text-xs sm:text-base text-white tracking-wide truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header Badges: Audio, Chat, Notifications, User Status Pill */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Audio Toggle (Visible on Mobile too) */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs transition-colors flex items-center justify-center active:scale-95 min-h-[36px] min-w-[36px] ${
                sfxEnabled
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                  : 'bg-[#141b22] border-white/10 text-slate-500 hover:text-white'
              }`}
              title={sfxEnabled ? 'Audio Active (Click to Mute)' : 'Audio Muted'}
            >
              {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Chat Trigger Icon with Live Green Dot */}
            <button
              onClick={() => setFriendsModalOpen(true)}
              className="relative p-2 rounded-xl bg-[#141b22] border border-white/10 hover:border-emerald-500/40 text-slate-400 hover:text-white transition-all active:scale-95 shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Chat & Player Comms"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </button>

            {/* Notification Bell Icon */}
            <button
              onClick={() => handleNav('settings')}
              className="relative p-2 rounded-xl bg-[#141b22] border border-white/10 hover:border-emerald-500/40 text-slate-400 hover:text-white transition-all active:scale-95 shadow-sm min-h-[36px] min-w-[36px] hidden xs:flex items-center justify-center"
              title="System Alerts"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>

            {/* User Profile Pill (Compact on Mobile, Full on Tablet/Desktop) */}
            <button
              onClick={() => handleNav('profile')}
              className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#141b22] border border-white/10 hover:border-emerald-500/40 transition-all active:scale-95 shadow-sm min-h-[36px]"
              title="Profile"
            >
              {/* Circular Avatar with Glowing Ring */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 border border-emerald-400/50 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                style={{ backgroundColor: userProfile.avatar?.color || '#10b981' }}
              >
                {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'G'}
              </div>

              {/* Callsign & Online Status (Hidden on small mobile screens to save space) */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-cyber font-bold text-white tracking-wide leading-tight">
                  {userProfile.username || 'GR36_99'}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  ONLINE
                </span>
              </div>
            </button>

            {/* Mobile Drawer Hamburger Trigger */}
            <button
              onClick={() => {
                if (sfxEnabled) soundSynth.click();
                setMobileDrawerOpen(true);
              }}
              className="md:hidden p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:text-white transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area with Independent Scroll & Touch Optimization */}
        <main className="flex-1 overflow-y-auto pb-[calc(5.8rem+env(safe-area-inset-bottom))] md:pb-6 relative z-10 px-3 sm:px-8 py-3.5 sm:py-6 max-w-7xl w-full mx-auto overscroll-contain">
          {children}
        </main>

        {/* =========================================================
            MOBILE BOTTOM NAVIGATION DOCK (Ergonomic 5-slot Layout)
            ========================================================= */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e141a]/95 border-t border-white/10 rounded-t-2xl backdrop-blur-2xl z-40 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 px-2">
          <div className="grid grid-cols-5 items-center max-w-md mx-auto">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = item.id !== 'menu' && active === item.id;

              if (item.id === 'menu') {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (sfxEnabled) soundSynth.click();
                      setMobileDrawerOpen(true);
                    }}
                    className="flex flex-col items-center justify-center py-1 transition-all active:scale-95 text-slate-400 hover:text-slate-200"
                  >
                    <div className="p-1 rounded-full">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
                  </button>
                );
              }

              if (item.isCenter) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id as ScreenState)}
                    className="flex flex-col items-center justify-center -mt-4 transition-all active:scale-90 group relative"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.7)] scale-105'
                          : 'bg-[#141f27] border border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                      }`}
                    >
                      <Icon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </div>
                    <span className={`text-[10px] font-cyber font-bold tracking-tight mt-1 ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id as ScreenState)}
                  className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
                    isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`px-3 py-1 rounded-full transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                        : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5 truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Native Home Bar Pill */}
          <div className="w-28 h-1 rounded-full bg-white/20 mx-auto mt-1.5 pointer-events-none" />
        </nav>
      </div>

      {/* =========================================================
          MOBILE SLIDE-OUT CYBER DRAWER (Complete Access to All Screens)
          ========================================================= */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Click Dismiss */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
          />

          {/* Slide-in Panel from Right */}
          <div className="relative ml-auto w-full max-w-xs h-full bg-[#0d1319] border-l border-emerald-500/30 p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="flex flex-col gap-5">
              {/* Drawer Top Header with Profile Card & Close */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 border border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                    style={{ backgroundColor: userProfile.avatar?.color || '#10b981' }}
                  >
                    {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-cyber font-black text-sm text-white truncate max-w-[150px]">
                      {userProfile.username || 'PLAYER'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {userProfile.ratingMMR || 2140} ELO • {userProfile.rankTier || 'MASTER'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items in Drawer */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 block font-bold mb-1">
                  TACTICAL NAVIGATION
                </span>

                {drawerNavItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = active === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isCurrent
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-emerald-500/30 text-white' : 'bg-white/5 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-cyber tracking-wide truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${item.badgeColor || 'bg-emerald-500/20 text-emerald-300'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 truncate">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Audio & System Controls */}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  {sfxEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  Sound Effects (SFX)
                </span>
                <button
                  onClick={handleToggleSound}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${sfxEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${sfxEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <button
                onClick={() => handleNav('home')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-cyber font-bold text-slate-300 hover:text-white transition-colors text-center"
              >
                Return to Splash Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      <FriendsModal
        isOpen={friendsModalOpen}
        onClose={() => setFriendsModalOpen(false)}
      />
    </div>
  );
};
