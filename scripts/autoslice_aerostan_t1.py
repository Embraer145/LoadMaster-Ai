#!/usr/bin/env python3
"""
Autoslice Aerostan t1.svg (Lower Hold Capability Containers and Pallets) into per-ULD SVGs.

Phase 1 (batch1): extract the top-row beige containers and emit:
  - public/uld/AKE.svg   (LD3)
  - public/uld/AKH.svg   (LD1)
  - public/uld/LD9.svg

Approach:
  - Parse <path ... fill="..."> elements
  - For selected fills (beige container faces), compute rough bbox from numbers in `d`
  - Cluster bboxes by overlap/proximity
  - Take top-row clusters (smallest y), sort left->right
  - Create cropped SVGs by setting viewBox to padded square around each cluster and embedding original SVG body
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple


SRC = Path("public/uld/source/aerostan/t1.svg")
OUT_DIR = Path("public/uld")

BEIGE = "#E7C9A9"  # container faces
AR_BG = "#4D5F70"  # Aerostan panel background (from page.html)


@dataclass
class BBox:
  minx: float
  miny: float
  maxx: float
  maxy: float

  def union(self, other: "BBox") -> "BBox":
    return BBox(
      min(self.minx, other.minx),
      min(self.miny, other.miny),
      max(self.maxx, other.maxx),
      max(self.maxy, other.maxy),
    )

  def cx(self) -> float:
    return (self.minx + self.maxx) / 2.0

  def cy(self) -> float:
    return (self.miny + self.maxy) / 2.0

  def w(self) -> float:
    return self.maxx - self.minx

  def h(self) -> float:
    return self.maxy - self.miny

  def overlaps(self, other: "BBox", pad: float = 0.0) -> bool:
    return not (
      self.maxx + pad < other.minx
      or other.maxx + pad < self.minx
      or self.maxy + pad < other.miny
      or other.maxy + pad < self.miny
    )


def bbox_from_path_d(d: str) -> BBox | None:
  """
  Compute a bbox for an SVG path `d` by parsing commands.

  We include endpoints and control points (for curves) but do not evaluate curve extrema;
  for our auto-slicing use case, this is good enough.
  """

  # Tokenize: command letters or numbers (including negatives/decimals)
  tokens = re.findall(r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?", d)
  if not tokens:
    return None

  def take_numbers(i: int, n: int) -> Tuple[List[float], int]:
    out: List[float] = []
    for _ in range(n):
      if i >= len(tokens):
        break
      out.append(float(tokens[i]))
      i += 1
    return out, i

  x = 0.0
  y = 0.0
  start_x = 0.0
  start_y = 0.0
  minx = float("inf")
  miny = float("inf")
  maxx = float("-inf")
  maxy = float("-inf")

  def add_point(px: float, py: float):
    nonlocal minx, miny, maxx, maxy
    minx = min(minx, px)
    miny = min(miny, py)
    maxx = max(maxx, px)
    maxy = max(maxy, py)

  i = 0
  cmd = None
  while i < len(tokens):
    t = tokens[i]
    if re.match(r"[A-Za-z]", t):
      cmd = t
      i += 1
      if cmd in "Zz":
        x, y = start_x, start_y
        add_point(x, y)
      continue
    if cmd is None:
      # malformed path
      break

    if cmd in "Mm":
      nums, i = take_numbers(i, 2)
      if len(nums) < 2:
        break
      nx, ny = nums
      if cmd == "m":
        nx += x
        ny += y
      x, y = nx, ny
      start_x, start_y = x, y
      add_point(x, y)
      # subsequent pairs are treated as implicit LineTo
      cmd = "L" if cmd == "M" else "l"
      continue

    if cmd in "Ll":
      nums, i = take_numbers(i, 2)
      if len(nums) < 2:
        break
      nx, ny = nums
      if cmd == "l":
        nx += x
        ny += y
      x, y = nx, ny
      add_point(x, y)
      continue

    if cmd in "Hh":
      nums, i = take_numbers(i, 1)
      if not nums:
        break
      nx = nums[0] + (x if cmd == "h" else 0.0)
      x = nx
      add_point(x, y)
      continue

    if cmd in "Vv":
      nums, i = take_numbers(i, 1)
      if not nums:
        break
      ny = nums[0] + (y if cmd == "v" else 0.0)
      y = ny
      add_point(x, y)
      continue

    if cmd in "Cc":
      nums, i = take_numbers(i, 6)
      if len(nums) < 6:
        break
      x1, y1, x2, y2, nx, ny = nums
      if cmd == "c":
        x1 += x
        y1 += y
        x2 += x
        y2 += y
        nx += x
        ny += y
      add_point(x1, y1)
      add_point(x2, y2)
      x, y = nx, ny
      add_point(x, y)
      continue

    if cmd in "Ss":
      nums, i = take_numbers(i, 4)
      if len(nums) < 4:
        break
      x2, y2, nx, ny = nums
      if cmd == "s":
        x2 += x
        y2 += y
        nx += x
        ny += y
      add_point(x2, y2)
      x, y = nx, ny
      add_point(x, y)
      continue

    if cmd in "Qq":
      nums, i = take_numbers(i, 4)
      if len(nums) < 4:
        break
      x1, y1, nx, ny = nums
      if cmd == "q":
        x1 += x
        y1 += y
        nx += x
        ny += y
      add_point(x1, y1)
      x, y = nx, ny
      add_point(x, y)
      continue

    if cmd in "Tt":
      nums, i = take_numbers(i, 2)
      if len(nums) < 2:
        break
      nx, ny = nums
      if cmd == "t":
        nx += x
        ny += y
      x, y = nx, ny
      add_point(x, y)
      continue

    if cmd in "Aa":
      nums, i = take_numbers(i, 7)
      if len(nums) < 7:
        break
      # rx, ry, xrot, largeArc, sweep, nx, ny
      nx, ny = nums[5], nums[6]
      if cmd == "a":
        nx += x
        ny += y
      x, y = nx, ny
      add_point(x, y)
      continue

    # Unknown/unsupported command: skip one token to avoid infinite loop
    i += 1

  if minx == float("inf"):
    return None
  return BBox(minx, miny, maxx, maxy)


def cluster_bboxes(bboxes: List[BBox], proximity: float = 18.0) -> List[BBox]:
  # Simple agglomerative clustering: union boxes that overlap or are close.
  clusters: List[BBox] = []
  for b in bboxes:
    merged = False
    for i, c in enumerate(clusters):
      if c.overlaps(b, pad=proximity):
        clusters[i] = c.union(b)
        merged = True
        break
    if not merged:
      clusters.append(b)

  # Repeat until stable
  changed = True
  while changed:
    changed = False
    out: List[BBox] = []
    for b in clusters:
      did = False
      for i, c in enumerate(out):
        if c.overlaps(b, pad=proximity):
          out[i] = c.union(b)
          did = True
          changed = True
          break
      if not did:
        out.append(b)
    clusters = out
  return clusters


def parse_svg_body(svg_text: str) -> Tuple[str, str, str]:
  """
  Return (open_tag, inner_body, close_tag) for the SVG.
  """
  m = re.search(r"(<svg[^>]*>)(.*)(</svg>)", svg_text, flags=re.DOTALL | re.IGNORECASE)
  if not m:
    raise RuntimeError("Could not parse svg wrapper")
  return m.group(1), m.group(2), m.group(3)

def extract_paths(svg_text: str) -> List[Tuple[str, str, str]]:
  """
  Return list of (full_tag, d, fill) for each <path ...>.
  """
  tags = re.findall(r"<path\b[^>]*>", svg_text, flags=re.IGNORECASE)
  out: List[Tuple[str, str, str]] = []
  for tag in tags:
    md = re.search(r'\bd\s*=\s*"([^"]+)"', tag, flags=re.IGNORECASE)
    mfill = re.search(r'\bfill\s*=\s*"([^"]+)"', tag, flags=re.IGNORECASE)
    d = md.group(1) if md else ""
    fill = mfill.group(1) if mfill else ""
    out.append((tag, d, fill))
  return out


def crop_to_square(b: BBox, pad: float = 60.0) -> BBox:
  minx = b.minx - pad
  miny = b.miny - pad
  maxx = b.maxx + pad
  maxy = b.maxy + pad
  w = maxx - minx
  h = maxy - miny
  side = max(w, h)
  cx = (minx + maxx) / 2.0
  cy = (miny + maxy) / 2.0
  return BBox(cx - side / 2.0, cy - side / 2.0, cx + side / 2.0, cy + side / 2.0)

def crop_rect(b: BBox, *, pad_l: float, pad_r: float, pad_t: float, pad_b: float) -> BBox:
  """
  Asymmetric rectangular crop around a bbox.
  Useful to include title/labels above while keeping the image narrower.
  """
  return BBox(
    b.minx - pad_l,
    b.miny - pad_t,
    b.maxx + pad_r,
    b.maxy + pad_b,
  )

def svg_canvas_for_viewbox(vb: BBox, max_w: int = 640) -> tuple[int, int]:
  """
  Pick a canvas size (width,height) that preserves aspect ratio.
  We cap width to keep consistent-ish sizing in UI; height follows aspect.
  """
  w = max(vb.w(), 1.0)
  h = max(vb.h(), 1.0)
  width = int(max_w)
  height = int(round(max_w * (h / w)))
  # Clamp height to a reasonable range; UI will further constrain.
  height = max(220, min(640, height))
  return width, height


def main() -> int:
  if not SRC.exists():
    raise SystemExit(f"Missing source: {SRC}")
  svg = SRC.read_text("utf-8", errors="ignore")
  open_tag, body, close_tag = parse_svg_body(svg)
  all_paths = extract_paths(svg)

  # Find beige paths and collect bboxes (attribute order varies; parse each <path ...> tag)
  beige_paths: List[str] = []
  for _tag, d, fill in all_paths:
    if fill.strip().upper() == BEIGE.upper() and d:
      beige_paths.append(d)
  bboxes: List[BBox] = []
  for d in beige_paths:
    bb = bbox_from_path_d(d)
    if bb:
      bboxes.append(bb)

  if not bboxes:
    raise SystemExit("No beige paths found; source format changed?")

  clusters = cluster_bboxes(bboxes, proximity=22.0)

  # Filter plausible “container clusters” by size
  clusters = [c for c in clusters if c.w() > 80 and c.h() > 60]

  # Pick top-row clusters: smallest cy
  clusters.sort(key=lambda c: c.cy())
  top = clusters[:3]
  top.sort(key=lambda c: c.cx())

  # Map left->right
  mapping = [
    ("AKE", top[0]),  # LD3
    ("AKH", top[1]),  # LD1
    ("LD9", top[2]),
  ]

  OUT_DIR.mkdir(parents=True, exist_ok=True)
  for code, bb in mapping:
    # Tune crops for LD3/LD1: narrower + extra headroom so top label isn't clipped.
    if code in ("AKE", "AKH"):
      vb = crop_rect(bb, pad_l=18.0, pad_r=18.0, pad_t=120.0, pad_b=44.0)
    else:
      vb = crop_to_square(bb, pad=90.0)

    cw, ch = svg_canvas_for_viewbox(vb, max_w=640)

    # IMPORTANT: For LD1/LD3 we preserve the full original body and rely on the viewBox crop.
    # Path-filtering can accidentally drop tiny “cover/mask” paths and introduce visual artifacts
    # (the “black triangles” the user is seeing).
    if code in ("AKE", "AKH"):
      inner = body
    else:
      # Keep only paths that intersect the crop region (with a small margin).
      keep: List[str] = []
      margin = 12.0
      crop = BBox(vb.minx - margin, vb.miny - margin, vb.maxx + margin, vb.maxy + margin)
      for tag, d, _fill in all_paths:
        if not d:
          continue
        pb = bbox_from_path_d(d)
        if pb and pb.overlaps(crop, pad=0.0):
          keep.append(tag)
      inner = "".join(keep)

    out_svg = (
      f'<svg xmlns="http://www.w3.org/2000/svg" width="{cw}" height="{ch}" viewBox="{vb.minx:.2f} {vb.miny:.2f} {vb.w():.2f} {vb.h():.2f}" preserveAspectRatio="xMidYMid meet">'
      + (f'<rect x="{vb.minx:.2f}" y="{vb.miny:.2f}" width="{vb.w():.2f}" height="{vb.h():.2f}" fill="{AR_BG}"/>' if code in ("AKE","AKH") else "")
      + inner
      + "</svg>"
    )
    (OUT_DIR / f"{code}.svg").write_text(out_svg, encoding="utf-8")
    print(f"Wrote {OUT_DIR / (code + '.svg')}")

  return 0


if __name__ == "__main__":
  raise SystemExit(main())


