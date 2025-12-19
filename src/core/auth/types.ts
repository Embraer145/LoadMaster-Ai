/**
 * Auth / User profile types (local-only prototype).
 *
 * NOTE: This is scaffolding for future real auth + billing attribution.
 */

export type UserRole = 'test' | 'worker' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  operatorCode: string;
  createdAt: string;
}


