/**
 * Header Component
 * 
 * Main navigation header with complete flight route selection:
 * - Aircraft registration
 * - Flight number
 * - Origin airport
 * - Destination airport
 * - Stopover (optional)
 * - Date
 */

import React, { useState, useEffect } from 'react';
import { Plane, RefreshCw, Calendar as CalendarIcon, Settings, ArrowRight } from 'lucide-react';
import { WGA_FLEET, WGA_FLIGHT_NUMBERS } from '@data/operators';
import type { FlightInfo } from '@core/types';
import avatarUrl from '../../assets/avatar-loadmaster.svg';

// Common cargo airports for selection
const AIRPORTS = [
  { code: 'LAX', city: 'Los Angeles', flag: '🇺🇸' },
  { code: 'SFO', city: 'San Francisco', flag: '🇺🇸' },
  { code: 'ORD', city: 'Chicago', flag: '🇺🇸' },
  { code: 'JFK', city: 'New York', flag: '🇺🇸' },
  { code: 'MIA', city: 'Miami', flag: '🇺🇸' },
  { code: 'ANC', city: 'Anchorage', flag: '🇺🇸' },
  { code: 'CVG', city: 'Cincinnati', flag: '🇺🇸' },
  { code: 'MEM', city: 'Memphis', flag: '🇺🇸' },
  { code: 'FRA', city: 'Frankfurt', flag: '🇩🇪' },
  { code: 'LHR', city: 'London', flag: '🇬🇧' },
  { code: 'CDG', city: 'Paris', flag: '🇫🇷' },
  { code: 'AMS', city: 'Amsterdam', flag: '🇳🇱' },
  { code: 'LEJ', city: 'Leipzig', flag: '🇩🇪' },
  { code: 'HKG', city: 'Hong Kong', flag: '🇭🇰' },
  { code: 'PVG', city: 'Shanghai', flag: '🇨🇳' },
  { code: 'ICN', city: 'Seoul', flag: '🇰🇷' },
  { code: 'NRT', city: 'Tokyo Narita', flag: '🇯🇵' },
  { code: 'SIN', city: 'Singapore', flag: '🇸🇬' },
  { code: 'DXB', city: 'Dubai', flag: '🇦🇪' },
  { code: 'DOH', city: 'Doha', flag: '🇶🇦' },
  { code: 'SYD', city: 'Sydney', flag: '🇦🇺' },
];

