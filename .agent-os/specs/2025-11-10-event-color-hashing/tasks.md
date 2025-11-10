# Spec Tasks

## Tasks

- [x] 1. Create color utility functions
  - [x] 1.1 Write tests for colorUtils functions (hashString, hsvToHex, darkenColor, hashNameToColor)
  - [x] 1.2 Implement hashString function using djb2 algorithm
  - [x] 1.3 Implement hsvToHex function for HSV to hex color conversion
  - [x] 1.4 Implement darkenColor function for hover state styling
  - [x] 1.5 Implement hashNameToColor function that combines hashing and HSV conversion
  - [x] 1.6 Verify all colorUtils tests pass

- [x] 2. Update Calendar component to use color hashing
  - [x] 2.1 Write tests for Calendar component color integration
  - [x] 2.2 Import hashNameToColor and darkenColor from colorUtils
  - [x] 2.3 Add getEventColor method to Calendar component
  - [x] 2.4 Update template to apply dynamic background-color to event items
  - [x] 2.5 Update hover state styling to use darkened event color
  - [x] 2.6 Remove fixed background-color from .event-item CSS
  - [x] 2.7 Verify all Calendar tests pass

