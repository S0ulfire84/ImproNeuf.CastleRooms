# Spec Tasks

## Tasks

- [x] 1. Fix filtering logic to display events immediately
  - [x] 1.1 Write tests for `filtered_events` computed property with empty and populated contact maps
  - [x] 1.2 Modify `filtered_events` in `App.vue` to show all events initially when contacts haven't loaded
  - [x] 1.3 Update filtering logic to re-filter events once contact data is available
  - [x] 1.4 Add debug logging to track filtering state changes
  - [x] 1.5 Verify all tests pass

- [x] 2. Verify and fix event normalization
  - [x] 2.1 Write tests for `normalizeEvent` with various API response formats (starttime/endtime, defaultschedulestart/defaultscheduleend, null values)
  - [x] 2.2 Verify `normalizeEvent` correctly handles all date field variations
  - [x] 2.3 Add validation to ensure normalized events have valid Date objects
  - [x] 2.4 Add debug logging to show before/after normalization
  - [x] 2.5 Verify all tests pass

- [x] 3. Fix date range filtering in calendar component
  - [x] 3.1 Write tests for `filtered_by_month` computed property with events spanning multiple months
  - [x] 3.2 Verify date filtering logic handles timezone issues correctly
  - [x] 3.3 Ensure events spanning multiple months are handled correctly
  - [x] 3.4 Add debug logging to show which events are filtered and why
  - [x] 3.5 Verify all tests pass

- [x] 4. Verify calendar event rendering
  - [x] 4.1 Write tests for `calendar_days` computed property mapping events to days
  - [x] 4.2 Verify events spanning multiple days are displayed on all relevant days
  - [x] 4.3 Verify event time formatting displays correctly
  - [x] 4.4 Add debug logging to show events assigned to calendar days
  - [x] 4.5 Verify all tests pass

- [x] 5. Add comprehensive debug logging throughout event pipeline
  - [x] 5.1 Add logging in `fetchEvents` to log raw API response and event count
  - [x] 5.2 Add logging in `normalizeEvent` to log normalization process
  - [x] 5.3 Add logging in `fetch_data` to log events before and after filtering
  - [x] 5.4 Add logging in Calendar component to log events received and rendered
  - [x] 5.5 Verify logging works correctly in development mode

