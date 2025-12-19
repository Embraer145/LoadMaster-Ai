import type { CargoItem } from '@core/types';

export type CargoColorMode = 'handling' | 'uld';

const ULD_PALETTE: Record<CargoItem['uldType'], { bg: string; border: string; label: string }> = {
  // Distinct "earthy" palette: still ops-friendly but clearly separable at a glance.
  PMC: { bg: 'bg-amber-700', border: 'border-amber-200/45', label: 'PMC' },
  P6P: { bg: 'bg-orange-600', border: 'border-orange-200/45', label: 'P6P' },
  LD3: { bg: 'bg-rose-700', border: 'border-rose-200/40', label: 'LD3' },
  LD1: { bg: 'bg-teal-700', border: 'border-teal-200/40', label: 'LD1' },
  BULK: { bg: 'bg-slate-600', border: 'border-slate-200/30', label: 'BULK' },
  OTHER: { bg: 'bg-violet-700', border: 'border-violet-200/35', label: 'ULD' },
};

export function getCargoVisual(item: CargoItem, mode: CargoColorMode): { bg: string; border: string; stripLabel: string } {
  if (mode === 'uld') {
    const v = ULD_PALETTE[item.uldType] ?? ULD_PALETTE.OTHER;
    return { bg: v.bg, border: v.border, stripLabel: v.label };
  }
  // handling mode
  return { bg: item.type.color, border: item.type.border, stripLabel: item.type.label.toUpperCase() };
}

export function getHandlingBadges(item: CargoItem): string[] {
  const raw = item.handlingFlags ?? [];
  const dedup = Array.from(new Set(raw.map(s => s.trim()).filter(Boolean)));
  // Keep it compact; priority in front
  const order = ['DG', 'PER', 'PRI', 'MAIL'];
  dedup.sort((a, b) => (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 999 : order.indexOf(b)));
  return dedup.slice(0, 3);
}


