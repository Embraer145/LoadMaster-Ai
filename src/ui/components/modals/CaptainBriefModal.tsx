/**
 * CaptainBriefModal
 *
 * Print-to-PDF, captain-facing weight & balance brief.
 * Goal: professional, readable on iPad, and print-friendly.
 */

import React, { useState } from 'react';
import { FileText, Printer, X } from 'lucide-react';
import type { FlightInfo, PhysicsResult } from '@core/types';
import { FlightEnvelope } from '@ui/components/charts/FlightEnvelope';

interface CaptainBriefModalProps {
  flight: FlightInfo | null;
  physics: PhysicsResult;
  takeoffFuelKg: number;
  taxiFuelKg: number;
  tripBurnKg: number;
  onClose: () => void;
}

export const CaptainBriefModal: React.FC<CaptainBriefModalProps> = ({
  flight,
  physics,
  takeoffFuelKg,
  taxiFuelKg,
  tripBurnKg,
  onClose,
}) => {
  // Optional captain-entered notes (local only, print-ready)
  const [captainNotes, setCaptainNotes] = useState('');

  const handlePrint = () => window.print();

  const route =
    flight ? `${flight.origin} → ${flight.stopover ? `${flight.stopover} → ` : ''}${flight.destination}` : '—';

  // FMC-facing values (keep explicit and easy to read)
  const zfwKg = physics.zfw;
  const towKg = physics.weight;
  const lwKg = physics.lw;
  const zfwCg = physics.zfwCG;
  const towCg = physics.towCG;
  const lwCg = physics.lwCG;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="relative w-full max-w-[980px] max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-slate-300 print:rounded-none print:bg-white print:max-h-none">
        {/* Top controls (sticky, hidden in print) */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-400" size={18} />
            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">Captain W&B Brief</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700 flex items-center gap-2"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-white" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="p-6 print:p-8 text-slate-200 print:text-slate-900 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-2xl font-black tracking-tight text-white print:text-slate-900">
                WEIGHT & BALANCE BRIEF
              </div>
              <div className="text-[11px] text-slate-400 print:text-slate-700 font-bold uppercase tracking-widest">
                Captain / FMC Inputs + Envelope
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-300 print:text-slate-800">
              <div>Date: {flight?.date ?? new Date().toISOString().slice(0, 10)}</div>
              <div>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Flight block */}
          <div className="mt-4 grid grid-cols-12 gap-2 text-[11px]">
            <Field label="Operator" value="WGA" span={3} />
            <Field label="Flight #" value={flight?.flightNumber ?? '—'} span={3} />
            <Field label="A/C Reg" value={flight?.registration ?? '—'} span={3} />
            <Field label="Route" value={route} span={3} />
          </div>

          {/* FMC Inputs */}
          <SectionTitle title="FMC Inputs (Key)" subtitle="Values typically entered/verified on the flight deck." />
          <div className="grid grid-cols-12 gap-2 text-[11px]">
            <Field label="ZFW" value={`${(zfwKg / 1000).toFixed(1)} t`} span={3} mono />
            <Field label="ZFW CG" value={`${zfwCg.toFixed(1)} %`} span={3} mono />
            <Field label="TOW" value={`${(towKg / 1000).toFixed(1)} t`} span={3} mono />
            <Field label="TOW CG" value={`${towCg.toFixed(1)} %`} span={3} mono />
            <Field label="LW" value={`${(lwKg / 1000).toFixed(1)} t`} span={3} mono />
            <Field label="LW CG" value={`${lwCg.toFixed(1)} %`} span={3} mono />
            <Field label="TO Fuel" value={`${(takeoffFuelKg / 1000).toFixed(1)} t`} span={3} mono />
            <Field label="Taxi Fuel" value={`${(taxiFuelKg / 1000).toFixed(1)} t`} span={3} mono />
            <Field label="Trip Burn" value={`${(tripBurnKg / 1000).toFixed(1)} t`} span={3} mono />
            <Field label="Trim" value="—" span={3} mono />
          </div>

          <div className="mt-2 text-[10px] text-slate-500 print:text-slate-700">
            Trim is a placeholder today. We’ll compute certified trim once we have the aircraft manual trim tables.
          </div>

          {/* Envelope */}
          <SectionTitle title="Flight Envelope" subtitle="ZFW/TOW/LW plotted against envelopes." />
          <div className="border border-slate-700 print:border-slate-300 rounded-xl p-3 bg-slate-950/30 print:bg-white">
            <div className="origin-top-left scale-[0.95] print:scale-100">
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

          {/* Notes */}
          <SectionTitle title="Captain Notes" subtitle="Optional. Stored locally for this print only." />
          <div className="border border-slate-700 print:border-slate-300 rounded-xl p-3 bg-slate-950/30 print:bg-white">
            <textarea
              value={captainNotes}
              onChange={(e) => setCaptainNotes(e.target.value)}
              className="w-full h-20 bg-transparent border border-slate-800 print:border-slate-300 rounded-lg p-2 text-[11px] font-mono text-slate-200 print:text-slate-900 outline-none"
              placeholder="Notes…"
            />
          </div>

          <div className="mt-4 text-[10px] text-slate-500 print:text-slate-700">
            Note: This report is generated from current in-app data. For operational acceptance, values must be backed by validated aircraft manual tables and operator policies.
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mt-6 mb-2">
    <div className="text-[12px] font-black uppercase tracking-wider text-white print:text-slate-900">{title}</div>
    <div className="text-[10px] text-slate-500 print:text-slate-700">{subtitle}</div>
  </div>
);

const Field: React.FC<{
  label: string;
  value: string;
  span: number;
  mono?: boolean;
  note?: string;
}> = ({ label, value, span, mono, note }) => (
  <div className={`col-span-${span} border border-slate-700 print:border-slate-300 rounded-lg p-2 min-w-0`}>
    <div className="text-[10px] uppercase tracking-wider text-slate-500 print:text-slate-700 font-bold">{label}</div>
    <div className={`mt-0.5 text-[11px] ${mono ? 'font-mono' : ''} text-slate-200 print:text-slate-900 truncate`}>
      {value}
    </div>
    {note && <div className="mt-1 text-[10px] text-slate-500 print:text-slate-700">{note}</div>}
  </div>
);


