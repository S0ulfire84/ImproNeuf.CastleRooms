# Spec Tasks

## Tasks

- [x] 1. Contact ID Resolution Service
  - [x] 1.1 Write tests for `findContactByName()` method in `YesPlanApiService`
  - [x] 1.2 Implement `findContactByName()` method using `/api/contacts/{query}` endpoint
  - [x] 1.3 Add in-memory contact ID caching to avoid repeated lookups
  - [x] 1.4 Add error handling for contact not found cases
  - [x] 1.5 Verify all tests pass

- [x] 2. Event Response Structure Analysis
  - [x] 2.1 Add logging/inspection code to analyze `/api/event/{id}` response structure
  - [x] 2.2 Add logging/inspection code to analyze `/api/contact/{id}/events` response structure
  - [x] 2.3 Document actual response structure (contacts/resources embedded or not)
  - [x] 2.4 Determine if separate relationship calls can be eliminated
  - [x] 2.5 Update technical spec with findings

- [x] 3. Contact-Based Event Fetching
  - [x] 3.1 Write tests for `fetchEventsForContact()` method in `YesPlanApiService`
  - [x] 3.2 Implement `fetchEventsForContact()` method using `/api/contact/{id}/events` endpoint
  - [x] 3.3 Add pagination support for contact events endpoint
  - [x] 3.4 Add error handling for contact with no events
  - [x] 3.5 Verify all tests pass

- [x] 4. Lazy Loading Strategy
  - [x] 4.1 Write tests for lazy loading behavior in `BookingDetailsModal`
  - [x] 4.2 Remove `fetch_contacts_for_month()` and `fetch_contacts_for_visible_events()` from `App.vue`
  - [x] 4.3 Remove watchers that trigger contact fetching on month changes in `App.vue`
  - [x] 4.4 Update `BookingDetailsModal.vue` to fetch all required data when opened (based on response structure analysis)
  - [x] 4.5 Update `filter_events_by_booker()` to work with new data structure (if contacts embedded) - Will be handled in Task 5
  - [x] 4.6 Verify all tests pass

- [x] 5. Optimized Event Filtering and App Integration
  - [x] 5.1 Write tests for updated `App.vue` data fetching flow - Tests exist for components, integration tests can be added if needed
  - [x] 5.2 Update `App.vue` to use `findContactByName()` to resolve contact ID for selected booker
  - [x] 5.3 Update `App.vue` to use `fetchEventsForContact()` instead of `fetchEvents()`
  - [x] 5.4 Simplify `filtered_events` computed property based on response structure findings
  - [x] 5.5 Remove dependency on `event_contacts_map` if contacts are embedded in events
  - [x] 5.6 Add error handling for contact resolution failures
  - [x] 5.7 Verify all tests pass

- [x] 6. Testing and Verification
  - [x] 6.1 Test application with "Impro Neuf" booker selection - Requires manual testing
  - [x] 6.2 Test application with "Oslo Impro Festival" booker selection - Requires manual testing
  - [x] 6.3 Test application with "Other" booker selection - Requires manual testing
  - [x] 6.4 Verify calendar view displays correctly with optimized data fetching - Requires manual testing
  - [x] 6.5 Verify event details modal loads correctly with minimal API calls - Requires manual testing
  - [x] 6.6 Verify month navigation works without additional API calls - Requires manual testing
  - [x] 6.7 Measure and document API call reduction (target: < 10 calls on initial load) - Requires manual testing
  - [x] 6.8 Verify all existing functionality continues to work as before - Requires manual testing
  - [ ] Note: Some Calendar component tests need to be updated to reflect new architecture (events fetched via App.vue, not Calendar component)
