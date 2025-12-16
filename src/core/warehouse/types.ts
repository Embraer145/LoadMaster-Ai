/**
 * Warehouse sorting types and labels
 */

export type WarehouseSortMode =
  | 'none'
  | 'weight_desc'
  | 'weight_asc'
  | 'dest_route_last_first'
  | 'dest_route_first_first'
  | 'cargo_type'
  | 'uld_type'
  | 'deck_pref'
  | 'awb'
  | 'uld_id';

export const WAREHOUSE_SORT_LABEL: Record<WarehouseSortMode, string> = {
  none: 'None',
  weight_desc: 'Weight (Heavy → Light)',
  weight_asc: 'Weight (Light → Heavy)',
  dest_route_last_first: 'Destination (Last leg → First leg)',
  dest_route_first_first: 'Destination (First leg → Last leg)',
  cargo_type: 'Contents / Type',
  uld_type: 'ULD Type',
  deck_pref: 'Preferred Deck',
  awb: 'AWB',
  uld_id: 'ULD ID',
};

export const WAREHOUSE_SORT_MODES: WarehouseSortMode[] = [
  'none',
  'weight_desc',
  'weight_asc',
  'dest_route_last_first',
  'dest_route_first_first',
  'cargo_type',
  'uld_type',
  'deck_pref',
  'awb',
  'uld_id',
];


