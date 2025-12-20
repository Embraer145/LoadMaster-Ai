/**
 * ModernVisualView
 * 
 * Modern, visually impressive loadsheet with charts, diagrams, and visual indicators.
 * Designed to impress pilots with clear, beautiful data presentation.
 */

import React, { useMemo } from 'react';
import type { AircraftConfig, LoadedPosition, PhysicsResult, FlightInfo } from '@core/types';
import { FlightEnvelope } from '@ui/components/charts/FlightEnvelope';
import { Gauge } from '@ui/components/common/Gauge';
import { AircraftProfile } from '@ui/components/aircraft/AircraftProfile';
import { SimplePlanView } from './SimplePlanView';
import { Plane, Package, Scale, AlertTriangle } from 'lucide-react';

interface ModernVisualViewProps {
  flight: FlightInfo | null;
  aircraftConfig: AircraftConfig;
  positions: LoadedPosition[];
  physics: PhysicsResult;
  blockFuelKg: number;
  taxiFuelKg: number;
  tripBurnKg: number;
  operatorCode?: string;
}

export const ModernVisualView: React.FC<ModernVisualViewProps> = ({
  flight,
  aircraftConfig,
  positions,
  physics,
  blockFuelKg,
  taxiFuelKg,
  tripBurnKg,
  operatorCode: _operatorCode = 'WGA',
}) => {
  // Calculate key metrics
  const takeoffFuelKg = Math.max(0, blockFuelKg - taxiFuelKg);
  const cargoWeight = positions.reduce((sum, p) => sum + (p.content?.weight ?? 0), 0);
  const loadedCount = positions.filter(p => p.content).length;
  const totalPositions = positions.length;
  
  // Calculate utilization percentages
  const towUtilization = (physics.weight / aircraftConfig.limits.MTOW) * 100;
  
  // Calculate CG margin
  const cgMargin = Math.min(
    physics.towCG - physics.forwardLimit,
    physics.aftLimit - physics.towCG
  );
  const cgMarginPercent = (cgMargin / (physics.aftLimit - physics.forwardLimit)) * 100;
  
  // Calculate lateral balance
  let leftWeight = 0;
  let rightWeight = 0;
  positions.filter(p => p.deck === 'MAIN').forEach(p => {
    const weight = p.content?.weight ?? 0;
    if (p.id === 'A1' || p.id.endsWith('L')) leftWeight += weight;
    else if (p.id === 'A2' || p.id.endsWith('R')) rightWeight += weight;
  });
  const totalLateral = leftWeight + rightWeight;
  const lateralBalancePercent = totalLateral > 0 
    ? ((leftWeight / totalLateral) * 100)
    : 50;

  const route = flight
    ? `${flight.origin} → ${flight.stopover ? `${flight.stopover} → ` : ''}${flight.destination}`
    : '—';

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 print:bg-white p-6 space-y-6 modern-loadsheet">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard
          icon={<Plane size={20} className="text-blue-500" />}
          label="Flight"
          value={flight?.flightNumber ?? '—'}
          subtitle={route}
        />
        <InfoCard
          icon={<Package size={20} className="text-emerald-500" />}
          label="Cargo"
          value={`${Math.round(cargoWeight / 1000)} t`}
          subtitle={`${loadedCount}/${totalPositions} positions`}
        />
        <InfoCard
          icon={<Scale size={20} className="text-amber-500" />}
          label="TOW"
          value={`${Math.round(physics.weight / 1000)} t`}
          subtitle={`${towUtilization.toFixed(0)}% of MTOW`}
        />
        <InfoCard
          icon={<AlertTriangle size={20} className={cgMargin < 2 ? 'text-red-500' : 'text-emerald-500'} />}
          label="CG Margin"
          value={`${cgMargin.toFixed(1)}%`}
          subtitle={cgMargin < 2 ? 'Tight margin' : 'Good margin'}
        />
      </div>

      {/* Flight Envelope Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:border print:border-slate-300">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Flight Envelope</h3>
        <div className="bg-slate-50 rounded-xl p-4">
          <FlightEnvelope
            embedded
            currentWeight={physics.weight}
            currentCG={physics.towCG}
            zfw={physics.zfw}
            zfwCG={physics.zfwCG}
            lw={physics.lw}
            lwCG={physics.lwCG}
            fwdLimit={physics.forwardLimit}
            aftLimit={physics.aftLimit}
            fuel={takeoffFuelKg}
          />
        </div>
      </div>

      {/* Weight Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeightProgressCard
          label="Zero Fuel Weight"
          current={physics.zfw}
          maximum={aircraftConfig.limits.MZFW}
          unit="kg"
          color="blue"
        />
        <WeightProgressCard
          label="Takeoff Weight"
          current={physics.weight}
          maximum={aircraftConfig.limits.MTOW}
          unit="kg"
          color="emerald"
        />
        <WeightProgressCard
          label="Landing Weight"
          current={physics.lw}
          maximum={aircraftConfig.limits.MLW}
          unit="kg"
          color="amber"
        />
      </div>

      {/* CG and Balance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CG Margin Gauge */}
        <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:border print:border-slate-300">
          <h3 className="text-lg font-bold text-slate-900 mb-4">CG Position</h3>
          <div className="flex items-center justify-center">
            <Gauge
              label="CG MARGIN"
              value={physics.towCG.toFixed(1)}
              unit="% MAC"
              max={aircraftConfig.limits.aftCGLimit}
              danger={cgMargin < 2}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-slate-600">Forward Limit</div>
              <div className="font-bold text-slate-900">{physics.forwardLimit.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-slate-600">Aft Limit</div>
              <div className="font-bold text-slate-900">{physics.aftLimit.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Lateral Balance Indicator */}
        <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:border print:border-slate-300">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Lateral Balance</h3>
          <div className="space-y-4">
            <div className="relative">
              <div className="h-12 bg-slate-200 rounded-lg overflow-hidden flex">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-sm font-bold transition-all"
                  style={{ width: `${lateralBalancePercent}%` }}
                >
                  {lateralBalancePercent > 15 && `L: ${Math.round(leftWeight)} kg`}
                </div>
                <div
                  className="bg-emerald-500 flex items-center justify-center text-white text-sm font-bold transition-all"
                  style={{ width: `${100 - lateralBalancePercent}%` }}
                >
                  {(100 - lateralBalancePercent) > 15 && `R: ${Math.round(rightWeight)} kg`}
                </div>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-12 w-px bg-slate-900"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-center">
              <div>
                <div className="text-slate-600">Left</div>
                <div className="font-bold text-slate-900">{Math.round(leftWeight)} kg</div>
              </div>
              <div>
                <div className="text-slate-600">Imbalance</div>
                <div className={`font-bold ${physics.lateralImbalanceKg > 1000 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {Math.round(physics.lateralImbalanceKg)} kg
                </div>
              </div>
              <div>
                <div className="text-slate-600">Right</div>
                <div className="font-bold text-slate-900">{Math.round(rightWeight)} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cargo Distribution Visualization */}
      <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:border print:border-slate-300">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Cargo Distribution</h3>
        
        {/* Plan View (Top-Down) */}
        <div className="mb-6">
          <SimplePlanView
            aircraftConfig={aircraftConfig}
            positions={positions}
            widthPx={900}
          />
        </div>

        {/* Profile View (Side) */}
        <CargoDistributionDiagram 
          aircraftConfig={aircraftConfig}
          positions={positions} 
        />
      </div>

      {/* Fuel Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:border print:border-slate-300">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Fuel Planning</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FuelStat label="Block Fuel" value={blockFuelKg} />
          <FuelStat label="Taxi Fuel" value={taxiFuelKg} />
          <FuelStat label="Takeoff Fuel" value={takeoffFuelKg} />
          <FuelStat label="Trip Burn" value={tripBurnKg} />
        </div>
      </div>

      {/* Quick Reference Table */}
      <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:border print:border-slate-300">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Weight Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-bold text-slate-700">Phase</th>
                <th className="px-4 py-2 text-right font-bold text-slate-700">Weight</th>
                <th className="px-4 py-2 text-right font-bold text-slate-700">CG (%MAC)</th>
                <th className="px-4 py-2 text-right font-bold text-slate-700">Limit</th>
                <th className="px-4 py-2 text-center font-bold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-4 py-2 font-medium">Zero Fuel</td>
                <td className="px-4 py-2 text-right font-mono">{Math.round(physics.zfw).toLocaleString()} kg</td>
                <td className="px-4 py-2 text-right font-mono">{physics.zfwCG.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right font-mono">{Math.round(aircraftConfig.limits.MZFW).toLocaleString()} kg</td>
                <td className="px-4 py-2 text-center">
                  <StatusBadge ok={physics.zfw <= aircraftConfig.limits.MZFW} />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Takeoff</td>
                <td className="px-4 py-2 text-right font-mono">{Math.round(physics.weight).toLocaleString()} kg</td>
                <td className="px-4 py-2 text-right font-mono">{physics.towCG.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right font-mono">{Math.round(aircraftConfig.limits.MTOW).toLocaleString()} kg</td>
                <td className="px-4 py-2 text-center">
                  <StatusBadge ok={physics.weight <= aircraftConfig.limits.MTOW && !physics.isUnbalanced} />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Landing</td>
                <td className="px-4 py-2 text-right font-mono">{Math.round(physics.lw).toLocaleString()} kg</td>
                <td className="px-4 py-2 text-right font-mono">{physics.lwCG.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right font-mono">{Math.round(aircraftConfig.limits.MLW).toLocaleString()} kg</td>
                <td className="px-4 py-2 text-center">
                  <StatusBadge ok={physics.lw <= aircraftConfig.limits.MLW} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper Components

function InfoCard({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 print:shadow-none print:border print:border-slate-300">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-600 font-medium uppercase tracking-wider">{label}</div>
          <div className="text-xl font-bold text-slate-900 truncate">{value}</div>
          <div className="text-xs text-slate-600 truncate">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function WeightProgressCard({
  label,
  current,
  maximum,
  unit,
  color,
}: {
  label: string;
  current: number;
  maximum: number;
  unit: string;
  color: 'blue' | 'emerald' | 'amber';
}) {
  const percentage = (current / maximum) * 100;
  const colorClasses = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 print:shadow-none print:border print:border-slate-300">
      <div className="text-sm font-medium text-slate-700 mb-2">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mb-1">
        {Math.round(current).toLocaleString()} {unit}
      </div>
      <div className="text-xs text-slate-600 mb-3">
        Max: {Math.round(maximum).toLocaleString()} {unit}
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        ></div>
      </div>
      <div className="text-xs text-slate-600 mt-1 text-right">{percentage.toFixed(0)}%</div>
    </div>
  );
}

function FuelStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-900">{Math.round(value).toLocaleString()} kg</div>
      <div className="text-xs text-slate-500">{(value / 1000).toFixed(1)} t</div>
    </div>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {ok ? '✓ OK' : '✗ LIMIT'}
    </span>
  );
}

function CargoDistributionDiagram({ 
  aircraftConfig: _aircraftConfig, 
  positions 
}: { 
  aircraftConfig: AircraftConfig;
  positions: LoadedPosition[];
}) {
  // Calculate ruler range from all positions
  const rulerRange = useMemo(() => {
    const arms = positions.map(p => p.arm).filter(a => typeof a === 'number' && Number.isFinite(a));
    const min = arms.length ? Math.min(...arms) : 0;
    const max = arms.length ? Math.max(...arms) : min + 1;
    return { minIn: min, maxIn: max === min ? min + 1 : max };
  }, [positions]);

  return (
    <div className="space-y-6">
      {/* Profile View */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <AircraftProfile
          widthPx={900}
          rulerRange={rulerRange}
          rulerStations={[]}
          positions={positions}
          selection={{ id: null, source: null }}
          onSelectPosition={() => {}} // No-op in print view
        />
      </div>

      {/* Position Summary Table */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-bold text-slate-700 mb-2">Main Deck Summary</div>
          <div className="text-xs text-slate-600">
            {positions.filter(p => p.deck === 'MAIN' && p.content).length} of {positions.filter(p => p.deck === 'MAIN').length} positions loaded
          </div>
          <div className="text-xs font-bold text-slate-900 mt-1">
            {Math.round(positions.filter(p => p.deck === 'MAIN' && p.content).reduce((sum, p) => sum + (p.content?.weight ?? 0), 0) / 1000)} t total
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-700 mb-2">Lower Deck Summary</div>
          <div className="text-xs text-slate-600">
            {positions.filter(p => p.deck === 'LOWER' && p.content).length} of {positions.filter(p => p.deck === 'LOWER').length} positions loaded
          </div>
          <div className="text-xs font-bold text-slate-900 mt-1">
            {Math.round(positions.filter(p => p.deck === 'LOWER' && p.content).reduce((sum, p) => sum + (p.content?.weight ?? 0), 0) / 1000)} t total
          </div>
        </div>
      </div>
    </div>
  );
}

