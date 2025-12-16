import type { AircraftConfig, LoadedPosition, PhysicsResult } from '@core/types';

export interface CalculationTraceInput {
  operatorCode?: string;
  flight?: {
    registration: string;
    flightNumber: string;
    origin?: string;
    destination?: string;
    stopover?: string | null;
    date?: string;
  } | null;
  aircraftConfig: AircraftConfig;
  positions: LoadedPosition[];
  fuelKg: number;
  physics: PhysicsResult;
  settingsSnapshot?: Record<string, unknown>;
  appVersion: string;
  generatedAtUtc?: string;
}

export interface CalculationTrace {
  documentId: string;
  generatedAtUtc: string;
  versionLabels: {
    appVersion: string;
    aircraftConfigHash: string;
    settingsHash: string;
    positionsHash: string;
  };
  inputs: {
    operatorCode?: string;
    flight?: CalculationTraceInput['flight'];
    fuelKg: number;
  };
  aircraft: {
    type: string;
    displayName?: string;
    isSampleData: boolean;
    limits: AircraftConfig['limits'];
    cgLimits: AircraftConfig['cgLimits'];
    mac: AircraftConfig['mac'];
    fuelArm: number;
  };
  cargo: {
    cargoWeightKg: number;
    cargoMomentKgIn: number;
    loadedPositionsCount: number;
    totalPositionsCount: number;
    perPosition: Array<{
      positionId: string;
      deck: LoadedPosition['deck'];
      armIn: number;
      weightKg: number;
      momentKgIn: number;
      cargoId?: string;
      awb?: string;
      dest?: string;
      origin?: string;
      uldType?: string;
      handlingFlags?: string[];
      mustFly?: boolean;
    }>;
  };
  outputs: {
    zfwKg: number;
    zfwCgPercentMac: number;
    towKg: number;
    towCgPercentMac: number;
    totalMomentKgIn: number;
    forwardLimitPercentMac: number;
    aftLimitPercentMac: number;
    isOverweight: boolean;
    isUnbalanced: boolean;
  };
  assumptions: string[];
}

function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const recur = (v: unknown): unknown => {
    if (v && typeof v === 'object') {
      if (seen.has(v as object)) return '[Circular]';
      seen.add(v as object);
      if (Array.isArray(v)) return v.map(recur);
      const obj = v as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = recur(obj[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(recur(value));
}

function computePositionMoment(pos: LoadedPosition): number {
  const w = pos.content?.weight ?? 0;
  return w * pos.arm;
}

export function buildCalculationTrace(input: CalculationTraceInput): CalculationTrace {
  const generatedAtUtc = input.generatedAtUtc ?? new Date().toISOString();

  const perPosition = input.positions
    .filter((p) => !!p.content)
    .map((p) => {
      const weightKg = p.content?.weight ?? 0;
      return {
        positionId: p.id,
        deck: p.deck,
        armIn: p.arm,
        weightKg,
        momentKgIn: computePositionMoment(p),
        cargoId: p.content?.id,
        awb: p.content?.awb,
        dest: p.content?.dest?.code,
        origin: p.content?.origin,
        uldType: p.content?.uldType,
        handlingFlags: p.content?.handlingFlags,
        mustFly: (p.content as any)?.mustFly as boolean | undefined,
      };
    });

  const cargoWeightKg = perPosition.reduce((s, r) => s + r.weightKg, 0);
  const cargoMomentKgIn = perPosition.reduce((s, r) => s + r.momentKgIn, 0);

  const documentBasis = stableStringify({
    operatorCode: input.operatorCode,
    flight: input.flight,
    fuelKg: input.fuelKg,
    aircraft: {
      type: input.aircraftConfig.type,
      isSampleData: !!input.aircraftConfig.isSampleData,
      limits: input.aircraftConfig.limits,
      cgLimits: input.aircraftConfig.cgLimits,
      mac: input.aircraftConfig.mac,
      fuelArm: input.aircraftConfig.fuelArm,
    },
    positions: perPosition,
  });
  const documentId = `LM-${fnv1a(documentBasis).toUpperCase()}`;

  const versionLabels = {
    appVersion: input.appVersion,
    aircraftConfigHash: fnv1a(stableStringify(input.aircraftConfig)),
    settingsHash: fnv1a(stableStringify(input.settingsSnapshot ?? {})),
    positionsHash: fnv1a(stableStringify(perPosition.map((p) => ({ positionId: p.positionId, weightKg: p.weightKg, armIn: p.armIn })))),
  };

  const assumptions: string[] = [];
  if (input.aircraftConfig.isSampleData) {
    assumptions.push(
      'Aircraft configuration is marked SAMPLE (not manual-traceable). Outputs must be verified against an approved reference system.'
    );
  }
  assumptions.push('Fuel is modeled using a single fixed fuel arm (no tank-distribution or burn-sequence CG shift).');
  assumptions.push('OEW moment is currently derived by assuming OEW CG at 25% MAC (replace with per-tail OEW moment/index from weighing report/manual).');

  return {
    documentId,
    generatedAtUtc,
    versionLabels,
    inputs: {
      operatorCode: input.operatorCode,
      flight: input.flight ?? null,
      fuelKg: input.fuelKg,
    },
    aircraft: {
      type: input.aircraftConfig.type,
      displayName: input.aircraftConfig.displayName,
      isSampleData: !!input.aircraftConfig.isSampleData,
      limits: input.aircraftConfig.limits,
      cgLimits: input.aircraftConfig.cgLimits,
      mac: input.aircraftConfig.mac,
      fuelArm: input.aircraftConfig.fuelArm,
    },
    cargo: {
      cargoWeightKg,
      cargoMomentKgIn,
      loadedPositionsCount: perPosition.length,
      totalPositionsCount: input.positions.length,
      perPosition,
    },
    outputs: {
      zfwKg: input.physics.zfw,
      zfwCgPercentMac: input.physics.zfwCG,
      towKg: input.physics.weight,
      towCgPercentMac: input.physics.towCG,
      totalMomentKgIn: input.physics.totalMoment,
      forwardLimitPercentMac: input.physics.forwardLimit,
      aftLimitPercentMac: input.physics.aftLimit,
      isOverweight: input.physics.isOverweight,
      isUnbalanced: input.physics.isUnbalanced,
    },
    assumptions,
  };
}


