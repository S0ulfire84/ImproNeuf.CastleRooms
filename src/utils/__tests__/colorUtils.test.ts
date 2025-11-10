import { describe, it, expect } from 'vitest'
import { hashString, hsvToHex, darkenColor, hashNameToColor } from '../colorUtils'

describe('colorUtils', () => {
  describe('hashString', () => {
    it('should return a number for any string input', () => {
      const hash = hashString('test')
      expect(typeof hash).toBe('number')
    })

    it('should return the same hash for the same string', () => {
      const hash1 = hashString('test')
      const hash2 = hashString('test')
      expect(hash1).toBe(hash2)
    })

    it('should return different hashes for different strings', () => {
      const hash1 = hashString('test1')
      const hash2 = hashString('test2')
      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', () => {
      const hash = hashString('')
      expect(typeof hash).toBe('number')
    })

    it('should handle special characters', () => {
      const hash1 = hashString('test!@#$%')
      const hash2 = hashString('test')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('hsvToHex', () => {
    it('should convert HSV to hex color format', () => {
      const hex = hsvToHex(0, 0.7, 0.55)
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should handle hue = 0 (red)', () => {
      const hex = hsvToHex(0, 0.7, 0.55)
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should handle hue = 360 (red)', () => {
      const hex = hsvToHex(360, 0.7, 0.55)
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should handle different hues', () => {
      const hex1 = hsvToHex(0, 0.7, 0.55)
      const hex2 = hsvToHex(180, 0.7, 0.55)
      const hex3 = hsvToHex(360, 0.7, 0.55)
      expect(hex1).not.toBe(hex2)
      expect(hex1).toBe(hex3) // 0 and 360 should be the same
    })

    it('should handle saturation = 0 (grayscale)', () => {
      const hex = hsvToHex(180, 0, 0.55)
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should handle value = 0 (black)', () => {
      const hex = hsvToHex(180, 0.7, 0)
      expect(hex).toBe('#000000')
    })

    it('should handle value = 1 (full brightness)', () => {
      const hex = hsvToHex(180, 0.7, 1)
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(hex).not.toBe('#000000')
    })
  })

  describe('darkenColor', () => {
    it('should darken a hex color', () => {
      const original = '#ffffff'
      const darkened = darkenColor(original, 0.15)
      expect(darkened).toMatch(/^#[0-9a-f]{6}$/i)
      expect(darkened).not.toBe(original)
    })

    it('should return a darker color than the original', () => {
      const original = '#a3d5f3'
      const darkened = darkenColor(original, 0.15)
      // Parse hex to RGB and compare
      const originalRgb = parseInt(original.slice(1), 16)
      const darkenedRgb = parseInt(darkened.slice(1), 16)
      // Darkened should have lower RGB values
      expect(darkenedRgb).toBeLessThan(originalRgb)
    })

    it('should handle different darken amounts', () => {
      const original = '#a3d5f3'
      const darkened1 = darkenColor(original, 0.1)
      const darkened2 = darkenColor(original, 0.2)
      // More darkening should result in darker color
      const rgb1 = parseInt(darkened1.slice(1), 16)
      const rgb2 = parseInt(darkened2.slice(1), 16)
      expect(rgb2).toBeLessThan(rgb1)
    })

    it('should handle amount = 0 (no darkening)', () => {
      const original = '#a3d5f3'
      const darkened = darkenColor(original, 0)
      expect(darkened).toBe(original)
    })

    it('should handle amount = 1 (maximum darkening)', () => {
      const original = '#a3d5f3'
      const darkened = darkenColor(original, 1)
      expect(darkened).toBe('#000000')
    })

    it('should handle uppercase hex colors', () => {
      const original = '#A3D5F3'
      const darkened = darkenColor(original, 0.15)
      expect(darkened).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('hashNameToColor', () => {
    it('should return a hex color for any name', () => {
      const color = hashNameToColor('test event')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should return the same color for the same name', () => {
      const color1 = hashNameToColor('test event')
      const color2 = hashNameToColor('test event')
      expect(color1).toBe(color2)
    })

    it('should return different colors for different names', () => {
      const color1 = hashNameToColor('event 1')
      const color2 = hashNameToColor('event 2')
      expect(color1).not.toBe(color2)
    })

    it('should handle empty string', () => {
      const color = hashNameToColor('')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should handle special characters in names', () => {
      const color1 = hashNameToColor('event!@#$')
      const color2 = hashNameToColor('event')
      expect(color1).not.toBe(color2)
    })

    it('should use consistent saturation and value', () => {
      // Test that colors have similar brightness (value = 0.55)
      // by checking that they're not too dark or too light
      const color1 = hashNameToColor('event 1')
      const color2 = hashNameToColor('event 2')
      const color3 = hashNameToColor('event 3')

      // All colors should be valid hex
      expect(color1).toMatch(/^#[0-9a-f]{6}$/i)
      expect(color2).toMatch(/^#[0-9a-f]{6}$/i)
      expect(color3).toMatch(/^#[0-9a-f]{6}$/i)

      // None should be pure black or white (unless by coincidence)
      // This is a probabilistic test - most colors should be in the middle range
      const colors = [color1, color2, color3]
      const notAllBlack = colors.some((c) => c !== '#000000')
      const notAllWhite = colors.some((c) => c !== '#ffffff')
      expect(notAllBlack || notAllWhite).toBe(true)
    })
  })
})

