/**
 * Load Plan Repository
 * 
 * Data access for load plans (loadsheets).
 */

import type { SqlValue } from 'sql.js';
import { query, execute } from '../database';
import { BaseRepository } from './baseRepository';
import type { PhysicsResult, LoadedPosition } from '../../core/types';

/**
 * Load plan record from database
 */
import type { SyncStatus } from '../types';

export interface LoadPlanRecord {
  id: string;
  operator_id: string;
  flight_plan_id: string | null;
  flight_number: string;
  flight_date: string;
  registration: string;
  status: 'draft' | 'final' | 'transmitted' | 'archived';
  fuel_kg: number;
  positions_json: string;
  physics_json: string;
  created_by: string | null;
  finalized_at: string | null;
  transmitted_at: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

/**
 * Load plan with parsed data
 */
export interface LoadPlan extends Omit<LoadPlanRecord, 'positions_json' | 'physics_json'> {
  positions: LoadedPosition[];
  physics: PhysicsResult;
}

/**
 * Create load plan input
 */
export interface CreateLoadPlanInput {
  operatorId: string;
  flightPlanId?: string;
  flightNumber: string;
  flightDate: string;
  registration: string;
  fuelKg: number;
  positions: LoadedPosition[];
  physics: PhysicsResult;
  createdBy?: string;
}

/**
 * Load Plan Repository
 */
export class LoadPlanRepository extends BaseRepository<LoadPlanRecord> {
  protected tableName = 'load_plans';

  /**
   * Create a new load plan
   */
  create(input: CreateLoadPlanInput): LoadPlan {
    const id = this.newId();
    const timestamp = this.timestamp();

    execute(`
      INSERT INTO load_plans (
        id, operator_id, flight_plan_id, flight_number, flight_date, registration,
        status, fuel_kg, positions_json, physics_json, created_by,
        created_at, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      id, input.operatorId, input.flightPlanId ?? null, input.flightNumber,
      input.flightDate, input.registration, input.fuelKg,
      JSON.stringify(input.positions), JSON.stringify(input.physics),
      input.createdBy ?? null, timestamp, timestamp
    ]);

    return {
      id,
      operator_id: input.operatorId,
      flight_plan_id: input.flightPlanId ?? null,
      flight_number: input.flightNumber,
      flight_date: input.flightDate,
      registration: input.registration,
      status: 'draft',
      fuel_kg: input.fuelKg,
      positions: input.positions,
      physics: input.physics,
      created_by: input.createdBy ?? null,
      finalized_at: null,
      transmitted_at: null,
      created_at: timestamp,
      updated_at: timestamp,
      sync_status: 'pending',
    };
  }

  /**
   * Find load plan with parsed data
   */
  findWithData(id: string): LoadPlan | null {
    const record = this.findById(id);
    if (!record) return null;
    
    return {
      ...record,
      positions: JSON.parse(record.positions_json) as LoadedPosition[],
      physics: JSON.parse(record.physics_json) as PhysicsResult,
    };
  }

  /**
   * Find load plans by date
   */
  findByDate(date: string): LoadPlan[] {
    const records = query<LoadPlanRecord>(
      `SELECT * FROM load_plans WHERE flight_date = ? ORDER BY created_at DESC`,
      [date]
    );
    
    return records.map(r => ({
      ...r,
      positions: JSON.parse(r.positions_json) as LoadedPosition[],
      physics: JSON.parse(r.physics_json) as PhysicsResult,
    }));
  }

  /**
   * Find recent load plans
   */
  findRecent(limit: number = 10): LoadPlan[] {
    const records = query<LoadPlanRecord>(
      `SELECT * FROM load_plans ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    
    return records.map(r => ({
      ...r,
      positions: JSON.parse(r.positions_json) as LoadedPosition[],
      physics: JSON.parse(r.physics_json) as PhysicsResult,
    }));
  }

  /**
   * Update load plan data
   */
  update(id: string, data: {
    fuelKg?: number;
    positions?: LoadedPosition[];
    physics?: PhysicsResult;
  }): boolean {
    const current = this.findById(id);
    if (!current) return false;

    const updates: string[] = ['updated_at = ?', "sync_status = 'pending'"];
    const params: SqlValue[] = [this.timestamp()];

    if (data.fuelKg !== undefined) {
      updates.push('fuel_kg = ?');
      params.push(data.fuelKg);
    }
    if (data.positions !== undefined) {
      updates.push('positions_json = ?');
      params.push(JSON.stringify(data.positions));
    }
    if (data.physics !== undefined) {
      updates.push('physics_json = ?');
      params.push(JSON.stringify(data.physics));
    }

    params.push(id);

    const affected = execute(
      `UPDATE load_plans SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return affected > 0;
  }

  /**
   * Finalize a load plan
   */
  finalize(id: string): boolean {
    const timestamp = this.timestamp();
    const affected = execute(
      `UPDATE load_plans SET status = 'final', finalized_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [timestamp, timestamp, id]
    );
    return affected > 0;
  }

  /**
   * Mark as transmitted
   */
  markTransmitted(id: string): boolean {
    const timestamp = this.timestamp();
    const affected = execute(
      `UPDATE load_plans SET status = 'transmitted', transmitted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [timestamp, timestamp, id]
    );
    return affected > 0;
  }
}

/**
 * Singleton instance
 */
export const loadPlanRepository = new LoadPlanRepository();

