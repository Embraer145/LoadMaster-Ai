import React, { useMemo, useState } from 'react';
import { X, DoorOpen, Printer } from 'lucide-react';
import type { AircraftConfig, AirframeLayout } from '@core/types';
import { getAircraftConfig } from '@data/aircraft';

interface AirframeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  registration?: string | null;
  /** Per-registration airframe card from local DB (may be null if not set for this reg). */
  airframeLayout?: AirframeLayout | null;
  /** Effective config currently driving math/diagrams (includes applied per-tail overrides). */
  aircraftConfig?: AircraftConfig | null;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-800/60 last:border-b-0">
      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{k}</div>
      <div className="text-[12px] text-slate-200 font-mono text-right break-all">{v}</div>
    </div>
  );
}

function fmtNum(n: unknown, suffix: string) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return `${Math.round(n).toLocaleString()}${suffix}`;
}

function fmtNumFixed(n: unknown, digits: number, suffix: string) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}${suffix}`;
}

function BlankBox() {
  return <div className="h-6 w-full border border-slate-400 rounded bg-white" />;
}

function PrintRow({
  label,
  existing,
  newBox = true,
}: {
  label: string;
  existing: React.ReactNode;
  newBox?: boolean;
}) {
  return (
    <div className="grid grid-cols-[220px,1fr,1fr] gap-3 py-2 border-b border-slate-300 last:border-b-0">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{label}</div>
      <div className="text-[12px] font-mono text-slate-900">{existing}</div>
      <div>{newBox ? <BlankBox /> : null}</div>
    </div>
  );
}

export const AirframeInfoModal: React.FC<AirframeInfoModalProps> = ({
  isOpen,
  onClose,
  title,
  registration,
  airframeLayout,
  aircraftConfig,
}) => {
  const [missing, setMissing] = useState<Record<string, boolean>>({});

  const images = useMemo(
    () => [
      { src: '/reference/747_doors_1.png', label: '747F cargo doors (reference)' },
      { src: '/reference/747_doors_2.png', label: '747F deck/door layout (reference)' },
    ],
    []
  );

  if (!isOpen) return null;

  const type = airframeLayout?.aircraftType ?? aircraftConfig?.type ?? '';
  const typeDefault = type ? getAircraftConfig(type) : undefined;
  const isSample =
    typeof airframeLayout?.isSampleData === 'boolean' ? airframeLayout.isSampleData : !!aircraftConfig?.isSampleData;
  const limits = airframeLayout?.limits ?? aircraftConfig?.limits;
  const cgLimits = airframeLayout?.cgLimits ?? aircraftConfig?.cgLimits;
  const mac = airframeLayout?.mac ?? aircraftConfig?.mac;
  const fuelArm = typeof airframeLayout?.fuelArm === 'number' ? airframeLayout.fuelArm : aircraftConfig?.fuelArm;
  const positionArmsCount = Object.keys(airframeLayout?.positionArms ?? {}).length;
  const stationArmsCount = Object.keys(airframeLayout?.stationArms ?? {}).length;
  const maxWeightsCount = Object.keys(airframeLayout?.positionMaxWeights ?? {}).length;
  const constraintsCount = Object.keys((airframeLayout as any)?.positionConstraints ?? {}).length;
  const effective = aircraftConfig ?? typeDefault ?? null;
  const effectiveStations = effective?.stations ?? [];
  const effectivePositions = effective?.positions ?? [];

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[240]">
      <button
        type="button"
        aria-label="Close airframe info"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm print:hidden"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:max-w-none print:w-[100%] print:border-slate-300 print:rounded-none print:bg-white print:text-slate-900">
          {/* Top bar (screen only) */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between gap-3 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <DoorOpen size={16} className="text-violet-300" />
                <div className="text-sm font-bold text-white">{title ?? 'Airframe / Door Reference'}</div>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Plan view orientation in this app: <span className="font-mono text-slate-200">NOSE left</span>,{' '}
                <span className="font-mono text-slate-200">TAIL right</span>. Port = L, Starboard = R.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700 flex items-center gap-2"
                title="Print / Save PDF"
              >
                <Printer size={14} /> Export PDF
              </button>
              <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white" title="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable worksheet (print only) */}
          <div className="hidden print:block p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-2xl font-black tracking-tight">AIRFRAME DATA CARD UPDATE</div>
                <div className="text-[11px] text-slate-700 font-bold uppercase tracking-widest mt-1">
                  Existing vs New (mechanic pencil worksheet)
                </div>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-800">
                <div>Generated: {new Date().toISOString()}</div>
                <div>App: LoadMaster Pro</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
              <div className="p-3 border border-slate-300 rounded">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Registration</div>
                <div className="font-mono text-slate-900 text-[13px] mt-1">{registration ?? '—'}</div>
              </div>
              <div className="p-3 border border-slate-300 rounded">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Aircraft Type</div>
                <div className="font-mono text-slate-900 text-[13px] mt-1">{type || '—'}</div>
              </div>
              <div className="p-3 border border-slate-300 rounded">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Revision</div>
                <div className="font-mono text-slate-900 text-[13px] mt-1">
                  {typeof airframeLayout?.revisionNumber === 'number' ? airframeLayout.revisionNumber : '—'}
                </div>
              </div>
            </div>

            <div className="mt-6 border border-slate-300 rounded overflow-hidden">
              <div className="grid grid-cols-[220px,1fr,1fr] gap-3 px-3 py-2 bg-slate-100 border-b border-slate-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Field</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Existing</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">NEW</div>
              </div>
              <div className="px-3">
                <PrintRow label="Status" existing={airframeLayout?.status ?? '—'} />
                <PrintRow label="Effective From (UTC)" existing={airframeLayout?.effectiveFromUtc ?? '—'} />
                <PrintRow label="Weigh Report Date (UTC)" existing={airframeLayout?.weighReportDateUtc ?? '—'} />
                <PrintRow label="Next Weigh Due (UTC)" existing={airframeLayout?.nextWeighDueUtc ?? '—'} />
                <PrintRow label="OEW (kg)" existing={fmtNum(limits?.OEW, ' kg')} />
                <PrintRow label="MZFW (kg)" existing={fmtNum(limits?.MZFW, ' kg')} />
                <PrintRow label="MTOW (kg)" existing={fmtNum(limits?.MTOW, ' kg')} />
                <PrintRow label="MLW (kg)" existing={fmtNum(limits?.MLW, ' kg')} />
                <PrintRow label="CG FWD (%MAC)" existing={fmtNumFixed(cgLimits?.forward, 1, '')} />
                <PrintRow label="CG AFT (%MAC)" existing={fmtNumFixed(cgLimits?.aft, 1, '')} />
                <PrintRow label="MAC refChord (in)" existing={fmtNumFixed(mac?.refChord, 1, '')} />
                <PrintRow label="MAC leMAC (in)" existing={fmtNumFixed(mac?.leMAC, 0, '')} />
                <PrintRow label="Fuel Arm (in)" existing={fmtNumFixed(fuelArm, 0, '')} />
                <PrintRow label="Sample Data" existing={isSample ? 'YES' : 'NO'} newBox={false} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6">
              <div className="border border-slate-300 rounded p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Change reason (NEW)</div>
                <div className="mt-2 h-10 border border-slate-400 rounded bg-white" />
              </div>

              <div className="border border-slate-300 rounded p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Provenance / References (NEW)
                </div>
                <div className="mt-2 h-16 border border-slate-400 rounded bg-white" />
              </div>
            </div>

            <div className="mt-8">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Stations (Existing vs NEW Arms)</div>
              <div className="mt-2 border border-slate-300 rounded overflow-hidden">
                <div className="grid grid-cols-[180px,1fr,140px,1fr] gap-2 px-3 py-2 bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  <div>Station</div>
                  <div>ID</div>
                  <div className="text-right">Existing Arm (in)</div>
                  <div className="text-right">NEW Arm (in)</div>
                </div>
                <div className="max-h-[520px] overflow-hidden">
                  {effectiveStations.map((s) => (
                    <div key={s.id} className="grid grid-cols-[180px,1fr,140px,1fr] gap-2 px-3 py-2 border-b border-slate-200 last:border-b-0 text-[11px]">
                      <div className="text-slate-800 truncate">{(airframeLayout?.stationLabels?.[s.id] ?? s.label) as any}</div>
                      <div className="font-mono text-slate-700 truncate">{s.id}</div>
                      <div className="font-mono text-slate-900 text-right">{fmtNumFixed(s.arm, 0, '')}</div>
                      <div className="flex justify-end"><div className="w-full max-w-[220px]"><BlankBox /></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Cargo Positions (Existing vs NEW Arm / Max Weight)
              </div>
              <div className="mt-2 border border-slate-300 rounded overflow-hidden">
                <div className="grid grid-cols-[70px,90px,1fr,120px,1fr,120px,1fr] gap-2 px-3 py-2 bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  <div>Deck</div>
                  <div>Pos</div>
                  <div>Label</div>
                  <div className="text-right">Arm (in)</div>
                  <div className="text-right">NEW Arm</div>
                  <div className="text-right">Max Wt (kg)</div>
                  <div className="text-right">NEW Max Wt</div>
                </div>
                <div className="max-h-[520px] overflow-hidden">
                  {effectivePositions.map((p) => (
                    <div key={p.id} className="grid grid-cols-[70px,90px,1fr,120px,1fr,120px,1fr] gap-2 px-3 py-2 border-b border-slate-200 last:border-b-0 text-[11px] items-center">
                      <div className="text-slate-700 font-bold">{p.deck}</div>
                      <div className="font-mono text-slate-900">{p.id}</div>
                      <div className="text-slate-700 truncate">{(airframeLayout?.positionLabels?.[p.id] ?? p.id) as any}</div>
                      <div className="font-mono text-slate-900 text-right">{fmtNumFixed(p.arm, 0, '')}</div>
                      <div className="flex justify-end"><div className="w-full max-w-[220px]"><BlankBox /></div></div>
                      <div className="font-mono text-slate-900 text-right">{fmtNum(p.maxWeight, '')}</div>
                      <div className="flex justify-end"><div className="w-full max-w-[220px]"><BlankBox /></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6">
              <div className="border-t border-slate-400 pt-2">
                <div className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Mechanic</div>
                <div className="mt-6 border-t border-slate-400" />
              </div>
              <div className="border-t border-slate-400 pt-2">
                <div className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Tech / Data Entry</div>
                <div className="mt-6 border-t border-slate-400" />
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div className="p-4 print:hidden">
            {/* Airframe Card */}
            <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-300">Airframe Card (Per Registration)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Source:{' '}
                    <span className="font-mono text-slate-300">
                      {airframeLayout ? 'local DB (airframe_layouts)' : 'type defaults / effective config'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSample ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                      SAMPLE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-200 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                      REAL DATA
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Identity</div>
                  <Row k="Registration" v={registration ?? '—'} />
                  <Row k="Aircraft Type" v={type || '—'} />
                  <Row k="Status" v={airframeLayout?.status ?? '—'} />
                  <Row k="Revision" v={typeof airframeLayout?.revisionNumber === 'number' ? airframeLayout.revisionNumber : '—'} />
                  <Row k="Effective From" v={airframeLayout?.effectiveFromUtc ?? '—'} />
                  <Row k="Weigh Report" v={airframeLayout?.weighReportDateUtc ?? '—'} />
                  <Row k="Next Due" v={airframeLayout?.nextWeighDueUtc ?? '—'} />
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Limits / Geometry</div>
                  <Row k="OEW" v={typeof limits?.OEW === 'number' ? `${Math.round(limits.OEW).toLocaleString()} kg` : '—'} />
                  <Row k="MZFW" v={typeof limits?.MZFW === 'number' ? `${Math.round(limits.MZFW).toLocaleString()} kg` : '—'} />
                  <Row k="MTOW" v={typeof limits?.MTOW === 'number' ? `${Math.round(limits.MTOW).toLocaleString()} kg` : '—'} />
                  <Row k="MLW" v={typeof limits?.MLW === 'number' ? `${Math.round(limits.MLW).toLocaleString()} kg` : '—'} />
                  <Row
                    k="CG Limits"
                    v={
                      typeof cgLimits?.forward === 'number' && typeof cgLimits?.aft === 'number'
                        ? `${cgLimits.forward.toFixed(1)}–${cgLimits.aft.toFixed(1)} %MAC`
                        : '—'
                    }
                  />
                  <Row
                    k="MAC"
                    v={
                      typeof mac?.refChord === 'number' && typeof mac?.leMAC === 'number'
                        ? `refChord ${mac.refChord} in • leMAC ${mac.leMAC} in`
                        : '—'
                    }
                  />
                  <Row k="Fuel Arm" v={typeof fuelArm === 'number' ? `${fuelArm} in` : '—'} />
                  <Row
                    k="Overrides"
                    v={`${positionArmsCount} pos arms • ${stationArmsCount} station arms • ${maxWeightsCount} max Wt • ${constraintsCount} constraints`}
                  />
                </div>
              </div>

              {airframeLayout?.changeReason ? (
                <div className="mt-3 text-[11px] text-slate-500">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Change reason:</span>{' '}
                  <span className="text-slate-300">{airframeLayout.changeReason}</span>
                </div>
              ) : null}

              <div className="mt-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Provenance</div>
                <div className="mt-1 bg-slate-950/30 border border-slate-800 rounded-lg p-2">
                  <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap break-words">
                    {airframeLayout?.dataProvenance
                      ? JSON.stringify(airframeLayout.dataProvenance, null, 2)
                      : typeDefault?.dataProvenance
                        ? JSON.stringify(typeDefault.dataProvenance, null, 2)
                        : '—'}
                  </pre>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500">
                Tip: edit this per tail in <span className="font-bold text-slate-300">Admin Settings → Airframe Layouts</span> (super admin).
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {images.map((img) => (
                <div key={img.src} className="bg-slate-950/30 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-300 mb-2">{img.label}</div>
                  {!missing[img.src] ? (
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-auto rounded-lg border border-slate-800 bg-white"
                      onError={() => setMissing((p) => ({ ...p, [img.src]: true }))}
                    />
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Image not found at <span className="font-mono text-slate-200">{img.src}</span>.
                      <div className="mt-2 text-[10px] text-slate-500">
                        To enable: add PNGs into <span className="font-mono text-slate-300">public/reference/</span> with the
                        filenames <span className="font-mono text-slate-300">747_doors_1.png</span> and{' '}
                        <span className="font-mono text-slate-300">747_doors_2.png</span>.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 text-[11px] text-slate-500">
              Note: door presence can vary by tail. Use{' '}
              <span className="font-bold text-slate-300">Admin Settings → Airframe Layouts</span> (super admin only) to set per
              registration.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


