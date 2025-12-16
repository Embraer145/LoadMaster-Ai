import React, { useMemo } from 'react';
import { Printer, X } from 'lucide-react';
import type { AircraftConfig, LoadedPosition, PhysicsResult } from '@core/types';
import { buildCalculationTrace } from '@core/physics';
import { env } from '@/config/env';

type FlightLike =
  | {
      registration: string;
      flightNumber: string;
      origin?: string;
      destination?: string;
      stopover?: string | null;
      date?: string;
    }
  | null;

function kg(n: number): string {
  return `${Math.round(n).toLocaleString()} kg`;
}

function momentKgIn(n: number): string {
  return `${Math.round(n).toLocaleString()} kg·in`;
}

interface ProofPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorCode?: string;
  flight: FlightLike;
  aircraftConfig: AircraftConfig;
  positions: LoadedPosition[];
  fuelKg: number;
  physics: PhysicsResult;
  settingsSnapshot?: Record<string, unknown>;
}

export const ProofPackModal: React.FC<ProofPackModalProps> = ({
  isOpen,
  onClose,
  operatorCode,
  flight,
  aircraftConfig,
  positions,
  fuelKg,
  physics,
  settingsSnapshot,
}) => {
  const generatedAt = useMemo(() => new Date(), []);
  const generatedAtUtc = useMemo(() => generatedAt.toISOString(), [generatedAt]);

  const trace = useMemo(
    () =>
      buildCalculationTrace({
        operatorCode,
        flight,
        aircraftConfig,
        positions,
        fuelKg,
        physics,
        settingsSnapshot,
        appVersion: env.appVersion,
        generatedAtUtc,
      }),
    [operatorCode, flight, aircraftConfig, positions, fuelKg, physics, settingsSnapshot, generatedAtUtc]
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    // Print-to-PDF (user saves as PDF in system dialog).
    // Keep title stable for PDF filenames.
    const prev = document.title;
    const reg = flight?.registration ?? 'UNKNOWN';
    const flt = flight?.flightNumber ?? 'LOAD';
    document.title = `ProofPack_${reg}_${flt}_${generatedAtUtc.replace(/[:.]/g, '-')}`;
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        document.title = prev;
      }, 250);
    }, 50);
  };

  const reg = flight?.registration ?? '—';
  const flt = flight?.flightNumber ?? '—';
  const route = flight
    ? `${flight.origin ?? '—'}${flight.stopover ? ` / ${flight.stopover}` : ''} → ${flight.destination ?? '—'}`
    : '—';

  const cgMargin = Math.min(physics.towCG - physics.forwardLimit, physics.aftLimit - physics.towCG);

  return (
    <div className="fixed inset-0 z-[230]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close proof pack"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm lm-no-print"
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-screen p-6 sm:p-10">
          <div className="mx-auto max-w-6xl">
            {/* Toolbar */}
            <div className="flex items-start justify-between gap-4 mb-6 lm-no-print">
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-widest">LoadMaster Pro</div>
                <h1 className="text-2xl font-bold text-white mt-1">Proof / Audit Pack</h1>
                <div className="text-[11px] text-slate-400 mt-1">
                  Document ID: <span className="font-mono text-slate-200">{trace.documentId}</span> • Generated (UTC):{' '}
                  <span className="font-mono text-slate-200">{generatedAtUtc}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-slate-200 hover:bg-slate-100"
                >
                  <Printer size={14} /> Export PDF
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Print root */}
            <div id="lm-proof-pack" className="lm-proof-root bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200">
              {/* Header (print + screen) */}
              <div className="px-6 py-5 border-b border-slate-200">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      LoadMaster Pro • Proof / Audit Pack
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {operatorCode ?? '—'} • {reg} • {flt}
                    </div>
                    <div className="text-[12px] text-slate-700 mt-1">
                      Route: <span className="font-mono">{route}</span> • Date: <span className="font-mono">{flight?.date ?? '—'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-600">Document ID</div>
                    <div className="font-mono font-bold">{trace.documentId}</div>
                    <div className="text-[11px] text-slate-600 mt-2">Generated (UTC)</div>
                    <div className="font-mono">{generatedAtUtc}</div>
                  </div>
                </div>
              </div>

              {/* Summary strip */}
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <SummaryTile label="ZFW" value={kg(physics.zfw)} />
                  <SummaryTile label="TOW" value={kg(physics.weight)} />
                  <SummaryTile label="TOW CG" value={`${physics.towCG}% MAC`} />
                  <SummaryTile
                    label="CG Margin"
                    value={`${cgMargin.toFixed(1)}%`}
                    tone={cgMargin < 2 ? 'warn' : 'ok'}
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="p-6 space-y-8">
                {/* Aircraft / Provenance */}
                <Section title="Aircraft Configuration / Provenance">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <KeyValueTable
                      title="Aircraft"
                      rows={[
                        ['Type', aircraftConfig.type],
                        ['Display name', aircraftConfig.displayName ?? '—'],
                        ['Sample data', aircraftConfig.isSampleData ? 'YES' : 'NO'],
                      ]}
                    />
                    <KeyValueTable
                      title="Structural Limits"
                      rows={[
                        ['OEW', kg(aircraftConfig.limits.OEW)],
                        ['MZFW', kg(aircraftConfig.limits.MZFW)],
                        ['MTOW', kg(aircraftConfig.limits.MTOW)],
                        ['MLW', kg(aircraftConfig.limits.MLW)],
                      ]}
                    />
                    <KeyValueTable
                      title="Reference System"
                      rows={[
                        ['Datum/MAC', `LEMAC ${aircraftConfig.mac.leMAC} in • MAC ${aircraftConfig.mac.refChord} in`],
                        ['Fuel arm (model)', `${aircraftConfig.fuelArm} in`],
                        ['CG limits (static)', `${aircraftConfig.cgLimits.forward}% to ${aircraftConfig.cgLimits.aft}% MAC`],
                      ]}
                    />
                  </div>

                  {aircraftConfig.dataProvenance && (
                    <div className="mt-4">
                      <div className="text-[12px] font-bold text-slate-800">Provenance notes</div>
                      <div className="text-[12px] text-slate-700 mt-1">
                        {aircraftConfig.dataProvenance.notes ?? '—'}
                      </div>
                      {aircraftConfig.dataProvenance.documents && aircraftConfig.dataProvenance.documents.length > 0 && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-[12px] border border-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <Th>Document</Th>
                                <Th>Revision</Th>
                                <Th>Reference</Th>
                                <Th>Notes</Th>
                              </tr>
                            </thead>
                            <tbody>
                              {aircraftConfig.dataProvenance.documents.map((d) => (
                                <tr key={d.id} className="border-t border-slate-200">
                                  <Td className="font-mono">{d.title}</Td>
                                  <Td className="font-mono">{d.revision ?? '—'}</Td>
                                  <Td className="font-mono">{d.reference ?? '—'}</Td>
                                  <Td>{d.notes ?? '—'}</Td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </Section>

                {/* Inputs */}
                <Section title="Inputs Snapshot">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <KeyValueTable
                      title="Flight"
                      rows={[
                        ['Operator', operatorCode ?? '—'],
                        ['Registration', reg],
                        ['Flight number', flt],
                        ['Route', route],
                        ['Flight date', flight?.date ?? '—'],
                      ]}
                    />
                    <KeyValueTable
                      title="Fuel"
                      rows={[
                        ['Fuel weight', kg(fuelKg)],
                        ['Fuel arm (model)', `${aircraftConfig.fuelArm} in`],
                        ['Fuel moment (model)', momentKgIn(fuelKg * aircraftConfig.fuelArm)],
                      ]}
                    />
                    <KeyValueTable
                      title="Cargo totals (computed)"
                      rows={[
                        ['Total cargo weight', kg(trace.cargo.cargoWeightKg)],
                        ['Total cargo moment', momentKgIn(trace.cargo.cargoMomentKgIn)],
                        ['Loaded positions', `${trace.cargo.loadedPositionsCount} / ${trace.cargo.totalPositionsCount}`],
                      ]}
                    />
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-[12px] border border-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <Th>Position</Th>
                          <Th>Deck</Th>
                          <Th>ULD</Th>
                          <Th>AWB</Th>
                          <Th>Dest</Th>
                          <Th className="text-right">Weight (kg)</Th>
                          <Th className="text-right">Arm (in)</Th>
                          <Th className="text-right">Moment (kg·in)</Th>
                          <Th>Notes</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions
                          .filter((p) => !!p.content)
                          .map((p) => {
                            const m = p.content ? p.content.weight * p.arm : 0;
                            const c = p.content!;
                            const notes =
                              c.handlingFlags && c.handlingFlags.length > 0
                                ? c.handlingFlags.join(', ')
                                : c.type?.code ?? '';
                            return (
                              <tr key={p.id} className="border-t border-slate-200">
                                <Td className="font-mono font-bold">{p.id}</Td>
                                <Td className="font-mono">{p.deck}</Td>
                                <Td className="font-mono">{c.id}</Td>
                                <Td className="font-mono">{c.awb ?? '—'}</Td>
                                <Td className="font-mono">{c.dest?.code ?? '—'}</Td>
                                <Td className="text-right font-mono">{Math.round(c.weight).toLocaleString()}</Td>
                                <Td className="text-right font-mono">{Math.round(p.arm).toLocaleString()}</Td>
                                <Td className="text-right font-mono">{Math.round(m).toLocaleString()}</Td>
                                <Td className="text-slate-700">{notes || '—'}</Td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </Section>

                {/* Math */}
                <Section title="Weight & Balance Computation (Deterministic)">
                  <div className="text-[12px] text-slate-700">
                    Core equations used:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Position moment = Weight × Arm</li>
                      <li>Total moment = OEW moment + Cargo moment + Fuel moment</li>
                      <li>CG station (in) = Total moment ÷ Total weight</li>
                      <li>%MAC = ((CG station − LEMAC) ÷ MAC length) × 100</li>
                    </ul>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <KeyValueTable
                      title="Computed outputs (from current engine)"
                      rows={[
                        ['ZFW', kg(physics.zfw)],
                        ['ZFW CG', `${physics.zfwCG}% MAC`],
                        ['TOW', kg(physics.weight)],
                        ['TOW CG', `${physics.towCG}% MAC`],
                        ['Total moment (engine)', momentKgIn(physics.totalMoment)],
                      ]}
                    />
                    <KeyValueTable
                      title="Intermediate references"
                      rows={[
                        ['LEMAC', `${aircraftConfig.mac.leMAC} in`],
                        ['MAC length', `${aircraftConfig.mac.refChord} in`],
                        ['Fuel arm', `${aircraftConfig.fuelArm} in`],
                        ['Cargo weight (sum)', kg(trace.cargo.cargoWeightKg)],
                      ]}
                    />
                  </div>
                </Section>

                {/* Limits */}
                <Section title="Limits / Envelope Evaluation">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <LimitTile
                      label="MZFW"
                      limit={aircraftConfig.limits.MZFW}
                      value={physics.zfw}
                      unit="kg"
                    />
                    <LimitTile
                      label="MTOW"
                      limit={aircraftConfig.limits.MTOW}
                      value={physics.weight}
                      unit="kg"
                    />
                    <LimitTile label="MLW" limit={aircraftConfig.limits.MLW} value={NaN} unit="kg" note="Not evaluated (landing weight model not implemented)" />
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <KeyValueTable
                      title="CG at takeoff"
                      rows={[
                        ['Forward limit (engine)', `${physics.forwardLimit}% MAC`],
                        ['Aft limit (engine)', `${physics.aftLimit}% MAC`],
                        ['TOW CG', `${physics.towCG}% MAC`],
                        ['Within limits', physics.isUnbalanced ? 'NO' : 'YES'],
                        ['CG margin', `${cgMargin.toFixed(1)}% MAC`],
                      ]}
                    />
                    <KeyValueTable
                      title="Weight status"
                      rows={[
                        ['Overweight', physics.isOverweight ? 'YES' : 'NO'],
                        ['ZFW within MZFW', physics.zfw > aircraftConfig.limits.MZFW ? 'NO' : 'YES'],
                        ['TOW within MTOW', physics.weight > aircraftConfig.limits.MTOW ? 'NO' : 'YES'],
                        ['Fuel', kg(fuelKg)],
                      ]}
                    />
                  </div>
                </Section>

                {/* Assumptions */}
                <Section title="Assumptions / Required Manual Data">
                  <ul className="list-disc pl-5 text-[12px] text-slate-700">
                    {trace.assumptions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </Section>

                {/* Version labels */}
                <Section title="Version Labels (Change Control)">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <KeyValueTable
                      title="Software"
                      rows={[
                        ['App version', trace.versionLabels.appVersion],
                        ['Generated (UTC)', generatedAtUtc],
                        ['Document ID', trace.documentId],
                      ]}
                    />
                    <KeyValueTable
                      title="Data / Settings hashes"
                      rows={[
                        ['Aircraft config hash', trace.versionLabels.aircraftConfigHash],
                        ['Settings hash', trace.versionLabels.settingsHash],
                        ['Positions hash', trace.versionLabels.positionsHash],
                      ]}
                    />
                    <KeyValueTable
                      title="Compliance notes"
                      rows={[
                        ['Human-in-loop', 'Required (Finalize is explicit)'],
                        ['Audit logging', 'Configurable (prototype storage in progress)'],
                        ['Offline policy', 'Configurable (admin)'],
                      ]}
                    />
                  </div>
                </Section>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 text-[11px] text-slate-600">
                This report is generated from the current on-screen load plan state. If aircraft data is marked SAMPLE,
                outputs must be verified against an approved reference system.
              </div>
            </div>

            <div className="mt-4 text-[11px] text-slate-400 lm-no-print">
              Tip: click <span className="font-bold text-slate-200">Export PDF</span> and choose “Save as PDF”.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'warn';
}) {
  const border = tone === 'warn' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50';
  return (
    <div className={`rounded-xl border ${border} p-3`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</div>
      <div className="mt-1 font-mono text-[14px] font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[12px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function KeyValueTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="text-[12px] font-bold text-slate-800">{title}</div>
      </div>
      <div className="divide-y divide-slate-200">
        {rows.map(([k, v]) => (
          <div key={k} className="px-3 py-2 flex items-start justify-between gap-4">
            <div className="text-[12px] text-slate-600">{k}</div>
            <div className="text-[12px] text-slate-900 font-mono text-right break-words max-w-[60%]">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitTile({
  label,
  limit,
  value,
  unit,
  note,
}: {
  label: string;
  limit: number;
  value: number;
  unit: 'kg';
  note?: string;
}) {
  const hasValue = Number.isFinite(value);
  const ok = !hasValue ? null : value <= limit;
  const border = ok === null ? 'border-slate-200' : ok ? 'border-emerald-300' : 'border-red-300';
  const bg = ok === null ? 'bg-slate-50' : ok ? 'bg-emerald-50' : 'bg-red-50';

  return (
    <div className={`rounded-xl border ${border} ${bg} p-3`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{label}</div>
      <div className="mt-1 text-[12px] text-slate-700">
        Limit: <span className="font-mono font-bold">{Math.round(limit).toLocaleString()} {unit}</span>
      </div>
      <div className="mt-1 text-[12px] text-slate-700">
        Value:{' '}
        <span className="font-mono font-bold">
          {hasValue ? `${Math.round(value).toLocaleString()} ${unit}` : '—'}
        </span>
      </div>
      <div className="mt-1 text-[11px] font-bold">
        {ok === null ? (
          <span className="text-slate-700">{note ?? 'Not evaluated'}</span>
        ) : ok ? (
          <span className="text-emerald-800">IN LIMIT</span>
        ) : (
          <span className="text-red-800">EXCEEDS LIMIT</span>
        )}
      </div>
      {note && ok !== null && <div className="mt-1 text-[11px] text-slate-600">{note}</div>}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-700 ${className ?? ''}`}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className ?? ''}`}>{children}</td>;
}


