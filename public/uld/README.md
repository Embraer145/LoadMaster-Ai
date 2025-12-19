### ULD Images

Place ULD reference images in this folder so the app can load them offline.

## Naming convention (recommended)
- Use **uppercase** filenames by code.
- Supported formats (in priority order): **.svg**, **.png**, **.webp**, **.jpg/.jpeg**

Examples:
- `AKE.png` (LD3 container)
- `AKH.svg` (LD1 container)
- `PMC.webp` (96×125 pallet)
- `P6P.png`
- `Q7.png` (main deck contour)
- `P.png` (lower deck contour)

## Current code mappings in the UI
The app currently uses simplified ULD codes. These map automatically:
- `LD3` → `AKE`
- `LD1` → `AKH`

Everything else is used as-is (e.g. `PMC` stays `PMC`).


