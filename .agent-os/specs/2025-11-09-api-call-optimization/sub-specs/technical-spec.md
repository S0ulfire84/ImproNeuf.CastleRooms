# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-09-api-call-optimization/spec.md

## Technical Requirements

### 1. Contact ID Resolution Service

**Requirement:** Implement a service method to find and cache contact IDs for bookers.

**Implementation:**

- Add `findContactByName(name: string): Promise<string | null>` method to `YesPlanApiService`
- Use `/api/contacts/{query}` endpoint to search for contacts by name
- Cache contact IDs in memory (session-based) to avoid repeated lookups
- Handle cases where contact is not found gracefully

**API Endpoint:**

```
GET /api/contacts/{query}?api_key={key}
```

**Example:**

```typescript
async findContactByName(name: string): Promise<string | null> {
  // Check cache first
  if (this.contactCache[name]) {
    return this.contactCache[name]
  }

  // Search contacts
  const response = await this.request<YesPlanResponse<unknown>>(`/contacts/${encodeURIComponent(name)}`)
  const contacts = response.data || []

  // Find exact match
  const contact = contacts.find((c: any) => c.name === name)
  if (contact) {
    this.contactCache[name] = contact.id
    return contact.id
  }

  return null
}
```

### 2. Contact-Based Event Fetching

**Requirement:** Replace `fetchEvents()` with `fetchEventsForContact(contactId: string)` that uses the relationship endpoint.

**Implementation:**

- Add `fetchEventsForContact(contactId: string): Promise<YesPlanEvent[]>` method
- Use `/api/contact/{id}/events` endpoint instead of `/api/events`
- Maintain pagination support
- Handle cases where contact has no events

**API Endpoint:**

```
GET /api/contact/{id}/events?api_key={key}&book={book}&page={page}
```

**Benefits:**

- Only fetches events for the selected booker (e.g., Impro Neuf)
- Eliminates need to fetch all events and filter client-side
- Significantly reduces data transfer and processing time

### 3. Event Response Structure Analysis

**Requirement:** Analyze the YesPlan API event response to determine if contacts and resources are embedded.

**Investigation Steps:**

1. Check the response from `/api/event/{id}` to see if it includes:
   - `contacts` array or `contact_ids` array
   - `resources` array or `resource_ids` array
   - Any embedded relationship data

2. Check the response from `/api/contact/{id}/events` to see if events include:
   - Embedded contact information
   - Embedded resource information

**Expected Outcomes:**

- If data is embedded: Eliminate separate calls to `/api/event/{id}/contacts` and `/api/event/{id}/resources`
- If data is not embedded: Keep minimal calls but batch them efficiently

**Implementation Status:**
✅ **Logging code added:**

- `fetchEventDetails()` now logs response structure in development mode (Task 2.1)
- `inspectContactEventsResponse()` temporary method added for analysis (Task 2.2)
- Both methods log to console with `[API Analysis]` prefix

**Findings (Preliminary):**

- Sample data from `/api/events` (plural) shows events do NOT have embedded `contacts` or `resources` fields
- Events only have embedded `locations` array
- **Note:** `/api/event/{id}` (singular) may have different structure - needs verification
- **Note:** `/api/contact/{id}/events` structure needs verification when implemented

**Next Steps:**

- Run application and check browser console for logged response structures
- Document actual response structure in `response-structure-analysis.md`
- Update data fetching logic based on findings

**Documentation:**

- See `response-structure-analysis.md` for detailed analysis and findings

### 4. Lazy Loading for Event Details

**Requirement:** Load event details, contacts, and resources only when the booking details modal is opened.

**Current Problem:**

- Application pre-fetches contacts for all visible events in the current month
- This results in N API calls for N events

**New Strategy:**

- Remove pre-fetching of contacts for visible events
- Only fetch event details when user clicks on an event
- Use `Promise.all()` to fetch details, resources, and contacts in parallel (if not embedded)

**Implementation Changes:**

- Remove `fetch_contacts_for_month()` and `fetch_contacts_for_visible_events()` from `App.vue`
- Remove watchers that trigger contact fetching on month changes
- Update `BookingDetailsModal.vue` to fetch all required data when opened
- Update `filter_events_by_booker()` to work without pre-fetched contacts (if contacts are embedded in events)

### 5. Optimized Event Filtering

**Requirement:** Update filtering logic to work with the new data fetching strategy.

**Current Flow:**

1. Fetch all events
2. Fetch contacts for each event
3. Filter events by booker name in contacts

**New Flow (Option A - If contacts embedded):**

1. Fetch events for contact ID
2. Events already filtered by contact
3. No additional filtering needed

**New Flow (Option B - If contacts not embedded):**

1. Fetch events for contact ID
2. Events already filtered by contact relationship
3. Minimal additional filtering if needed

**Implementation:**

- Update `App.vue` to use `fetchEventsForContact()` instead of `fetchEvents()`
- Simplify `filtered_events` computed property
- Remove dependency on `event_contacts_map` if contacts are embedded

### 6. Error Handling and Edge Cases

**Requirement:** Handle cases where contact is not found, contact has no events, or API returns unexpected structure.

**Implementation:**

- Add error handling for contact not found
- Handle empty event lists gracefully
- Add fallback behavior if relationship endpoint doesn't work as expected
- Maintain backward compatibility during transition

## API Call Flow Comparison

### Current Flow (Inefficient):

```
1. GET /api/events (with pagination) - Fetch ALL events
   → Returns 100+ events

2. For each visible event in current month:
   GET /api/event/{id}/contacts
   → N calls for N events (e.g., 30 calls for 30 events)

3. When event selected:
   GET /api/event/{id}
   GET /api/event/{id}/resources
   GET /api/event/{id}/contacts
   → 3 calls per event

Total: 1 + N + 3 = 1 + 30 + 3 = 34+ calls for initial load
```

### Optimized Flow (Target):

```
1. GET /api/contacts/Impro Neuf - Find contact ID
   → Returns contact ID (cached after first call)

2. GET /api/contact/{id}/events (with pagination) - Fetch events for contact
   → Returns only Impro Neuf events (e.g., 10 events)

3. When event selected:
   GET /api/event/{id} (may include embedded contacts/resources)
   → 1 call, or 2-3 if not embedded

Total: 1 + 1 + 1-3 = 3-5 calls for initial load
```

## Implementation Steps

1. **Phase 1: Contact Resolution**
   - Implement `findContactByName()` method
   - Add contact caching
   - Test with "Impro Neuf" and "Oslo Impro Festival"

2. **Phase 2: Event Fetching Optimization**
   - Implement `fetchEventsForContact()` method
   - Update `App.vue` to use new method
   - Test event fetching for different contacts

3. **Phase 3: Response Structure Analysis**
   - Add logging to inspect API responses
   - Document actual response structure
   - Determine if contacts/resources are embedded

4. **Phase 4: Lazy Loading**
   - Remove pre-fetching of contacts
   - Update `BookingDetailsModal` to fetch on demand
   - Update filtering logic

5. **Phase 5: Testing and Refinement**
   - Test with different bookers
   - Verify all functionality still works
   - Measure API call reduction
   - Optimize further based on findings

## Performance Targets

- **Initial Load:** < 10 API calls (currently 30+)
- **Month Navigation:** 0 additional calls (currently N calls for N events)
- **Event Details:** 1-3 calls (currently 3 calls)
- **Booker Change:** 1-2 calls (currently 1 + N calls)

## External Dependencies

No new external dependencies required. All optimizations use existing YesPlan API endpoints as documented in `docs/yesplan-api.md`.
