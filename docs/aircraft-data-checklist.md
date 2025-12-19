# Aircraft Data Checklist (for traceable W&B / FAA-style acceptance)

This project currently uses **sample/simplified** aircraft data. To move toward a traceable implementation (where every output can be justified with source tables), provide the following **per aircraft type + configuration/STC**.

## 1) Configuration control (identity)
- **Aircraft type / variant** (e.g., B747-400F) and any **STC / freighter conversion** details
- **Operator configuration** if applicable (mod list or confirmation “standard”)
- Data revision control:
  - **Document name**, **revision/date**, **page/table references**
  - A single “configuration id” string we can display in-app (e.g., `B747-400F STC-XXXX Rev 12`)

## 2) Datum / MAC / reference system
- **Datum definition** (station reference)
- **LEMAC** (station)
- **MAC length / reference chord**
- If your process uses **Index units**, provide:
  - **Index definition** and conversion between **moment ↔ index**
  - Any rounding rules

## 3) Basic weight (BEW/OEW) and moment/index
- **Basic Empty Weight / Operating Empty Weight**
- **Basic moment** (or **index**) at BEW/OEW
- Any required corrections (equipment changes, seasonal kit, etc.)

## 4) Structural weight limits (all must be source-backed)
- **MZFW**
- **MTOW**
- **MLW**
- Any conditional limits (performance-limited weights if used)

## 5) Cargo positions / holds / compartments
For each position (e.g., `A1`, `CL`, `11P`, etc.):
- **Max weight**
- **Arm (station)** or **moment/index factor**
- **Deck / compartment**
- Any **position restrictions** (outsize only, access required, etc.)

For holds/compartments:
- **Compartment max weight** (and any zone limits)
- Any **floor loading limits** or structural distribution limits

## 6) ULD / container compatibility + door constraints
- Door dimensions/limitations per door:
  - **Nose door**
  - **Main deck side cargo door**
  - **Lower deck forward door**
  - **Lower deck aft door**
  - **Bulk door** (loose cargo)
- Supported ULD types for each deck/position:
  - e.g., `PMC/P1P`, `P6P`, `LD1`, `LD3`, bulk/loose

## 7) CG envelopes (tables/curves)
Provide **weight vs forward/aft CG limit** for:
- **Zero Fuel** (if defined)
- **Takeoff**
- **Landing**

Include:
- Ranges, breakpoints, curve tables
- Notes for special cases (trim restrictions, etc.)

## 8) Fuel / CG shift model (no “fuel slosh” required; tables are)
Provide the approved method your W&B process uses:
- Tank group arms or **fuel moment/index tables**
- Fuel distribution assumptions (tank order / burn sequence)
- Any unusable/trapped fuel assumptions

## 9) Operator rules (optional but typical)
- Lateral imbalance limits (if you want the app to enforce)
- DG rules / segregation tables (if you want the app to enforce)
- Special loads: live animals, dry ice, perishables zones, etc.

## 10) Verification pack (“golden cases”)
To prove correctness and “why it says what it says,” provide:
- A set of **worked examples** (load sheets) with:
  - inputs (positions, weights, fuel)
  - expected outputs (ZFW/TOW/LW, CG%MAC, in/out of limits)
  - tolerances and rounding rules

---

### Recommended delivery format
Any of these works; we can adapt:
- **PDF tables** + a mapping list (“table X becomes field Y”)
- **CSV** for position tables and envelope tables
- **JSON** once we define our import schema

---

## Appendix: Visualization / UI backlog (ops usability)
- **ULD/Contour visualization mode**: color-code ULDs by physical family/contour (e.g., PMC/P6P/LD3/LD1) with a neutral brown palette; keep handling class (DG/PER/PRI/MAIL) visible as small badges.
- **Contour catalog + door-fit constraints (future)**: define a real ULD contour catalog per operator/aircraft and derive door compatibility from door dimensions + contour geometry (drives both auto-load rules and 2D/3D visualization).


