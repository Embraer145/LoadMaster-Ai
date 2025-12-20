# Aircraft Variant Strategy (F vs BCF vs BDSF)

## What Are These Variants?

### **B747-400F** (Factory Freighter)
- Built from the factory as a cargo aircraft
- **Lightest** of the variants
- Clean-sheet freighter design

### **B747-400BCF** (Boeing Converted Freighter)
- Started life as a **passenger aircraft**
- Converted to cargo configuration by Boeing
- **Heavier OEW** due to:
  - Reinforced cargo floor
  - Removed passenger systems (galleys, lavatories, seats)
  - Added cargo handling systems
  - Structural reinforcements for cargo door

### **B747-400BDSF** (Boeing Derived Special Freighter)
- Another Boeing conversion program
- Similar to BCF but different conversion process/timeframe
- May have different weights/limits depending on conversion package

---

## Why They Matter for Load Planning

### **Different Operating Weights:**
```
Aircraft Type    Typical OEW      Notes
──────────────────────────────────────────────────────────────
B747-400F        ~165,000 kg     Lightest (factory freighter)
B747-400BCF      ~175,000 kg     Heavier (conversion adds weight)
B747-400BDSF     ~173,000 kg     Similar to BCF
```

### **Same Cargo Positions:**
- ✅ All three variants have the **same cargo bay layout**
- ✅ Same position IDs (A1, B1, CL, etc.)
- ✅ Same physical cargo positions
- ✅ Same door locations

### **Different Limits:**
- ❌ Different OEW (Operating Empty Weight)
- ❌ Potentially different MZFW (depends on STC/conversion)
- ⚠️ Same MTOW/MLW (usually, but check per aircraft)
- ⚠️ CG limits may vary slightly

---

## Current Implementation

### **Prototype/Sample Data Mode:**
All three variants currently use the **same template**:
```typescript
'B747-400F': B747_400F_ALPHABETIC_CONFIG,
'B747-400BCF': B747_400F_ALPHABETIC_CONFIG,  // Alias
'B747-400BDSF': B747_400F_ALPHABETIC_CONFIG, // Alias
```

**This is fine for prototype because:**
- We're using sample/placeholder weights anyway
- Focus is on UI/workflow, not exact weights
- Per-registration overrides can fix individual aircraft

### **Production Mode (Future):**
When you have real aircraft data:

1. **Keep using per-registration overrides:**
   - N258SN (BCF) → Set OEW to actual weigh report value
   - N344KD (F) → Set OEW to actual weigh report value
   - Each tail gets its own precise OEW from weigh report

2. **OR create variant-specific templates:**
   ```typescript
   'B747-400F': B747_400F_ALPHABETIC_CONFIG,      // OEW: 165,000
   'B747-400BCF': B747_400BCF_ALPHABETIC_CONFIG,  // OEW: 175,000
   'B747-400BDSF': B747_400BDSF_ALPHABETIC_CONFIG,// OEW: 173,000
   ```

---

## Recommendation

### **For WGA (Current):**

**Option A: Per-Registration Approach (RECOMMENDED)**
- Keep using `B747-400F` as the base type for all WGA 747s
- Set each tail's specific OEW in Airframe Layouts
- This is more flexible and matches how airlines operate
- Each aircraft is re-weighed annually anyway

```
N258SN (BCF) → Type: B747-400F, OEW Override: 175,240 kg (from weigh report)
N344KD (F)   → Type: B747-400F, OEW Override: 165,180 kg (from weigh report)
```

**Option B: Variant-Specific Templates**
- Create separate templates for F, BCF, BDSF
- Use when you have typical values for each variant class
- More work to maintain

---

## Why BCF/BDSF Don't Show in Template Editor

They're **aliases** (pointers), not master templates. Here's the logic:

1. **Master Templates** (4 editable):
   - B747-400F-ALPHABETIC
   - B747-400F-NUMERIC
   - B747-400F-UPS
   - B747-400F-CUSTOM

2. **Aliases** (point to master templates):
   - B747-400F → Points to ALPHABETIC
   - B747-400BCF → Points to ALPHABETIC (via B747-400F)
   - B747-400BDSF → Points to ALPHABETIC (via B747-400F)

**Why?** Because BCF and BDSF use the **same position layout** as the factory freighter. The only differences are weights/limits, which are handled per-registration.

---

## Summary

**Current System:**
- ✅ 4 clear templates in Template Editor
- ✅ BCF/BDSF supported (use same positions as F)
- ✅ Per-registration OEW overrides handle weight differences
- ✅ No confusion about what's editable vs what's an alias

**Future Enhancement (if needed):**
- Create B747-400BCF-ALPHABETIC template with typical BCF OEW
- Create B747-400BDSF-ALPHABETIC template with typical BDSF OEW
- But honestly, per-registration overrides are cleaner!

---

## Bottom Line

**You don't need separate BCF/BDSF templates** because:
1. Cargo positions are identical
2. OEW differences are handled per-registration
3. Every aircraft gets re-weighed annually anyway
4. Keeps system simpler and more maintainable

**BCF/BDSF variants ARE supported** - they just use the alphabetic template as a starting point, then each tail gets its own precise OEW from the weigh report! ✈️

