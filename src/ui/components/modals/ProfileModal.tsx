import React, { useMemo, useState } from 'react';
import { LogIn, LogOut, X } from 'lucide-react';
import { AUTH_DEFAULTS, useAuthStore } from '@core/auth';
import avatarUrl from '../../../assets/avatar-loadmaster.svg';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { status, currentUser, login, logout } = useAuthStore();
  const [username, setUsername] = useState(AUTH_DEFAULTS.username);
  const [password, setPassword] = useState(AUTH_DEFAULTS.password);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (status === 'authenticated' && currentUser) return currentUser.username;
    return 'Profile';
  }, [status, currentUser]);

  if (!isOpen) return null;

  const handleLogin = () => {
    const result = login(username, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onClose();
  };

  const handleLogout = () => {
    logout();
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[220]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close profile"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={avatarUrl}
                alt="User avatar"
                className="w-7 h-7 rounded-full border border-slate-700 bg-slate-950/40"
                draggable={false}
              />
              <div className="text-sm font-bold text-white">{title}</div>
            </div>
            <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-white" title="Close">
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Signed in</div>
              <div className="mt-1 text-[12px] text-slate-200 font-mono">
                {status === 'authenticated' && currentUser ? (
                  <>
                    {currentUser.displayName} <span className="text-slate-500">({currentUser.username})</span>
                  </>
                ) : (
                  <span className="text-slate-500">Anonymous</span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Username</div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full bg-transparent outline-none text-slate-100 font-mono text-sm"
                  placeholder="TEST"
                  autoCapitalize="characters"
                  autoCorrect="off"
                />
              </div>
              <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Password</div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full bg-transparent outline-none text-slate-100 font-mono text-sm"
                  placeholder="TEST"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  type="password"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 text-[11px] text-amber-300 font-bold">
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleLogin}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <LogIn size={14} /> Login
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>

            <div className="mt-3 text-[10px] text-slate-500">
              Prototype credentials: <span className="font-mono text-slate-300">TEST / TEST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


