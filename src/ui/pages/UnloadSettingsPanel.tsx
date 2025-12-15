/**
 * Enhanced Unload Settings Panel
 * 
 * Provides comprehensive configuration for unload efficiency optimization
 * with editable guidance and zone configuration.
 */

import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import type { UnloadSettings, UnloadStrategy } from '@core/settings/types';

interface UnloadSettingsPanelProps {
  settings: UnloadSettings;
  onUpdate: (updates: Partial<UnloadSettings>) => void;
  onReset: () => void;
}

// B747-400F position zones
const POSITION_ZONES = {
  NOSE: ['A1', 'A2', 'B1'],
  SIDE_DOOR: ['GL', 'GR', 'HL', 'HR', 'JL', 'JR', 'KL', 'KR'],
  AFT: ['LL', 'LR', 'ML', 'MR', 'PL', 'PR', 'QL', 'QR'],
  TAIL: ['RL', 'RR', 'SL', 'SR', 'T'],
  LOWER_FWD: ['11P', '12P', '21P', '22P', '23P'],
  LOWER_AFT: ['31P', '32P', '41P', '42P'],
};

// Strategy guidance
const STRATEGY_GUIDANCE: Record<UnloadStrategy, { title: string; description: string; howItWorks: string[] }> = {
  lifo: {
    title: 'LIFO (Last In, First Out)',
    description: 'Cargo loaded last will be unloaded first. Ensures first-stop cargo is most accessible.',
    howItWorks: [
      'Sort cargo by offload sequence (reverse order)',
      'Load final-destination cargo FIRST (goes to aft positions)',
      'Load first-stop cargo LAST (stays near doors)',
      'At each stop, first-off cargo is immediately accessible',
    ],
  },
  accessibility: {
    title: 'Door Accessibility',
    description: 'Prioritize placing cargo near cargo doors. Fastest overall unloading.',
    howItWorks: [
      'Score positions by distance from nearest cargo door',
      'Fill door-adjacent positions first',
      'Use main deck side door (G-K) as primary access',
      'Nose door for oversized/drive-on cargo',
    ],
  },
  destination_group: {
    title: 'Destination Grouping',
    description: 'Group cargo by destination in contiguous zones. Reduces search time.',
    howItWorks: [
      'Identify all unique destinations in manifest',
      'Assign each destination a zone on the aircraft',
      'First-stop destinations get door-adjacent zones',
      'Keep same-destination cargo together',
    ],
  },
  balanced: {
    title: 'Balanced (CG + Unload)',
    description: 'Balance CG optimization with unload efficiency.',
    howItWorks: [
      'Calculate optimal position for CG',
      'Within CG-acceptable positions, prefer door-adjacent',
      'Allow slight CG deviation for better unload',
      'Target CG margin of at least 2% from limits',
    ],
  },
};

