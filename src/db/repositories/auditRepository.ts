/**
 * Audit Repository
 * 
 * Data access for audit logging (certification compliance).
 */

import { query, execute, generateId, now } from '../database';

/**
 * Audit log record
 */
export interface AuditRecord {
  id: string;
  timestamp: string;
  operator_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_value: string | null;
  new_value: string | null;
  metadata: string | null;
}

/**
 * Audit action types
 */
export type AuditAction =
  | 'LOAD_PLAN_CREATED'
  | 'LOAD_PLAN_UPDATED'
  | 'LOAD_PLAN_FINALIZED'
  | 'LOAD_PLAN_TRANSMITTED'
  | 'CARGO_LOADED'
  | 'CARGO_UNLOADED'
  | 'CARGO_MOVED'
  | 'FUEL_CHANGED'
  | 'AI_OPTIMIZATION_RUN'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'SYNC_COMPLETED'
  | 'CONFIG_CHANGED';

/**
 * Log audit entry input
 */
export interface AuditInput {
  operatorId?: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Audit Repository
 */
export class AuditRepository {
  /**
   * Log an audit entry
   */
  log(input: AuditInput): void {
    const id = generateId();
    const timestamp = now();

    execute(`
      INSERT INTO audit_log (
        id, timestamp, operator_id, user_id, action, entity_type, entity_id,
        previous_value, new_value, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      timestamp,
      input.operatorId ?? null,
      input.userId ?? null,
      input.action,
      input.entityType,
      input.entityId,
      input.previousValue ? JSON.stringify(input.previousValue) : null,
      input.newValue ? JSON.stringify(input.newValue) : null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]);
  }

  /**
   * Find audit entries by entity
   */
  findByEntity(entityType: string, entityId: string): AuditRecord[] {
    return query<AuditRecord>(
      `SELECT * FROM audit_log WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC`,
      [entityType, entityId]
    );
  }

  /**
   * Find audit entries by action
   */
  findByAction(action: AuditAction): AuditRecord[] {
    return query<AuditRecord>(
      `SELECT * FROM audit_log WHERE action = ? ORDER BY timestamp DESC`,
      [action]
    );
  }

  /**
   * Find audit entries in date range
   */
  findByDateRange(startDate: string, endDate: string): AuditRecord[] {
    return query<AuditRecord>(
      `SELECT * FROM audit_log WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC`,
      [startDate, endDate]
    );
  }

  /**
   * Find recent audit entries
   */
  findRecent(limit: number = 100): AuditRecord[] {
    return query<AuditRecord>(
      `SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
  }

  /**
   * Count audit entries
   */
  count(): number {
    const result = query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_log`);
    return result[0]?.count ?? 0;
  }

  /**
   * Purge old audit entries (respecting retention policy)
   */
  purgeOlderThan(days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const affected = execute(
      `DELETE FROM audit_log WHERE timestamp < ?`,
      [cutoffDate.toISOString()]
    );
    
    return affected;
  }
}

/**
 * Singleton instance
 */
export const auditRepository = new AuditRepository();

/**
 * Helper function to log audit entry
 */
export function logAudit(input: AuditInput): void {
  auditRepository.log(input);
}

