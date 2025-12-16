/**
 * Auth store (local-only).
 *
 * - Auto-seeds a default TEST user.
 * - Persists current user in localStorage.
 * - Best-effort audit logging for login/logout.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from './types';
import { logAudit } from '../../db/repositories/auditRepository';
import { isDatabaseInitialized } from '../../db/database';

type AuthStatus = 'authenticated' | 'anonymous';

interface AuthState {
  status: AuthStatus;
  currentUser: UserProfile | null;

  ensureDefaultUser: () => void;
  login: (username: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
}

const DEFAULT_TEST_USERNAME = 'TEST';
const DEFAULT_TEST_PASSWORD = 'TEST';

function makeTestUser(): UserProfile {
  return {
    id: 'user_test',
    username: DEFAULT_TEST_USERNAME,
    displayName: 'Test User',
    role: 'test',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  };
}

function bestEffortAudit(action: 'USER_LOGIN' | 'USER_LOGOUT', user: UserProfile | null) {
  try {
    if (!isDatabaseInitialized()) return;
    logAudit({
      action,
      userId: user?.id ?? undefined,
      operatorId: undefined,
      entityType: 'user',
      entityId: user?.id ?? 'anonymous',
      metadata: {
        username: user?.username ?? null,
        operatorCode: user?.operatorCode ?? null,
      },
    });
  } catch {
    // swallow (prototype)
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'anonymous',
      currentUser: null,

      ensureDefaultUser: () => {
        const { currentUser, status } = get();
        if (status === 'authenticated' && currentUser) return;

        const user = makeTestUser();
        set({ status: 'authenticated', currentUser: user });
        bestEffortAudit('USER_LOGIN', user);
      },

      login: (username, password) => {
        const u = username.trim().toUpperCase();
        const p = password.trim().toUpperCase();

        if (u === DEFAULT_TEST_USERNAME && p === DEFAULT_TEST_PASSWORD) {
          const user = makeTestUser();
          set({ status: 'authenticated', currentUser: user });
          bestEffortAudit('USER_LOGIN', user);
          return { ok: true };
        }

        return { ok: false, error: 'Invalid credentials (prototype)' };
      },

      logout: () => {
        const prev = get().currentUser;
        set({ status: 'anonymous', currentUser: null });
        bestEffortAudit('USER_LOGOUT', prev);
      },
    }),
    {
      name: 'loadmaster-auth',
      version: 1,
      partialize: (state) => ({
        status: state.status,
        currentUser: state.currentUser,
      }),
    }
  )
);

export const AUTH_DEFAULTS = {
  username: DEFAULT_TEST_USERNAME,
  password: DEFAULT_TEST_PASSWORD,
};


