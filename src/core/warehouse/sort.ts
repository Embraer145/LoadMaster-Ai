/**
 * Warehouse sorting logic (pure)
 */

import type { CargoItem } from '@core/types';
import type { WarehouseSortMode } from './types';

type RouteStopLike = { code: string; isOrigin?: boolean };

function stableTieBreak(a: CargoItem, b: CargoItem): number {
  // Stable and deterministic fallback
  return a.id.localeCompare(b.id);
}

function routeIndex(code: string, route: RouteStopLike[]): number {
  const stopOrder = route.filter(r => !r.isOrigin).map(r => r.code);
  const idx = stopOrder.indexOf(code);
  return idx === -1 ? Number.POSITIVE_INFINITY : idx;
}

export function sortWarehouseItems(
  items: CargoItem[],
  mode: WarehouseSortMode,
  route: RouteStopLike[]
): CargoItem[] {
  if (mode === 'none') return items;

  const sorted = [...items];

  sorted.sort((a, b) => {
    switch (mode) {
      case 'weight_desc': {
        const d = b.weight - a.weight;
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'weight_asc': {
        const d = a.weight - b.weight;
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'dest_route_last_first': {
        const aIdx = routeIndex(a.offloadPoint ?? a.dest.code, route);
        const bIdx = routeIndex(b.offloadPoint ?? b.dest.code, route);
        const d = bIdx - aIdx;
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'dest_route_first_first': {
        const aIdx = routeIndex(a.offloadPoint ?? a.dest.code, route);
        const bIdx = routeIndex(b.offloadPoint ?? b.dest.code, route);
        const d = aIdx - bIdx;
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'cargo_type': {
        const aKey = a.type?.code ?? '';
        const bKey = b.type?.code ?? '';
        const d = aKey.localeCompare(bKey);
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'uld_type': {
        const d = (a.uldType ?? '').localeCompare(b.uldType ?? '');
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'deck_pref': {
        const d = (a.preferredDeck ?? '').localeCompare(b.preferredDeck ?? '');
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'awb': {
        const d = (a.awb ?? '').localeCompare(b.awb ?? '');
        return d !== 0 ? d : stableTieBreak(a, b);
      }
      case 'uld_id': {
        return stableTieBreak(a, b);
      }
      default:
        return 0;
    }
  });

  return sorted;
}


