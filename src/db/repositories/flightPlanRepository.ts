/**
 * Flight Plan Repository
 * 
 * Data access for flight plans and routes.
 */

import { query, execute } from '../database';
import { BaseRepository } from './baseRepository';
import type { RouteStop } from '../types';

/**
 * Flight plan record from database
 */
import type { SyncStatus } from '../types';

export interface FlightPlanRecord {
  id: string;
  operator_id: string;
  flight_number: string;
  flight_date: string;
  registration: string;
  route_json: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

/**
 * Flight plan with parsed route
 */
export interface FlightPlan extends Omit<FlightPlanRecord, 'route_json'> {
  route: RouteStop[];
}

/**
 * Create flight plan input
 */
export interface CreateFlightPlanInput {
  operatorId: string;
  flightNumber: string;
  flightDate: string;
  registration: string;
  route: RouteStop[];
}

/**
 * Flight Plan Repository
 */
export class FlightPlanRepository extends BaseRepository<FlightPlanRecord> {
  protected tableName = 'flight_plans';

  /**
   * Create a new flight plan
   */
  create(input: CreateFlightPlanInput): FlightPlan {
    const id = this.newId();
    const timestamp = this.timestamp();
    const routeJson = JSON.stringify(input.route);

    execute(`
      INSERT INTO flight_plans (
        id, operator_id, flight_number, flight_date, registration, 
        route_json, status, created_at, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, 'pending')
    `, [
      id, input.operatorId, input.flightNumber, input.flightDate,
      input.registration, routeJson, timestamp, timestamp
    ]);

    return {
      id,
      operator_id: input.operatorId,
      flight_number: input.flightNumber,
      flight_date: input.flightDate,
      registration: input.registration,
      route: input.route,
      status: 'scheduled',
      created_at: timestamp,
      updated_at: timestamp,
      sync_status: 'pending',
    };
  }

  /**
   * Find flight plan with parsed route
   */
  findWithRoute(id: string): FlightPlan | null {
    const record = this.findById(id);
    if (!record) return null;
    
    return {
      ...record,
      route: JSON.parse(record.route_json) as RouteStop[],
    };
  }

  /**
   * Find flight plans by date
   */
  findByDate(date: string): FlightPlan[] {
    const records = query<FlightPlanRecord>(
      `SELECT * FROM flight_plans WHERE flight_date = ? ORDER BY flight_number`,
      [date]
    );
    
    return records.map(r => ({
      ...r,
      route: JSON.parse(r.route_json) as RouteStop[],
    }));
  }

  /**
   * Find flight plans by flight number
   */
  findByFlightNumber(flightNumber: string): FlightPlan[] {
    const records = query<FlightPlanRecord>(
      `SELECT * FROM flight_plans WHERE flight_number = ? ORDER BY flight_date DESC`,
      [flightNumber]
    );
    
    return records.map(r => ({
      ...r,
      route: JSON.parse(r.route_json) as RouteStop[],
    }));
  }

  /**
   * Get all destination codes for a flight (excluding origin)
   */
  getDestinations(flightPlanId: string): string[] {
    const plan = this.findWithRoute(flightPlanId);
    if (!plan) return [];
    
    return plan.route
      .filter(stop => !stop.isOrigin)
      .map(stop => stop.airportCode);
  }

  /**
   * Update flight plan status
   */
  updateStatus(id: string, status: FlightPlanRecord['status']): boolean {
    const affected = execute(
      `UPDATE flight_plans SET status = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [status, this.timestamp(), id]
    );
    return affected > 0;
  }
}

/**
 * Singleton instance
 */
export const flightPlanRepository = new FlightPlanRepository();

