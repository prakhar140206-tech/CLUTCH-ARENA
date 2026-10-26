import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { soundSynth } from '../services/soundSynth.js';
import { AppShell } from '../components/navigation/AppShell.js';
import { API_BASE_URL } from '../config/api';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Code2,
  Zap,
  CheckCircle2,
  LogIn
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const loginUser = useGameStore((s) => s.loginUser);
  const updateUserProfile = useGameStore((s) => s.updateUserProfile);
  const setOnboardingOpen = useGameStore((s) => s.setOnboardingOpen);

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [handle, setHandle] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [selectedTitle, setSelectedTitle] = useState<string>('Dijkstra’s Favorite Child 👑');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setErrorMsg('Please enter your player callsign handle');
      soundSynth.vineBoom();
      return;
    }
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: handle.trim(), password: password || 'clutch2026' })
      });
      const data = await res.json();
      if (!res.ok) {
        // If user not registered yet or guest, allow fallback login
        loginUser(handle.trim(), email.trim() || undefined);
        setSuccessMsg('Logged in as ' + handle.trim());
        setOnboardingOpen(true);
      } else {
        loginUser(data.profile.username, data.profile.email);
        updateUserProfile(data.profile);
        setSuccessMsg('Authentication verified. Welcome back, ' + data.profile.username + '!');
        if (!data.profile?.dsaPreferences) {
          setOnboardingOpen(true);
        }
      }
      soundSynth.levelUp();
      setTimeout(() => {
        setScreen('dashboard');
      }, 500);
    } catch {
      // Offline fallback
      loginUser(handle.trim(), email.trim() || undefined);
      setSuccessMsg('Session initiated. Loading CLUTCH Arena...');
      setTimeout(() => setScreen('dashboard'), 700);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setErrorMsg('Please choose an arena callsign handle');
      soundSynth.vineBoom();
      return;
    }
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: handle.trim(),
          password: password || 'clutch2026',
          email: email.trim() || `${handle.toLowerCase()}@clutch.gg`
        })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        loginUser(data.profile.username, data.profile.email);
        updateUserProfile({
          ...data.profile,
          equippedTitle: selectedTitle,
          preferredLanguage: selectedLanguage
        });
        setSuccessMsg('Callsign registered! 50,000 Starting Aura unlocked.');
      } else {
        loginUser(handle.trim(), email.trim() || `${handle.toLowerCase()}@clutch.arena`);
        updateUserProfile({
          equippedTitle: selectedTitle,
          preferredLanguage: selectedLanguage,
          auraPoints: 50000,
          auraTitle: 'Algorithm Rizzler'
        });
        setSuccessMsg('Callsign registered in local arena session.');
      }
      soundSynth.levelUp();
      setOnboardingOpen(true);
      setTimeout(() => {
        setScreen('dashboard');
      }, 500);
    } catch {
      loginUser(handle.trim(), email.trim() || `${handle.toLowerCase()}@clutch.arena`);
      soundSynth.levelUp();
      setSuccessMsg('Account registered locally.');
      setOnboardingOpen(true);
      setTimeout(() => setScreen('dashboard'), 500);
    }
  };

  const handleGuestQuickplay = () => {
    soundSynth.click();
    setScreen('dashboard');
  };

  return (
    <AppShell activeScreen="auth" showSidebar={false}>
      <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md clutch-panel-elevated rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              <img src="/logo.png" alt="CLUTCH" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-cyber font-black text-2xl text-white tracking-wide">
              AUTHENTICATE PILOT
            </h2>
            <p className="text-xs font-mono text-clutch-muted mt-1">
              Enter the competitive DSA proving grounds
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-clutch-surface-light p-1 rounded-xl border border-clutch-border mb-6">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-clutch-violet text-white shadow-md'
                  : 'text-clutch-muted hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-clutch-violet text-white shadow-md'
                  : 'text-clutch-muted hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-clutch-rose/10 border border-clutch-rose/40 text-clutch-rose text-xs font-mono">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-clutch-emerald/10 border border-clutch-emerald/40 text-clutch-emerald text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleSignUp} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                CALLSIGN HANDLE / USERNAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-clutch-subtle absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. ByteKnight_99"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-clutch-violet transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                EMAIL {tab === 'login' ? '(OPTIONAL)' : ''}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-clutch-subtle absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="coder@algorithm.arena"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-clutch-violet transition-colors font-mono"
                />
              </div>
            </div>

            {tab === 'signup' && (
              <>
                <div>
                  <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                    PREFERRED CODING LANGUAGE
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as any)}
                    className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                  >
                    <option value="python">Python 3 (Recommended)</option>
                    <option value="javascript">JavaScript / TypeScript</option>
                    <option value="cpp">C++ (G++17)</option>
                    <option value="java">Java 21</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-clutch-muted block mb-1.5">
                    EQUIPPED REPUTATION TITLE
                  </label>
                  <select
                    value={selectedTitle}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="w-full bg-clutch-surface-light border border-clutch-border text-clutch-lavender text-xs p-2.5 rounded-lg focus:outline-none focus:border-clutch-violet font-mono"
                  >
                    <option value="Dijkstra’s Favorite Child 👑">Dijkstra’s Favorite Child 👑</option>
                    <option value="O(1) Space Sigma 🗿">O(1) Space Sigma 🗿</option>
                    <option value="Binary Tree Whisperer 🌲">Binary Tree Whisperer 🌲</option>
                    <option value="Recursion Without Fear ⚡">Recursion Without Fear ⚡</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full clutch-btn-primary py-3 text-xs flex items-center justify-center gap-2 mt-2"
            >
              <span>{tab === 'login' ? 'Authenticate & Enter' : 'Register Callsign'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Guest Access */}
          <div className="mt-6 pt-5 border-t border-clutch-border text-center">
            <button
              onClick={handleGuestQuickplay}
              className="text-xs font-mono text-clutch-muted hover:text-clutch-lavender transition-colors inline-flex items-center gap-1.5"
            >
              <span>Skip for now, play as Guest Pilot</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