interface HeaderProps {
  flight: FlightInfo | null;
  onFlightChange: (flight: FlightInfo | null) => void;
  /** Inform the app of aircraft selection even if the flight isn’t fully specified yet. */
  onRegistrationSelect?: (registration: string) => void;
  /** Inform the app of the aircraft type selection (lets the app swap templates/configs immediately). */
  onAircraftTypeSelect?: (aircraftType: string) => void;
  onImport: () => void;
  onTestSetup: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onGoHome?: () => void;
  userLabel?: string;
  /** Display a caution badge when aircraft data is sample/simplified */
  isSampleData?: boolean;
  /** Shows whether the local sql.js DB is initialized (helps diagnose multi-tab differences). */
  dbReady?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  flight,
  onFlightChange,
  onRegistrationSelect,
  onAircraftTypeSelect,
  onImport,
  onTestSetup,
  onOpenSettings,
  onOpenProfile,
  onGoHome,
  userLabel,
  isSampleData,
  dbReady,
}) => {
  const [fleet, setFleet] = useState<'B747' | 'MD11'>('B747');
  const [mode, setMode] = useState<'real' | 'demo'>('real');
  const [demoProfile, setDemoProfile] = useState<'KOREAN' | 'ATLAS' | 'UPS'>('UPS');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reg, setReg] = useState(flight?.registration ?? '');
  const [flightNumber, setFlightNumber] = useState(flight?.flightNumber ?? '');
  const [origin, setOrigin] = useState(flight?.origin ?? '');
  const [destination, setDestination] = useState(flight?.destination ?? '');
  const [stopover, setStopover] = useState(flight?.stopover ?? '');

  // Sync local state when flight prop changes (e.g., from Test Data button)
  useEffect(() => {
    setReg(flight?.registration ?? '');
    setFlightNumber(flight?.flightNumber ?? '');
    setOrigin(flight?.origin ?? '');
    setDestination(flight?.destination ?? '');
    setStopover(flight?.stopover ?? '');
    if (flight?.date) setDate(flight.date);

    // Infer fleet from registration (so external changes like Test Data keep the UI consistent)
    if (flight?.registration) {
      const match = WGA_FLEET.find(a => a.reg === flight.registration);
      setFleet(match?.fleet ?? 'B747');
    }
  }, [flight]);

  const demoProfiles: Array<{ id: 'KOREAN' | 'ATLAS' | 'UPS'; label: string; aircraftType: string; syntheticReg: string }> = [
    { id: 'KOREAN', label: 'Korean • Alphabetic', aircraftType: 'B747-400F', syntheticReg: 'DEMO_KOREAN' },
    { id: 'ATLAS', label: 'Atlas • Numeric', aircraftType: 'B747-400F-NUMERIC', syntheticReg: 'DEMO_ATLAS' },
    { id: 'UPS', label: 'UPS • UPS', aircraftType: 'B747-400F-UPS', syntheticReg: 'DEMO_UPS' },
  ];

  const activeDemo = demoProfiles.find((p) => p.id === demoProfile) ?? demoProfiles[0]!;

  const updateFlight = (updates: Partial<{
    reg: string;
    flightNumber: string;
    origin: string;
    destination: string;
    stopover: string;
    date: string;
  }>) => {
    const newReg = mode === 'demo' ? activeDemo.syntheticReg : (updates.reg ?? reg);
    const newFlight = updates.flightNumber ?? flightNumber;
    const newOrigin = updates.origin ?? origin;
    const newDest = updates.destination ?? destination;
    const newStopover = updates.stopover ?? stopover;
    const newDate = updates.date ?? date;
    
    if (newReg && newFlight && newOrigin && newDest) {
      onFlightChange({
        registration: newReg,
        flightNumber: newFlight,
        origin: newOrigin,
        destination: newDest,
        stopover: newStopover === 'NONE' || newStopover === '' ? null : newStopover,
        date: newDate,
      });
    } else if (!newReg || !newFlight) {
      onFlightChange(null);
    }
  };

  const handleTestSetup = () => {
    setFleet('B747');
    setMode('real');
    setReg('N344KD');
    setFlightNumber('KD3402');
    setOrigin('LAX');
    setDestination('HKG');
    setStopover('ANC');
    onTestSetup();
  };

  const fleetRegs = WGA_FLEET.filter(a => a.fleet === fleet);
  const isFleetSupported = fleet === 'B747'; // MD-11 UI present; modeling/data integration comes next.
  
  // Get stopovers (exclude origin and destination)
  const availableStopovers = AIRPORTS.filter(a => 
    a.code !== origin && a.code !== destination
  );

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2 sticky top-0 z-50 shadow-xl">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <button
          type="button"
          onClick={onGoHome}
          disabled={!onGoHome}
          className={`flex items-center gap-3 text-left ${
            onGoHome ? 'cursor-pointer' : 'cursor-default'
          }`}
          title={onGoHome ? 'Home / How-To' : undefined}
        >
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <Plane className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">
              LoadMaster <span className="text-blue-500">Pro</span>
            </h1>
            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              <span>WGA OPS • {fleet === 'B747' ? '747' : 'MD-11'} FLEET</span>
              {!isFleetSupported && (
                <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700 font-bold tracking-wider">
                  COMING SOON
                </span>
              )}
              {isSampleData && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold tracking-wider">
                  SAMPLE DATA
                </span>
              )}
              {dbReady === false && (
                <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/25 font-bold tracking-wider">
                  DB NOT READY
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Flight Selection Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {/* Mode (Real vs Demo) */}
          <div className="flex flex-col px-2">
            <label className="text-[8px] font-bold text-slate-500 uppercase">Mode</label>
            <select
              className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer w-16"
              value={mode}
              onChange={(e) => {
                const next = e.target.value as 'real' | 'demo';
                setMode(next);
                if (next === 'demo') {
                  // Apply demo selection immediately (swap aircraft type + synthetic registration).
                  onAircraftTypeSelect?.(activeDemo.aircraftType);
                  onRegistrationSelect?.(activeDemo.syntheticReg);
                  // Avoid accidental old tail staying in the UI.
                  setReg('');
                  updateFlight({ reg: '' });
                } else {
                  // Back to real mode: clear synthetic reg from the flight until a tail is chosen.
                  setReg('');
                  onRegistrationSelect?.('');
                  updateFlight({ reg: '' });
                }
              }}
              title="Real ops vs demo (no tail selection)"
            >
              <option value="real">Real</option>
              <option value="demo">Demo</option>
            </select>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          {/* Fleet */}
          <div className="flex flex-col px-2">
            <label className="text-[8px] font-bold text-slate-500 uppercase">Fleet</label>
            <select
              className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer w-16"
              value={fleet}
              onChange={e => {
                const nextFleet = e.target.value as 'B747' | 'MD11';
                setFleet(nextFleet);
                // Reset registration when fleet changes (prevents mixing an MD-11 tail with 747 diagram)
                setReg('');
                updateFlight({ reg: '' });
              }}
              disabled={mode === 'demo'}
            >
              <option value="B747">747</option>
              <option value="MD11">MD-11</option>
            </select>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          {/* Registration (Real) OR Demo Profile (Demo) */}
          {mode === 'demo' ? (
            <div className="flex flex-col px-2">
              <label className="text-[8px] font-bold text-slate-500 uppercase">Demo</label>
              <select
                className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer w-28"
                value={demoProfile}
                onChange={(e) => {
                  const next = e.target.value as typeof demoProfile;
                  setDemoProfile(next);
                  const d = demoProfiles.find((p) => p.id === next) ?? demoProfiles[0]!;
                  onAircraftTypeSelect?.(d.aircraftType);
                  onRegistrationSelect?.(d.syntheticReg);
                  updateFlight({ reg: '' });
                }}
                title="Demo profile (no tail number)"
              >
                {demoProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col px-2">
              <label className="text-[8px] font-bold text-slate-500 uppercase">A/C</label>
              <select 
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-20" 
                value={reg} 
                onChange={e => { 
                  const next = e.target.value;
                  setReg(next);
                  onRegistrationSelect?.(next);
                  const match = WGA_FLEET.find((a) => a.reg === next);
                  if (match?.type) onAircraftTypeSelect?.(match.type);
                  updateFlight({ reg: next }); 
                }}
              >
                <option value="">--</option>
                {fleetRegs.map(a => (
                  <option key={a.reg} value={a.reg}>{a.reg}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="w-px h-8 bg-slate-800" />
          
          {/* Flight Number */}
          <div className="flex flex-col px-2">
            <label className="text-[8px] font-bold text-slate-500 uppercase">FLT</label>
            <select 
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-16" 
              value={flightNumber} 
              onChange={e => { setFlightNumber(e.target.value); updateFlight({ flightNumber: e.target.value }); }}
            >
              <option value="">--</option>
              {WGA_FLIGHT_NUMBERS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          
          <div className="w-px h-8 bg-slate-800" />
          
          {/* Origin */}
          <div className="flex flex-col px-2">
            <label className="text-[8px] font-bold text-slate-500 uppercase">From</label>
            <select 
              className="bg-transparent text-xs font-bold text-cyan-300 outline-none cursor-pointer w-16" 
              value={origin} 
              onChange={e => { setOrigin(e.target.value); updateFlight({ origin: e.target.value }); }}
            >
              <option value="">--</option>
              {AIRPORTS.filter(a => a.code !== destination).map(a => (
                <option key={a.code} value={a.code}>{a.flag} {a.code}</option>
              ))}
            </select>
          </div>
          
          {/* Stopover */}
          <div className="flex flex-col px-1">
            <label className="text-[8px] font-bold text-slate-500 uppercase">Via</label>
            <select 
              className="bg-transparent text-[10px] font-bold text-amber-300 outline-none cursor-pointer w-14" 
              value={stopover} 
              onChange={e => { setStopover(e.target.value); updateFlight({ stopover: e.target.value }); }}
            >
              <option value="">--</option>
              {availableStopovers.map(a => (
                <option key={a.code} value={a.code}>{a.code}</option>
              ))}
            </select>
          </div>
          
          <ArrowRight size={14} className="text-slate-600 mx-1" />
          
          {/* Destination */}
          <div className="flex flex-col px-2">
            <label className="text-[8px] font-bold text-slate-500 uppercase">To</label>
            <select 
              className="bg-transparent text-xs font-bold text-violet-300 outline-none cursor-pointer w-16" 
              value={destination} 
              onChange={e => { setDestination(e.target.value); updateFlight({ destination: e.target.value }); }}
            >
              <option value="">--</option>
              {AIRPORTS.filter(a => a.code !== origin).map(a => (
                <option key={a.code} value={a.code}>{a.flag} {a.code}</option>
              ))}
            </select>
          </div>
          
          <div className="w-px h-8 bg-slate-800" />
          
          {/* Date */}
          <div className="flex flex-col px-2">
            <label className="text-[8px] font-bold text-slate-500 flex items-center gap-1 uppercase">
              <CalendarIcon size={8} /> Date
            </label>
            <input 
              type="date" 
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-28" 
              value={date} 
              onChange={e => { setDate(e.target.value); updateFlight({ date: e.target.value }); }}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Cargo for (moved up beside date; saves vertical space) */}
          {flight && (
            <>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col px-2">
                <label className="text-[8px] font-bold text-slate-500 uppercase">Cargo for</label>
                <div className="flex items-center gap-1.5">
                  {flight.stopover && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold whitespace-nowrap">
                      {flight.stopover}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[10px] font-bold whitespace-nowrap">
                    {flight.destination}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleTestSetup} 
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-700"
          >
            Test Data
          </button>
          
          <button 
            onClick={onImport} 
            disabled={!isFleetSupported || !reg || !flightNumber || !origin || !destination} 
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-bold shadow-lg"
          >
            <RefreshCw size={12} /> Import
          </button>
          
          {onOpenSettings && (
            <div className="flex items-center gap-2">
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700"
                  title={`Profile${userLabel ? ` (${userLabel})` : ''}`}
                >
                  <img
                    src={avatarUrl}
                    alt="User profile"
                    className="w-6 h-6 rounded-full border border-slate-700 bg-slate-950/40"
                    draggable={false}
                  />
                </button>
              )}
              <button 
                onClick={onOpenSettings}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700"
                title="Admin Settings"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Route Display removed (redundant with dropdowns; saves vertical space) */}
    </nav>
  );
};
