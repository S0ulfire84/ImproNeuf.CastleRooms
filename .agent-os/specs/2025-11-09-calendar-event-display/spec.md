# Spec Requirements Document

> Spec: Calendar Event Display Fix
> Created: 2025-11-09

## Overview

Fix the calendar view to properly display events that are being fetched from the YesPlan API. Currently, events are being fetched successfully (as evidenced by API calls returning event data), but they are not appearing in the calendar view. This spec will identify and fix the root cause preventing events from displaying, ensuring all fetched events are properly rendered on the calendar.

## User Stories

### As an Impro Neuf Team Member

I want to see all relevant events displayed on the calendar when I open the application, so that I can quickly view room bookings and availability without needing to investigate why events are missing.

**Workflow:**
1. User opens the application
2. Application fetches events from the YesPlan API
3. Events are properly normalized and stored
4. Events are filtered by selected booker (if applicable)
5. Events are displayed on the calendar view for the current month
6. User can see all events that match their selected booker filter

### As a Developer

I want the calendar to display events correctly regardless of the loading state of contacts, so that users see events immediately while contact data loads in the background.

**Workflow:**
1. Application fetches events from API
2. Events are normalized from API response format (starttime/endtime → start/end)
3. Events are displayed immediately, even if contact filtering hasn't completed yet
4. Once contacts are loaded, events are re-filtered by booker
5. Calendar updates to show only events matching the selected booker

## Spec Scope

1. **Event Normalization Verification** - Ensure events from the API response are properly normalized, converting `starttime`/`endtime` fields to `start`/`end` Date objects that the calendar component expects.

2. **Filtering Logic Fix** - Fix the booker filtering logic to display events even when contacts haven't been fetched yet. Events should show initially, then be filtered once contact data is available.

3. **Date Range Filtering** - Ensure events are properly filtered by date range to show only events visible in the current calendar month view.

4. **Calendar Component Event Rendering** - Verify that the Calendar component correctly receives and displays the filtered events, handling edge cases like events spanning multiple days or months.

5. **Debug Logging** - Add appropriate debug logging to track event flow from API fetch → normalization → filtering → calendar display to identify any breakpoints in the data pipeline.

## Out of Scope

- Changes to the API fetching strategy (already optimized in previous spec)
- Modifying the YesPlan API integration
- Adding new filtering features
- Changing the calendar UI/UX design
- Performance optimizations beyond fixing the display issue

## Expected Deliverable

1. Events fetched from the API are displayed on the calendar view immediately after loading
2. Events are properly positioned on the correct calendar dates based on their start/end times
3. Events are filtered by selected booker once contact data is available, with events showing initially before filtering completes
4. Events spanning multiple days are displayed correctly across all relevant calendar days
5. Debug logging shows the complete event data flow from API to calendar display
6. All events in the API response (that match date range and booker filter) are visible in the calendar

