import React, { useMemo, useState } from 'react';

function normalizeKey(raw: string): string {
  const k = (raw ?? '').trim().toUpperCase();
  // Map our current internal simplified codes to common industry photo/diagram codes
  if (k === 'LD3') return 'AKE';
  if (k === 'LD1') return 'AKH';
  return k || 'UNKNOWN';
}

function buildCandidates(key: string): string[] {
  // Use public/uld/ so assets are available offline and via simple paths.
  // Prefer SVG if provided, then PNG, then WEBP, then JPG.
  return [
    `/uld/${key}.svg`,
    `/uld/${key}.png`,
    `/uld/${key}.webp`,
    `/uld/${key}.jpg`,
    `/uld/${key}.jpeg`,
  ];
}

export interface UldImageProps {
  uldCode: string;
  className?: string;
  /** Optional alt label */
  alt?: string;
  /** Optional caption under image */
  caption?: string;
  /** Constrain rendered height to avoid UI bouncing/oversized previews */
  maxHeightPx?: number;
}

/**
 * ULD image loader with offline-friendly public asset paths.
 *
 * Convention:
 * - Place files under public/uld/
 * - Name them by code (e.g., AKE.png, AKH.svg, PMC.webp, Q7.png, etc.)
 */
export const UldImage: React.FC<UldImageProps> = ({ uldCode, className, alt, caption, maxHeightPx }) => {
  const key = useMemo(() => normalizeKey(uldCode), [uldCode]);
  const candidates = useMemo(() => buildCandidates(key), [key]);

  const [idx, setIdx] = useState(0);
  const src = candidates[idx] ?? '';

  const showPlaceholder = !src;

  return (
    <div className={className}>
      <div className="w-full rounded-lg border border-slate-700/50 bg-slate-950/30 overflow-hidden">
        {showPlaceholder ? (
          <div className="p-4">
            <div className="text-[11px] text-slate-300 font-bold">ULD image missing</div>
            <div className="mt-1 text-[11px] text-slate-500 font-mono">
              Add one of: {candidates.map((c) => c.replace('/uld/', '')).join(', ')}
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt={alt ?? `${key} ULD`}
            className="w-full block object-contain"
            style={typeof maxHeightPx === 'number' ? { maxHeight: `${maxHeightPx}px` } : undefined}
            onError={() => setIdx((i) => i + 1)}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      {caption && <div className="mt-1 text-[10px] text-slate-500 font-mono">{caption}</div>}
    </div>
  );
};


