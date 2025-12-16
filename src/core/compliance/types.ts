export type ComplianceStatus = 'pass' | 'warn' | 'fail' | 'todo';

export interface ComplianceCheck {
  id: string;
  section: string;
  title: string;
  requirement: string;
  status: ComplianceStatus;
  blocking: boolean;
  details?: string;
}

export interface ComplianceReport {
  generatedAtUtc: string;
  appVersion: string;
  offline: {
    online: boolean;
    effectiveOfflineAllowed: boolean;
    maxCacheAgeHours: number;
    notes: string[];
  };
  summary: {
    pass: number;
    warn: number;
    fail: number;
    todo: number;
    blockingFailures: number;
    ready: boolean;
  };
  checks: ComplianceCheck[];
}


