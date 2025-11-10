# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-09-calendar-event-display/spec.md

## Technical Requirements

### 1. Event Normalization Verification

**Current Issue:**
The API returns events with `starttime` and `endtime` fields (e.g., `"2024-05-15T17:30:00+02:00"`), and the `normalizeEvent` function should convert these to `start` and `end` Date objects. Need to verify this conversion is working correctly.

**Implementation:**
- Verify `normalizeEvent` in `src/services/yesplan-api.ts` correctly extracts `starttime`/`endtime` or `defaultschedulestart`/`defaultscheduleend`
- Ensure Date parsing handles timezone offsets correctly
- Add validation to ensure normalized events have valid `start` and `end` Date objects
- Add debug logging to show before/after normalization

**Files to Modify:**
- `src/services/yesplan-api.ts` - `normalizeEvent` method

### 2. Filtering Logic Fix

**Current Issue:**
The `filtered_events` computed property in `App.vue` depends on `event_contacts_map`, which is only populated after `fetch_contacts_for_visible_events` completes. If contacts haven't been fetched yet, `filtered_events` will be empty, causing no events to display.

**Implementation:**
- Modify `filtered_events` computed property to show all events initially when `event_contacts_map` is empty
- Once contacts are loaded, re-filter events by booker
- Ensure the filtering logic handles the case where contacts are still loading
- Add a loading state indicator if needed

**Files to Modify:**
- `src/App.vue` - `filtered_events` computed property
- `src/utils/filterUtils.ts` - `filter_events_by_booker` function (if needed)

**Code Changes:**
```typescript
// Current implementation filters immediately, causing empty results
const filtered_events = computed(() => {
  if (!selected_booker.value) {
    return []
  }
  return filter_events_by_booker(events.value, selected_booker.value, event_contacts_map.value)
})

// Should be modified to show events initially, then filter once contacts are available
const filtered_events = computed(() => {
  if (!selected_booker.value) {
    return []
  }
  
  // If contacts haven't been loaded yet, show all events
  // This allows events to display immediately while contacts load in background
  if (Object.keys(event_contacts_map.value).length === 0 && events.value.length > 0) {
    return events.value
  }
  
  // Once contacts are loaded, filter by booker
  return filter_events_by_booker(events.value, selected_booker.value, event_contacts_map.value)
})
```

### 3. Date Range Filtering

**Current Issue:**
Events may be fetched for a date range (current month ± 2 months), but the calendar component filters events by the current month. Need to ensure this filtering works correctly.

**Implementation:**
- Verify `filtered_by_month` computed property in `Calendar.vue` correctly filters events
- Ensure date comparisons account for timezone issues
- Verify events spanning multiple months are handled correctly
- Add debug logging to show which events are filtered out and why

**Files to Modify:**
- `src/components/Calendar.vue` - `filtered_by_month` computed property

### 4. Calendar Component Event Rendering

**Current Issue:**
The Calendar component receives `filtered_events` as a prop and should display them. Need to verify the event-to-day mapping logic works correctly.

**Implementation:**
- Verify `calendar_days` computed property correctly maps events to calendar days
- Ensure events spanning multiple days are displayed on all relevant days
- Verify event time formatting displays correctly
- Add debug logging to show events being assigned to calendar days

**Files to Modify:**
- `src/components/Calendar.vue` - `calendar_days` computed property

### 5. Debug Logging

**Implementation:**
Add comprehensive debug logging throughout the event data pipeline:

1. **API Fetch Stage:**
   - Log raw API response structure
   - Log number of events fetched
   - Log date range used for fetching

2. **Normalization Stage:**
   - Log before/after normalization for sample events
   - Log any normalization errors or warnings
   - Log final normalized event count

3. **Filtering Stage:**
   - Log events before filtering
   - Log events after booker filtering
   - Log events after date filtering
   - Log final event count passed to calendar

4. **Calendar Rendering Stage:**
   - Log events received by calendar component
   - Log events filtered by month
   - Log events assigned to each calendar day
   - Log final rendered event count

**Files to Modify:**
- `src/services/yesplan-api.ts` - Add logging in `fetchEvents` and `normalizeEvent`
- `src/App.vue` - Add logging in `fetch_data` and `filtered_events`
- `src/components/Calendar.vue` - Add logging in `filtered_by_month` and `calendar_days`

**Logging Format:**
```typescript
if (import.meta.env.DEV) {
  console.log('[CalendarEventDisplay] Stage: Description', {
    // Relevant data
  })
}
```

## Root Cause Analysis

Based on the code review, the most likely root causes are:

1. **Primary Issue:** `filtered_events` depends on `event_contacts_map` which is empty initially, causing no events to display until contacts are fetched. This creates a race condition where events are fetched but not displayed.

2. **Secondary Issue:** Event normalization may not be handling all API response formats correctly, especially if some events have `null` values for `defaultschedulestart`/`defaultscheduleend`.

3. **Tertiary Issue:** Date filtering logic may be excluding events due to timezone or date comparison issues.

## Testing Strategy

1. **Unit Tests:**
   - Test `normalizeEvent` with various API response formats
   - Test `filter_events_by_booker` with empty and populated contact maps
   - Test date filtering logic with edge cases

2. **Integration Tests:**
   - Test full event flow from API fetch to calendar display
   - Test with events that have missing/null date fields
   - Test with events spanning multiple days/months

3. **Manual Testing:**
   - Verify events appear immediately after API fetch
   - Verify events are filtered correctly once contacts load
   - Verify events appear on correct calendar dates
   - Verify events spanning multiple days display correctly

## External Dependencies

No new external dependencies are required for this fix. All necessary libraries are already in use:
- `date-fns` - Already used for date manipulation
- Vue 3 - Already used as the framework

