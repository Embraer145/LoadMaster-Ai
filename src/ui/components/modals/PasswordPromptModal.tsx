/**
 * Password Prompt Modal
 * 
 * Re-prompt super_admin for password before allowing critical operations.
 * This provides an extra layer of security for sensitive changes.
 */

import React, { useState } from 'react';
import { Shield, X, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@core/auth';

interface PasswordPromptModalProps {
  title: string;
  message: string;
  contactInfo?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  title,
  message,
  contactInfo = 'LoadMasterProAI.com',
  onConfirm,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { currentUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      // Verify the password matches the current super_admin user
      // In a real system, this would call an API endpoint to verify
      // For now, we'll do a simple check (enhance this in production)
      
      // Simulate async verification
      await new Promise(resolve => setTimeout(resolve, 500));

      if (currentUser?.role !== 'super_admin') {
        setError('Only super administrators can perform this action.');
        setIsVerifying(false);
        return;
      }

      // In prototype mode, accept any non-empty password for super_admin
      // TODO: In production, verify against actual user password via secure API
      if (!password || password.length < 1) {
        setError('Password is required.');
        setIsVerifying(false);
        return;
      }

      // Password verified - proceed with action
      onConfirm();
    } catch (err) {
      setError('Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning Banner */}
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-200 font-medium">{message}</p>
              {contactInfo && (
                <p className="text-xs text-amber-300/70 mt-2">
                  To request changes, contact: <span className="font-bold">{contactInfo}</span>
                </p>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Super Admin Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter your password"
              autoFocus
              disabled={isVerifying}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isVerifying || !password}
            >
              {isVerifying ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            🔒 This action requires super administrator privileges
          </p>
        </div>
      </div>
    </div>
  );
};

