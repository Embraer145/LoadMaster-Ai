import type { EnvConfig } from '@config/env';
import type { AppSettings } from '@core/settings';
import type { ComplianceCheck, ComplianceReport, ComplianceStatus } from './types';

function countStatus(checks: ComplianceCheck[], status: ComplianceStatus): number {
  return checks.filter((c) => c.status === status).length;
}

export function evaluateCompliance(params: {
  env: EnvConfig;
  settings: AppSettings;
  online: boolean;
  // As the app evolves we can pass deeper signals here:
  hasEnvelopeInterpolation: boolean;
  hasImmutableFinalize: boolean;
  hasRoleBasedAccess: boolean;
}): ComplianceReport {
  const { env, settings, online, hasEnvelopeInterpolation, hasImmutableFinalize, hasRoleBasedAccess } = params;

  const generatedAtUtc = new Date().toISOString();
  const effectiveOfflineAllowed = !!settings.compliance.offlinePolicy.allowed && !!env.offlineEnabled;
  const notes: string[] = [];

  if (!env.offlineEnabled) notes.push('Runtime env disables offline mode (VITE_OFFLINE_ENABLED=false).');
  if (!settings.compliance.offlinePolicy.allowed) notes.push('Admin policy disables offline operation.');
  if (effectiveOfflineAllowed) notes.push(`Offline allowed with max cache age ${settings.compliance.offlinePolicy.maxCacheAgeHours}h (requires caching implementation).`);
  if (!online) notes.push('Device is currently OFFLINE.');

  const checks: ComplianceCheck[] = [
    {
      id: '1.1',
      section: 'Regulatory Positioning',
      title: 'Software classification declared',
      requirement: 'EFB Type B, advisory tool; not avionics/auto-release.',
      status: 'pass',
      blocking: true,
      details: 'UI requires explicit human action for finalize; no auto-release endpoints.',
    },
    {
      id: '1.2',
      section: 'Regulatory Positioning',
      title: 'Scope limitation enforced',
      requirement: 'No bypass of dispatcher/loadmaster approval; no silent flight release.',
      status: 'pass',
      blocking: true,
      details: 'Finalize is an explicit action and is gated by in-limits status.',
    },
    {
      id: '2.1',
      section: 'Functional Correctness',
      title: 'Deterministic math engine',
      requirement: 'Same inputs → same outputs; no probabilistic steps.',
      status: 'pass',
      blocking: true,
      details: 'Core physics calculations are pure functions (deterministic).',
    },
    {
      id: '2.2',
      section: 'Functional Correctness',
      title: 'Matches approved reference system',
      requirement: 'Compare against Evionica/approved system within tolerance; document rounding.',
      status: 'todo',
      blocking: true,
      details: 'Pending: add Evionica/Excel comparison harness + validation dataset.',
    },
    {
      id: '2.3',
      section: 'Functional Correctness',
      title: 'Envelope enforcement',
      requirement: 'CG envelope enforced for ZFW/TOW/LW; envelope versioned.',
      status: hasEnvelopeInterpolation ? 'pass' : 'warn',
      blocking: true,
      details: hasEnvelopeInterpolation
        ? 'Envelope limits derived from table interpolation.'
        : 'Currently uses simplified/heuristic limits in physics engine; upgrade to envelope-table interpolation.',
    },
    {
      id: '3.1',
      section: 'Failure Modes',
      title: 'Fail-safe behavior',
      requirement: 'Missing/invalid data blocks calculation; no guessing.',
      status: 'warn',
      blocking: true,
      details: 'In progress: add explicit blocking errors and assumptions disclosure for any defaulted values.',
    },
    {
      id: '3.2',
      section: 'Failure Modes',
      title: 'No silent degradation',
      requirement: 'All assumptions logged and visible.',
      status: settings.compliance.requireAssumptionsDisclosure ? 'warn' : 'fail',
      blocking: true,
      details: settings.compliance.requireAssumptionsDisclosure
        ? 'Proof pack includes assumptions section; expand to a mandatory structured assumptions list from calculation trace.'
        : 'Assumptions disclosure disabled by policy.',
    },
    {
      id: '3.3',
      section: 'Failure Modes',
      title: 'Offline behavior defined',
      requirement: 'Offline policy explicit; cache age enforced; clear offline banner.',
      status: effectiveOfflineAllowed ? 'warn' : 'pass',
      blocking: true,
      details: effectiveOfflineAllowed
        ? 'Offline policy is enabled, but cache age enforcement requires caching/service worker implementation.'
        : 'Offline not allowed by policy/env; app should block operations when offline.',
    },
    {
      id: '4.1',
      section: 'Human in the loop',
      title: 'Explicit user acceptance',
      requirement: 'User must review and accept; timestamp recorded.',
      status: 'warn',
      blocking: true,
      details: 'Finalize is explicit; next: record acceptance metadata + immutable revision.',
    },
    {
      id: '5.1',
      section: 'Data Integrity & Auditability',
      title: 'Immutable load records',
      requirement: 'Finalized records immutable; revisions created for edits.',
      status: hasImmutableFinalize ? 'pass' : 'warn',
      blocking: true,
      details: hasImmutableFinalize ? 'Finalized load plans are revisioned.' : 'Pending: implement immutable finalize + revisioning.',
    },
    {
      id: '5.2',
      section: 'Data Integrity & Auditability',
      title: 'Audit log is non-optional',
      requirement: 'Failure to log blocks completion.',
      status: settings.general.auditLogging ? 'warn' : 'fail',
      blocking: true,
      details: settings.general.auditLogging
        ? 'Audit log exists; next: make finalize block if audit log write fails and include user identity when RBAC lands.'
        : 'Audit logging disabled by settings.',
    },
    {
      id: '6.1',
      section: 'Version Control & Change Management',
      title: 'Version labeling',
      requirement: 'Every calculation tagged with software/data/envelope versions.',
      status: settings.compliance.requireVersionLabels ? 'warn' : 'fail',
      blocking: true,
      details: settings.compliance.requireVersionLabels
        ? 'Proof pack includes app version and config/settings hashes; next: envelope version/hash + data model version.'
        : 'Version labels disabled by policy.',
    },
    {
      id: '8.1',
      section: 'Security & Access Control',
      title: 'Role-based access (RBAC)',
      requirement: 'Viewer/planner/admin; restrict admin actions.',
      status: hasRoleBasedAccess ? 'pass' : 'todo',
      blocking: false,
      details: hasRoleBasedAccess ? 'RBAC implemented.' : 'Deferred: implement RBAC roles and enforce admin-only settings.',
    },
  ];

  const pass = countStatus(checks, 'pass');
  const warn = countStatus(checks, 'warn');
  const fail = countStatus(checks, 'fail');
  const todo = countStatus(checks, 'todo');
  const blockingFailures = checks.filter((c) => c.blocking && (c.status === 'fail' || c.status === 'todo')).length;
  const ready = blockingFailures === 0;

  return {
    generatedAtUtc,
    appVersion: env.appVersion,
    offline: {
      online,
      effectiveOfflineAllowed,
      maxCacheAgeHours: settings.compliance.offlinePolicy.maxCacheAgeHours,
      notes,
    },
    summary: {
      pass,
      warn,
      fail,
      todo,
      blockingFailures,
      ready,
    },
    checks,
  };
}


