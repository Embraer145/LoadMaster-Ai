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
  onImport: () => void;
  onTestSetup: () => void;
  onOpenSettings?: () => void;
  /** Display a caution badge when aircraft data is sample/simplified */
  isSampleData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  flight,
  onFlightChange,
  onImport,
  onTestSetup,
  onOpenSettings,
  isSampleData,
}) => {
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
  }, [flight]);

  const updateFlight = (updates: Partial<{
    reg: string;
    flightNumber: string;
    origin: string;
    destination: string;
    stopover: string;
    date: string;
  }>) => {
    const newReg = updates.reg ?? reg;
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
    setReg('N404KZ');
    setFlightNumber('KD3402');
    setOrigin('LAX');
    setDestination('HKG');
    setStopover('ANC');
    onTestSetup();
  };
  
  // Get stopovers (exclude origin and destination)
  const availableStopovers = AIRPORTS.filter(a => 
    a.code !== origin && a.code !== destination
  );

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2 sticky top-0 z-50 shadow-xl">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <Plane className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">
              LoadMaster <span className="text-blue-500">Pro</span>
            </h1>
            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              <span>WGA OPS • B747-400F</span>
              {isSampleData && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold tracking-wider">
                  SAMPLE DATA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Flight Selection Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {/* Registration */}
          <div className="flex flex-col px-2">
            <label className="text-[8px] font-bold text-slate-500 uppercase">A/C</label>
            <select 
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-20" 
              value={reg} 
              onChange={e => { setReg(e.target.value); updateFlight({ reg: e.target.value }); }}
            >
              <option value="">--</option>
              {WGA_FLEET.map(a => (
                <option key={a.reg} value={a.reg}>{a.reg}</option>
              ))}
            </select>
          </div>
          
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
              className="bg-transparent text-xs font-bold text-cyan-300 outline-none cursor-pointer w-14" 
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
              className="bg-transparent text-[10px] font-bold text-amber-300 outline-none cursor-pointer w-12" 
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
              className="bg-transparent text-xs font-bold text-violet-300 outline-none cursor-pointer w-14" 
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
            disabled={!reg || !flightNumber || !origin || !destination} 
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-bold shadow-lg"
          >
            <RefreshCw size={12} /> Import
          </button>
          
          {onOpenSettings && (
            <button 
              onClick={onOpenSettings}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700"
              title="Admin Settings"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* Route Display */}
      {flight && (
        <div className="flex items-center justify-center gap-2 mt-2 text-xs">
          <span className="text-slate-400">Route:</span>
          <span className="font-bold text-cyan-300">{flight.origin}</span>
          {flight.stopover && (
            <>
              <ArrowRight size={12} className="text-slate-600" />
              <span className="font-bold text-amber-300">{flight.stopover}</span>
            </>
          )}
          <ArrowRight size={12} className="text-slate-600" />
          <span className="font-bold text-violet-300">{flight.destination}</span>
          <span className="text-slate-600 ml-4">|</span>
          <span className="text-slate-400 ml-2">Cargo for:</span>
          {flight.stopover && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">
              {flight.stopover}
            </span>
          )}
          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[10px] font-bold">
            {flight.destination}
          </span>
        </div>
      )}
    </nav>
  );
};
