/**
 * Color utility functions for generating consistent colors from event names
 */

/**
 * Hash a string using the djb2 algorithm
 * @param str - String to hash
 * @returns Numeric hash value
 */
export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return hash
}

/**
 * Convert HSV color to hex color code
 * @param h - Hue (0-360 degrees)
 * @param s - Saturation (0-1)
 * @param v - Value/Brightness (0-1)
 * @returns Hex color string (e.g., "#a3d5f3")
 */
export function hsvToHex(h: number, s: number, v: number): string {
  // Normalize hue to 0-360 range
  h = h % 360
  if (h < 0) h += 360

  // Clamp saturation and value to 0-1
  s = Math.max(0, Math.min(1, s))
  v = Math.max(0, Math.min(1, v))

  // Convert HSV to RGB
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  // Convert RGB to hex
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0')
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0')
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0')

  return `#${rHex}${gHex}${bHex}`
}

/**
 * Darken a hex color by a specified amount
 * @param hexColor - Hex color string (e.g., "#a3d5f3")
 * @param amount - Percentage to darken (0-1, e.g., 0.15 for 15%)
 * @returns Darkened hex color string
 */
export function darkenColor(hexColor: string, amount: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Darken by reducing RGB values
  const newR = Math.max(0, Math.round(r * (1 - amount)))
  const newG = Math.max(0, Math.round(g * (1 - amount)))
  const newB = Math.max(0, Math.round(b * (1 - amount)))

  // Convert back to hex
  const toHex = (n: number): string => n.toString(16).padStart(2, '0')
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

/**
 * Generate a consistent color for an event name using hash-based color generation
 * @param name - Event name to generate color for
 * @returns Hex color string (e.g., "#a3d5f3")
 */
export function hashNameToColor(name: string): string {
  // Hash the name to get a numeric value
  const hash = hashString(name)

  // Extract hue from hash (0-360 degrees)
  const hue = Math.abs(hash) % 360

  // Fixed saturation and value for consistent, readable colors
  const saturation = 0.7 // 70% saturation
  const value = 0.55 // 55% value for good contrast

  // Convert HSV to hex
  return hsvToHex(hue, saturation, value)
}

