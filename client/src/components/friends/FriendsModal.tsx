import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { socketService } from '../../services/socketService.js';
import { soundSynth } from '../../services/soundSynth.js';
import { API_BASE_URL } from '../../config/api.js';
import confetti from 'canvas-confetti';
import {
  Users,
  UserPlus,
  Inbox,
  Check,
  X,
  Swords,
  Search,
  Sparkles,
  Shield,
  Clock,
  Send,
  AlertCircle,
  Copy,
  Zap,
  TrendingUp
} from 'lucide-react';

interface FriendItem {
  id: string;
  username: string;
  ratingMMR: number;
  rankTier: string;
  auraPoints: number;
  stats?: {
    matchesPlayed: number;
    matchesWon: number;
    challengesSolved: number;
    highestStreak: number;
  };
}

interface FriendRequestItem {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
  const userProfile = useGameStore((s) => s.userProfile);
  const setScreen = useGameStore((s) => s.setScreen);

  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'requests'>('friends');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [searchHandle, setSearchHandle] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [invitingFriend, setInvitingFriend] = useState<string | null>(null);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const fetchFriends = async () => {
    if (!userProfile?.id || userProfile.isGuest) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends?userId=${userProfile.id}`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncomingRequests(data.incomingRequests || []);
        setOutgoingRequests(data.outgoingRequests || []);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, userProfile.id]);

  // Periodic poll and socket listener for live friend requests
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleReqReceived = (data: any) => {
      if (data.targetUserId === userProfile.id) {
        soundSynth.levelUp();
        fetchFriends();
      }
    };

    const handleReqAccepted = (data: any) => {
      if (data.userId === userProfile.id) {
        soundSynth.levelUp();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        fetchFriends();
      }
    };

    socket.on('friend_request_received', handleReqReceived);
    socket.on('friend_request_accepted', handleReqAccepted);

    return () => {
      socket.off('friend_request_received', handleReqReceived);
      socket.off('friend_request_accepted', handleReqAccepted);
    };
  }, [userProfile.id]);

  if (!isOpen) return null;

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHandle.trim()) return;

    setActionLoading('send');
    setStatusMessage(null);

    try {
      soundSynth.click();
      const res = await fetch(`${API_BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: userProfile.id,
          toUsername: searchHandle.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ text: data.message || data.error || 'Failed to send friend request.', isError: true });
        soundSynth.vineBoom();
      } else {
        setStatusMessage({ text: data.message || `Friend request dispatched to ${searchHandle.trim()}!`, isError: false });
        soundSynth.levelUp();
        setSearchHandle('');
        fetchFriends();
      }
    } catch (err: any) {
      setStatusMessage({ text: `Network error: ${err.message}`, isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          requestId,
          action
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (action === 'accept') {
          soundSynth.levelUp();
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } else {
          soundSynth.click();
        }
        fetchFriends();
      } else {
        alert(data.message || 'Action failed.');
      }
    } catch (err: any) {
      alert(`Error responding: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuelFriend = async (friend: FriendItem) => {
    try {
      soundSynth.airhorn();
      setInvitingFriend(friend.username);
      const room = await socketService.createRoom(userProfile, {
        mode: 'duel_1v1',
        maxPlayers: 2,
        roundDurationSeconds: 60,
        totalRounds: 3
      });
      setCreatedRoomCode(room.id);
    } catch (err: any) {
      alert(`Could not create duel: ${err.message}`);
      setInvitingFriend(null);
    }
  };

  const handleEnterArena = () => {
    onClose();
    setScreen('arena_3d');
  };

  const handleCopyCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopiedCode(true);
      soundSynth.click();
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-clutch-surface border border-clutch-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-clutch-border flex items-center justify-between bg-clutch-surface-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center text-clutch-lavender">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cyber font-bold text-base text-white tracking-wide flex items-center gap-2">
                <span>FRIENDS & PILOT NETWORK</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-emerald/20 text-clutch-emerald border border-clutch-emerald/30">
                  REAL-TIME
                </span>
              </h2>
              <p className="text-xs font-mono text-clutch-muted">Send requests, team up, or challenge friends to algorithmic duels</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-clutch-surface-light border border-clutch-border text-clutch-muted hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-clutch-border bg-clutch-surface-light/40 px-5 pt-3 gap-2">
          <button
            onClick={() => { setActiveTab('friends'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'friends'
                ? 'border-clutch-violet text-clutch-lavender'
                : 'border-transparent text-clutch-muted hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Friends ({friends.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('add'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'add'
                ? 'border-clutch-violet text-clutch-lavender'
                : 'border-transparent text-clutch-muted hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>

          <button
            onClick={() => { setActiveTab('requests'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all relative ${
              activeTab === 'requests'
                ? 'border-clutch-violet text-clutch-lavender'
                : 'border-transparent text-clutch-muted hover:text-slate-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-clutch-rose text-white text-[9px] font-bold flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Active Duel Invite Banner */}
          {createdRoomCode && (
            <div className="p-4 rounded-xl bg-clutch-violet/20 border border-clutch-violet/60 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-clutch-lavender font-bold uppercase tracking-wider block">
                  ⚔️ DUEL ROOM HOSTED WITH {invitingFriend}
                </span>
                <span className="text-sm font-cyber font-bold text-white">Room Code: {createdRoomCode}</span>
                <p className="text-[11px] font-mono text-clutch-muted">Send this code to your friend to join your 1v1 match!</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyCode}
                  className="clutch-btn-ghost px-3 py-1.5 text-xs flex items-center justify-center gap-1.5 font-mono"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-clutch-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={handleEnterArena}
                  className="clutch-btn-primary px-4 py-1.5 text-xs flex items-center justify-center gap-1.5"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Enter Arena</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-clutch-surface-light border border-clutch-border mx-auto flex items-center justify-center text-clutch-muted">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-cyber font-bold text-sm text-white">NO FRIENDS ADDED YET</h3>
                    <p className="text-xs font-mono text-clutch-muted max-w-sm mx-auto mt-1">
                      Search any registered pilot by their callsign handle in the "Add Friend" tab to connect and compete!
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="clutch-btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Send a Friend Request</span>
                  </button>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-3.5 rounded-xl bg-clutch-surface-light border border-clutch-border flex items-center justify-between gap-4 transition-all hover:border-clutch-violet/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center font-cyber font-black text-sm text-clutch-lavender">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-cyber font-bold text-sm text-white">{friend.username}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clutch-violet/20 text-clutch-lavender border border-clutch-violet/30">
                            {friend.rankTier}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-clutch-subtle mt-0.5">
                          {friend.ratingMMR} MMR • {(friend.auraPoints || 0).toLocaleString()} Aura • {friend.stats?.matchesWon || 0} Wins
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDuelFriend(friend)}
                      className="clutch-btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 whitespace-nowrap shadow-md"
                    >
                      <Swords className="w-3.5 h-3.5 text-clutch-amber" />
                      <span>Duel 1v1</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ADD FRIEND */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <form onSubmit={handleSendRequest} className="space-y-3">
                <label className="text-xs font-mono text-clutch-muted block">
                  ENTER PILOT CALLSIGN HANDLE
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-clutch-subtle" />
                    <input
                      type="text"
                      value={searchHandle}
                      onChange={(e) => setSearchHandle(e.target.value)}
                      placeholder="e.g. Prakhar or Piyush"
                      className="w-full bg-clutch-surface-light border border-clutch-border text-white text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-clutch-violet font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading === 'send' || !searchHandle.trim()}
                    className="clutch-btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{actionLoading === 'send' ? 'Sending...' : 'Send Request'}</span>
                  </button>
                </div>
              </form>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                    statusMessage.isError
                      ? 'bg-clutch-rose/10 border-clutch-rose/40 text-clutch-rose'
                      : 'bg-clutch-emerald/10 border-clutch-emerald/40 text-clutch-emerald'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-clutch-surface-light/40 border border-clutch-border/60 text-xs font-mono text-clutch-muted space-y-2">
                <span className="text-white font-bold block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-clutch-amber" /> Real-time Matchmaking with Friends
                </span>
                <p>1. Send a friend request by typing your teammate or competitor's exact callsign.</p>
                <p>2. Once accepted, they appear in your friend network with real-time MMR and stats.</p>
                <p>3. Click "Duel 1v1" next to any friend to host a private battle room and duel live!</p>
              </div>

              {/* Pending Outgoing Requests */}
              {outgoingRequests.length > 0 && (
                <div className="pt-3 border-t border-clutch-border space-y-2">
                  <span className="text-[11px] font-mono text-clutch-subtle uppercase block font-bold">
                    PENDING OUTGOING REQUESTS ({outgoingRequests.length})
                  </span>
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-lg bg-clutch-surface-light border border-clutch-border flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-200">Sent to: <b className="text-white">{req.toUsername}</b></span>
                      <span className="text-[10px] text-clutch-amber flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Waiting for response
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INCOMING REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-clutch-surface-light border border-clutch-border mx-auto flex items-center justify-center text-clutch-muted">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="font-cyber font-bold text-sm text-white">NO PENDING REQUESTS</h3>
                  <p className="text-xs font-mono text-clutch-muted">When other pilots send you a friend request, they will appear here for you to accept!</p>
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-clutch-surface-light border border-clutch-border flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-clutch-violet/20 border border-clutch-violet/40 flex items-center justify-center font-cyber font-black text-sm text-clutch-lavender">
                        {req.fromUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-cyber font-bold text-sm text-white block">{req.fromUsername}</span>
                        <span className="text-[11px] font-mono text-clutch-muted">Sent you a friend request</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'accept')}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-lg bg-clutch-emerald/20 hover:bg-clutch-emerald/30 border border-clutch-emerald/40 text-clutch-emerald text-xs font-mono font-bold flex items-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req.id, 'decline')}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-lg bg-clutch-rose/20 hover:bg-clutch-rose/30 border border-clutch-rose/40 text-clutch-rose text-xs font-mono font-bold flex items-center gap-1 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-clutch-border bg-clutch-surface-elevated/40 flex items-center justify-between text-xs font-mono text-clutch-subtle">
          <span>Your Callsign: <b className="text-white">{userProfile.username}</b></span>
          <button
            onClick={onClose}
            className="clutch-btn-ghost px-4 py-1.5 text-xs font-mono"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
