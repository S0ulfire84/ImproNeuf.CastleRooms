# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-10-event-color-hashing/spec.md

## Technical Requirements

### 1. Color Hashing Utility Function

Create a new utility function in `src/utils/colorUtils.ts` that implements name-based color hashing:

- **Function signature:** `hashNameToColor(name: string): string`
- **Input:** Event name (string)
- **Output:** Hex color code (e.g., "#a3d5f3")
- **Algorithm:**
  1. Hash the event name using a simple string hash function (e.g., djb2 or similar)
  2. Extract a numeric value from the hash (0 to 360 for hue)
  3. Convert HSV to RGB/Hex:
     - Hue: hash value modulo 360 (0-360 degrees)
     - Saturation: Fixed at 70% (0.7) for vibrant but readable colors
     - Value: Fixed at 55% (0.55) for good contrast
  4. Convert HSV to hex color code

### 2. HSV to Hex Conversion

Implement HSV to hex color conversion:

- **Function signature:** `hsvToHex(h: number, s: number, v: number): string`
- **Parameters:**
  - `h`: Hue (0-360 degrees)
  - `s`: Saturation (0-1)
  - `v`: Value/Brightness (0-1)
- **Output:** Hex color string (e.g., "#a3d5f3")
- **Algorithm:** Standard HSV to RGB to Hex conversion

### 3. Calendar Component Updates

Update `src/components/Calendar.vue`:

- **Template changes:**
  - Add dynamic `:style` binding to `.event-item` elements to set `background-color` based on event name
  - Compute color using `hashNameToColor(event.name)` for each event

- **Script changes:**
  - Import the `hashNameToColor` function from `src/utils/colorUtils.ts`
  - Add a computed property or method to get event color: `getEventColor(event: YesPlanEvent): string`

- **Style changes:**
  - Remove or override the fixed `background-color: #2196f3` from `.event-item`
  - Update `.event-item:hover` to use a darker version of the dynamic color (e.g., reduce value by 10-15%)

### 4. Color Darkening for Hover State

Implement a utility function to darken colors for hover states:

- **Function signature:** `darkenColor(hexColor: string, amount: number): string`
- **Parameters:**
  - `hexColor`: Hex color string
  - `amount`: Percentage to darken (0-1, e.g., 0.15 for 15%)
- **Output:** Darkened hex color string
- **Algorithm:** Convert hex to RGB, reduce RGB values by amount, convert back to hex

### 5. String Hash Function

Implement a simple string hash function:

- **Function signature:** `hashString(str: string): number`
- **Input:** String to hash
- **Output:** Numeric hash value
- **Algorithm:** Use djb2 hash algorithm or similar simple hash function

## Implementation Details

### File Structure

```
src/
  utils/
    colorUtils.ts (new file)
      - hashString(str: string): number
      - hsvToHex(h: number, s: number, v: number): string
      - darkenColor(hexColor: string, amount: number): string
      - hashNameToColor(name: string): string
  components/
    Calendar.vue (modified)
      - Import hashNameToColor and darkenColor
      - Add getEventColor method
      - Update template with dynamic styling
```

### Color Constants

- **Saturation:** 0.7 (70%) - provides vibrant but readable colors
- **Value:** 0.55 (55%) - provides good contrast against white text
- **Hue range:** 0-360 degrees (full spectrum)
- **Darken amount for hover:** 0.15 (15% darker)

### Example Implementation

```typescript
// Example hash function (djb2)
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash;
}

// Example usage
const eventName = "Meeting Room A";
const color = hashNameToColor(eventName); // Returns something like "#a3d5f3"
```

### Testing Considerations

- Test that identical event names produce identical colors
- Test that different event names produce different colors (with high probability)
- Test HSV to hex conversion with edge cases (hue = 0, 360, etc.)
- Test color darkening function
- Verify color readability/contrast (visual testing recommended)

## External Dependencies

No new external dependencies are required. The implementation will use:
- Native JavaScript/TypeScript for hash functions
- Native JavaScript/TypeScript for color space conversions
- Vue 3's reactive system (already in use)

