/**
 * Base Repository
 * 
 * Common CRUD operations for all entities.
 */

import { query, queryOne, execute, generateId, now } from '../database';
import type { SyncStatus } from '../types';

/**
 * Base entity shape for repository operations
 */
export interface RepositoryEntity {
  id: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

/**
 * Base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends RepositoryEntity> {
  protected abstract tableName: string;

  /**
   * Find all records
   */
  findAll(): T[] {
    return query<T>(`SELECT * FROM ${this.tableName}`);
  }

  /**
   * Find by ID
   */
  findById(id: string): T | null {
    return queryOne<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  /**
   * Find by operator
   */
  findByOperator(operatorId: string): T[] {
    return query<T>(`SELECT * FROM ${this.tableName} WHERE operator_id = ?`, [operatorId]);
  }

  /**
   * Delete by ID
   */
  delete(id: string): boolean {
    const affected = execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return affected > 0;
  }

  /**
   * Count all records
   */
  count(): number {
    const result = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    return result?.count ?? 0;
  }

  /**
   * Find records pending sync
   */
  findPendingSync(): T[] {
    return query<T>(`SELECT * FROM ${this.tableName} WHERE sync_status = 'pending'`);
  }

  /**
   * Mark record as synced
   */
  markSynced(id: string): boolean {
    const affected = execute(
      `UPDATE ${this.tableName} SET sync_status = 'synced', updated_at = ? WHERE id = ?`,
      [now(), id]
    );
    return affected > 0;
  }

  /**
   * Generate new ID
   */
  protected newId(): string {
    return generateId();
  }

  /**
   * Get current timestamp
   */
  protected timestamp(): string {
    return now();
  }
}

