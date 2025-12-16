/**
 * NotocModal Component
 * 
 * NOTOC (Notification to Captain) modal for special cargo.
 */

import React, { useMemo, useState } from 'react';
import { FileWarning, Printer, X } from 'lucide-react';
import type { FlightInfo, LoadedPosition } from '@core/types';

interface NotocModalProps {
  positions: LoadedPosition[];
  flight: FlightInfo | null;
  onClose: () => void;
}

export const NotocModal: React.FC<NotocModalProps> = ({ positions, flight, onClose }) => {
  const items = useMemo(() => {
    return positions
      .filter(p => p.content && (p.content.type.code === 'DG' || p.content.type.code === 'PER'))
      .map(p => ({
        pos: p.id,
        uldId: p.content!.id,
        awb: p.content!.awb,
        code: p.content!.type.code,
        typeLabel: p.content!.type.label,
        weightKg: p.content!.weight,
        dest: p.content!.dest.code,
      }));
  }, [positions]);

  const dgItems = items.filter(i => i.code === 'DG');
  const perItems = items.filter(i => i.code === 'PER');

  // User-friendly editable DG details (kept local, print-ready)
  const [dgDetails, setDgDetails] = useState<Record<string, { un: string; properName: string; classDiv: string; pkg: string; qty: string }>>({});
  const getDg = (key: string) => dgDetails[key] ?? { un: '', properName: '', classDiv: '', pkg: '', qty: '' };
  const setDg = (key: string, patch: Partial<ReturnType<typeof getDg>>) =>
    setDgDetails(prev => ({ ...prev, [key]: { ...getDg(key), ...patch } }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="relative w-full max-w-[980px] max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-slate-300 print:rounded-none print:bg-white print:max-h-none">
        {/* Top controls (sticky, hidden in print) */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur print:hidden">
          <div className="flex items-center gap-2">
            <FileWarning className="text-amber-400" size={18} />
            <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">NOTOC</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700 flex items-center gap-2"
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document (scrolls on-screen, paginates in print) */}
        <div className="p-6 print:p-8 text-slate-200 print:text-slate-900 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="text-2xl font-black tracking-tight text-white print:text-slate-900">
                NOTOC
              </div>
              <div className="text-[11px] text-slate-400 print:text-slate-700 font-bold uppercase tracking-widest">
                Notification to Captain (Special Loads)
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-300 print:text-slate-800">
              <div>Date: {flight?.date ?? new Date().toISOString().slice(0, 10)}</div>
              <div>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Flight / Aircraft block */}
          <div className="mt-4 grid grid-cols-12 gap-2 text-[11px]">
            <Field label="Operator" value="WGA" span={3} />
            <Field label="Flight #" value={flight?.flightNumber ?? '—'} span={3} />
            <Field label="A/C Reg" value={flight?.registration ?? '—'} span={3} />
            <Field label="Route" value={flight ? `${flight.origin} → ${flight.stopover ? `${flight.stopover} → ` : ''}${flight.destination}` : '—'} span={3} />
          </div>

          {/* DG section */}
          <SectionTitle title="Dangerous Goods (DG)" subtitle="Enter UN / Proper Shipping Name / Class if required before printing." />
          {dgItems.length === 0 ? (
            <EmptyRow text="No DG loaded." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border border-slate-700 print:border-slate-300">
                <thead className="bg-slate-950/40 print:bg-slate-100">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-700">
                    <Th>Pos</Th>
                    <Th>ULD</Th>
                    <Th>AWB</Th>
                    <Th>UN</Th>
                    <Th>Proper Shipping Name</Th>
                    <Th>Class/Div</Th>
                    <Th>Pkg</Th>
                    <Th>Qty</Th>
                    <ThRight>Wt</ThRight>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {dgItems.map((it) => {
                    const key = `${it.uldId}-${it.pos}`;
                    const d = getDg(key);
                    return (
                      <tr key={key} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                        <TdMono>{it.pos}</TdMono>
                        <TdMono>{it.uldId}</TdMono>
                        <TdMono>{it.awb}</TdMono>
                        <TdInput value={d.un} onChange={(v) => setDg(key, { un: v })} />
                        <TdInput value={d.properName} onChange={(v) => setDg(key, { properName: v })} />
                        <TdInput value={d.classDiv} onChange={(v) => setDg(key, { classDiv: v })} />
                        <TdInput value={d.pkg} onChange={(v) => setDg(key, { pkg: v })} />
                        <TdInput value={d.qty} onChange={(v) => setDg(key, { qty: v })} />
                        <TdRightMono>{(it.weightKg / 1000).toFixed(1)}t</TdRightMono>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Special cargo section */}
          <SectionTitle title="Special Cargo (PER)" subtitle="Perishables / temperature-sensitive items." />
          {perItems.length === 0 ? (
            <EmptyRow text="No PER loaded." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border border-slate-700 print:border-slate-300">
                <thead className="bg-slate-950/40 print:bg-slate-100">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-700">
                    <Th>Pos</Th>
                    <Th>ULD</Th>
                    <Th>AWB</Th>
                    <Th>Contents</Th>
                    <Th>Dest</Th>
                    <ThRight>Wt</ThRight>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {perItems.map((it) => (
                    <tr key={`${it.uldId}-${it.pos}`} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                      <TdMono>{it.pos}</TdMono>
                      <TdMono>{it.uldId}</TdMono>
                      <TdMono>{it.awb}</TdMono>
                      <Td>{it.typeLabel}</Td>
                      <TdMono>{it.dest}</TdMono>
                      <TdRightMono>{(it.weightKg / 1000).toFixed(1)}t</TdRightMono>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-6 grid grid-cols-12 gap-3 text-[11px]">
            <div className="col-span-6 border border-slate-700 print:border-slate-300 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-700 font-bold">Loadmaster Signature</div>
              <div className="mt-6 border-b border-slate-600 print:border-slate-400" />
              <div className="mt-2 text-[10px] text-slate-500 print:text-slate-700">Name / Signature</div>
            </div>
            <div className="col-span-6 border border-slate-700 print:border-slate-300 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-700 font-bold">Captain Signature</div>
              <div className="mt-6 border-b border-slate-600 print:border-slate-400" />
              <div className="mt-2 text-[10px] text-slate-500 print:text-slate-700">Name / Signature</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-[10px] text-slate-500 print:text-slate-700">
            This NOTOC is generated from the current load plan state. Review DG entries for completeness before printing.
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

const EmptyRow: React.FC<{ text: string }> = ({ text }) => (
  <div className="border border-slate-700 print:border-slate-300 rounded-lg p-3 text-[11px] text-slate-400 print:text-slate-700">
    {text}
  </div>
);

const Field: React.FC<{ label: string; value: string; span: number }> = ({ label, value, span }) => (
  <div className={`col-span-${span} border border-slate-700 print:border-slate-300 rounded-lg p-2`}>
    <div className="text-[10px] uppercase tracking-wider text-slate-500 print:text-slate-700 font-bold">{label}</div>
    <div className="mt-0.5 text-[11px] font-mono text-slate-200 print:text-slate-900 truncate">{value}</div>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-2 py-2 border-b border-slate-700 print:border-slate-300 font-bold">{children}</th>
);
const ThRight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-2 py-2 border-b border-slate-700 print:border-slate-300 font-bold text-right">{children}</th>
);
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="px-2 py-2 align-top">{children}</td>
);
const TdMono: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="px-2 py-2 font-mono text-slate-200 print:text-slate-900">{children}</td>
);
const TdRightMono: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="px-2 py-2 font-mono text-right text-slate-200 print:text-slate-900">{children}</td>
);
const TdInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <td className="px-2 py-1.5 align-top">
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-950/40 print:bg-transparent border border-slate-800 print:border-slate-300 rounded px-2 py-1 text-[11px] font-mono text-slate-200 print:text-slate-900 outline-none"
    />
  </td>
);