export const EnhancedUnloadSettingsPanel: React.FC<UnloadSettingsPanelProps> = ({
  settings,
  onUpdate,
  onReset,
}) => {
  const handleZoneToggle = (zone: string, type: 'firstOff' | 'lastOff') => {
    const key = type === 'firstOff' ? 'firstOffZones' : 'lastOffZones';
    const zones = settings[key];
    const newZones = zones.includes(zone)
      ? zones.filter(z => z !== zone)
      : [...zones, zone];
    onUpdate({ [key]: newZones });
  };

  const currentGuidance = STRATEGY_GUIDANCE[settings.strategy];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Unload Efficiency</h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure how cargo is loaded for optimal unloading at each stop
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
        <div>
          <div className="text-sm font-medium text-white">Enable Unload Optimization</div>
          <div className="text-[10px] text-slate-500">Consider unloading order when loading</div>
        </div>
        <button
          onClick={() => onUpdate({ enabled: !settings.enabled })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Strategy Selection */}
      <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
        <div>
          <div className="text-sm font-medium text-white">Unload Strategy</div>
          <div className="text-[10px] text-slate-500">How to prioritize unload order</div>
        </div>
        <select
          value={settings.strategy}
          onChange={(e) => onUpdate({ strategy: e.target.value as UnloadStrategy })}
          className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
        >
          <option value="destination_group">Group by Destination</option>
          <option value="accessibility">Accessibility (near doors)</option>
          <option value="lifo">LIFO (Last In, First Out)</option>
          <option value="balanced">Balanced (CG + Unload)</option>
        </select>
      </div>

      {/* Strategy Guidance Panel */}
      <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
        <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
          <Clock size={14} /> Current Strategy: {currentGuidance.title}
        </h3>
        <p className="text-xs text-slate-400 mb-3">{currentGuidance.description}</p>
        <div className="text-xs font-bold text-slate-500 uppercase mb-2">How it works:</div>
        <ul className="space-y-1">
          {currentGuidance.howItWorks.map((step, i) => (
            <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              {step}
            </li>
          ))}
        </ul>
      </div>

      {/* Group by Destination */}
      <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
        <div>
          <div className="text-sm font-medium text-white">Group by Destination</div>
          <div className="text-[10px] text-slate-500">Keep cargo for same destination together</div>
        </div>
        <button
          onClick={() => onUpdate({ groupByDestination: !settings.groupByDestination })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.groupByDestination ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              settings.groupByDestination ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* First-Off Zones */}
      <div className="p-4 bg-slate-800/50 rounded-lg">
        <h3 className="text-sm font-bold text-emerald-400 mb-2">
          First-Off Zones (Door Adjacent)
        </h3>
        <p className="text-[10px] text-slate-500 mb-3">
          Click to toggle. First-stop cargo will be placed here.
        </p>

        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-slate-500">Main Deck Side Door (G-K):</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {POSITION_ZONES.SIDE_DOOR.map((zone) => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone, 'firstOff')}
                  className={`px-2 py-1 rounded text-[10px] font-mono ${
                    settings.firstOffZones.includes(zone)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Nose Section:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {POSITION_ZONES.NOSE.map((zone) => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone, 'firstOff')}
                  className={`px-2 py-1 rounded text-[10px] font-mono ${
                    settings.firstOffZones.includes(zone)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Lower Deck FWD:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {POSITION_ZONES.LOWER_FWD.map((zone) => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone, 'firstOff')}
                  className={`px-2 py-1 rounded text-[10px] font-mono ${
                    settings.firstOffZones.includes(zone)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Last-Off Zones */}
      <div className="p-4 bg-slate-800/50 rounded-lg">
        <h3 className="text-sm font-bold text-amber-400 mb-2">
          Last-Off Zones (Deep/Aft)
        </h3>
        <p className="text-[10px] text-slate-500 mb-3">
          Click to toggle. Final-destination cargo will be placed here.
        </p>

        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-slate-500">Tail Section:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {POSITION_ZONES.TAIL.map((zone) => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone, 'lastOff')}
                  className={`px-2 py-1 rounded text-[10px] font-mono ${
                    settings.lastOffZones.includes(zone)
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Aft Section:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {POSITION_ZONES.AFT.map((zone) => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone, 'lastOff')}
                  className={`px-2 py-1 rounded text-[10px] font-mono ${
                    settings.lastOffZones.includes(zone)
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Lower Deck AFT:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {POSITION_ZONES.LOWER_AFT.map((zone) => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone, 'lastOff')}
                  className={`px-2 py-1 rounded text-[10px] font-mono ${
                    settings.lastOffZones.includes(zone)
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Industry References */}
      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
        <h3 className="text-sm font-bold text-slate-400 mb-2">Industry References</h3>
        <ul className="text-[10px] text-slate-500 space-y-1">
          <li>• IATA Ground Operations Manual (IGOM) - Section 8.2.4</li>
          <li>• Boeing 747-400F Flight Crew Operations Manual - Chapter 10</li>
          <li>• B747F Door Locations: Nose (STA 220), Side (STA 1145), Lower FWD/AFT</li>
          <li>• Turnaround target: 90 min for freight hubs</li>
        </ul>
      </div>
    </div>
  );
};

