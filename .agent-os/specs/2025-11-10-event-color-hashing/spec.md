# Spec Requirements Document

> Spec: Event Color Hashing
> Created: 2025-11-10

## Overview

Implement color-coded event display on the calendar where each event is assigned a unique color based on its name using a hash function. Events with the same name will consistently receive the same color, and colors will be generated using HSV color space to ensure readability by only varying the hue while maintaining consistent saturation and value.

## User Stories

### Color-Coded Event Display

As a CastleRooms user, I want to see events displayed in different colors based on their names, so that I can quickly visually distinguish between different types of events and identify recurring events with the same name at a glance.

When viewing the calendar, each event will be displayed with a background color that is deterministically generated from its name. Events with identical names will always have the same color, making it easy to spot patterns and recurring bookings. The color generation uses HSV color space to ensure all colors are readable by maintaining consistent saturation and value while only varying the hue.

## Spec Scope

1. **Name-Based Color Hashing Function** - Create a utility function that takes an event name as input and returns a consistent color (in hex format) by hashing the name and converting the hash to an HSV color with fixed saturation and value.

2. **Dynamic Event Styling** - Update the Calendar component to apply dynamic background colors to event items based on their names using the color hashing function.

3. **Readable Color Generation** - Ensure all generated colors maintain sufficient contrast and readability by using HSV color space with fixed saturation (e.g., 70-80%) and value (e.g., 50-60%) while only varying the hue (0-360 degrees).

4. **Hover State Consistency** - Maintain hover state styling that darkens the event color while preserving the color relationship to the event name.

## Out of Scope

- User customization of event colors (no color picker or manual color assignment)
- Color themes or dark mode color adjustments (standard colors only)
- Color accessibility testing beyond basic readability (WCAG compliance not required)
- Caching or persistence of color mappings (colors are computed on-the-fly)

## Expected Deliverable

1. Events on the calendar display with different background colors based on their names, with identical event names always showing the same color.

2. All event colors are readable with sufficient contrast, generated using HSV color space with consistent saturation and value.

3. The color hashing function is implemented as a reusable utility that can be tested independently and used consistently across the application.

