# API Response Structure Analysis

## Overview

This document analyzes the YesPlan API response structures to determine if contacts and resources are embedded in event responses, which would allow us to eliminate separate relationship API calls.

## Analysis Date

2025-11-09

## Endpoints Analyzed

### 1. `/api/event/{id}` (Single Event Details)

**Status:** Logging code added (Task 2.1)

**Expected Structure:**
- Event details (id, name, start, end, status, etc.)
- May include embedded `contacts` array or `contact_ids` array
- May include embedded `resources` array or `resource_ids` array

**Logging Location:**
- `src/services/yesplan-api.ts` → `fetchEventDetails()` method
- Logs in development mode only (`import.meta.env.DEV`)
- Console output: `[API Analysis] /api/event/{id} response structure:`

**Findings from Sample Data:**
- Sample data from `/api/events` (plural) shows events do NOT have embedded `contacts` or `resources` fields
- Events only have embedded `locations` array
- **Note:** `/api/event/{id}` (singular) may have different structure than `/api/events` (plural)

**Action Required:**
- Run application and open event details modal
- Check browser console for logged response structure
- Verify if contacts/resources are embedded in single event response

### 2. `/api/contact/{id}/events` (Events for Contact)

**Status:** Logging code added (Task 2.2)

**Expected Structure:**
- Array of events associated with the contact
- Events may include embedded contact information
- Events may include embedded resource information

**Logging Location:**
- `src/services/yesplan-api.ts` → `inspectContactEventsResponse()` method (temporary)
- Logs in development mode only (`import.meta.env.DEV`)
- Console output: `[API Analysis] /api/contact/{id}/events response structure:`

**Findings from Sample Data:**
- No sample data available for this endpoint
- Need to verify actual response structure when implemented

**Action Required:**
- Implement `fetchEventsForContact()` method (Task 3)
- Run application with booker selection
- Check browser console for logged response structure
- Verify if contacts/resources are embedded in events from this endpoint

## Key Questions to Answer

1. **Does `/api/event/{id}` include embedded contacts?**
   - If YES: Can eliminate `/api/event/{id}/contacts` calls
   - If NO: Must keep separate contacts endpoint

2. **Does `/api/event/{id}` include embedded resources?**
   - If YES: Can eliminate `/api/event/{id}/resources` calls
   - If NO: Must keep separate resources endpoint

3. **Does `/api/contact/{id}/events` include embedded contact info in events?**
   - If YES: Can simplify filtering logic
   - If NO: May need additional filtering

4. **Does `/api/contact/{id}/events` include embedded resource info in events?**
   - If YES: Can eliminate separate resource calls for event list
   - If NO: Must fetch resources separately when needed

## Current Implementation Status

### Logging Code Added

✅ **Task 2.1:** Added logging to `fetchEventDetails()` method
- Logs response structure when event details are fetched
- Checks for `contacts`, `contact_ids`, `resources`, `resource_ids` fields
- Outputs sample response data (first 1000 chars)

✅ **Task 2.2:** Added temporary `inspectContactEventsResponse()` method
- Logs response structure when contact events are fetched
- Analyzes first event in response for embedded data
- Will be replaced by `fetchEventsForContact()` in Task 3

### Next Steps

1. **Run Application:**
   - Start development server
   - Open event details modal for any event
   - Check browser console for `/api/event/{id}` analysis

2. **Test Contact Events Endpoint:**
   - Implement `fetchEventsForContact()` (Task 3)
   - Select a booker (e.g., "Impro Neuf")
   - Check browser console for `/api/contact/{id}/events` analysis

3. **Document Findings:**
   - Update this document with actual response structures
   - Update technical spec with findings (Task 2.5)
   - Determine if separate relationship calls can be eliminated (Task 2.4)

## Temporary Code Notes

The logging code added in Tasks 2.1 and 2.2 is temporary and should be:
- Removed after analysis is complete, OR
- Made conditional via feature flag, OR
- Kept for debugging purposes (only in development mode)

## Recommendations

Based on typical REST API patterns and the sample data structure:

**Expected Outcome:**
- `/api/event/{id}` likely does NOT include embedded contacts/resources
- `/api/contact/{id}/events` likely does NOT include embedded contact/resource data in events
- Separate relationship endpoints will likely still be needed

**Optimization Strategy:**
- Use `/api/contact/{id}/events` to fetch only relevant events (major optimization)
- Keep separate calls for contacts/resources but batch them efficiently
- Use `Promise.all()` to fetch details, resources, and contacts in parallel when event modal opens

