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
  switchRole: (role: UserRole) => void;
  getAvailableRoles: () => UserProfile[];
}

const DEFAULT_TEST_USERNAME = 'TEST';
const DEFAULT_TEST_PASSWORD = 'TEST';

// Test users for each role
const TEST_USERS: Record<string, UserProfile> = {
  LOADMASTER: {
    id: 'user_loadmaster',
    username: 'LOADMASTER',
    displayName: 'Alex Johnson (Loadmaster)',
    role: 'loadmaster',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  },
  MECHANIC: {
    id: 'user_mechanic',
    username: 'MECHANIC',
    displayName: 'Mike Torres (Mechanic)',
    role: 'mechanic',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  },
  PILOT: {
    id: 'user_pilot',
    username: 'PILOT',
    displayName: 'Capt. Sarah Chen',
    role: 'pilot',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  },
  DISPATCHER: {
    id: 'user_dispatcher',
    username: 'DISPATCHER',
    displayName: 'Jordan Lee (Dispatcher)',
    role: 'dispatcher',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  },
  ADMIN: {
    id: 'user_admin',
    username: 'ADMIN',
    displayName: 'Chris Martinez (Manager)',
    role: 'admin',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  },
  SUPERADMIN: {
    id: 'user_superadmin',
    username: 'SUPERADMIN',
    displayName: 'LoadMaster Pro Support',
    role: 'super_admin',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  },
  // Legacy test user (defaults to super_admin for compatibility)
  TEST: {
    id: 'user_test',
    username: 'TEST',
    displayName: 'Test User',
    role: 'super_admin',
    operatorCode: 'WGA',
    createdAt: new Date().toISOString(),
  },
};

function makeTestUser(): UserProfile {
  return TEST_USERS.TEST;
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

        // Check if username matches any test user
        const user = TEST_USERS[u];
        if (user && p === DEFAULT_TEST_PASSWORD) {
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

      switchRole: (role) => {
        const user = Object.values(TEST_USERS).find((u) => u.role === role);
        if (user) {
          set({ status: 'authenticated', currentUser: user });
          bestEffortAudit('USER_LOGIN', user);
        }
      },

      getAvailableRoles: () => {
        return Object.values(TEST_USERS).filter((u) => u.username !== 'TEST');
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

export { TEST_USERS };


