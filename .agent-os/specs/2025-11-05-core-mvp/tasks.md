# Spec Tasks

## Tasks

- [x] 1. YesPlan API Integration & Data Layer
  - [x] 1.1 Write tests for YesPlan API service module
  - [x] 1.2 Create environment variable configuration for API key
  - [x] 1.3 Implement YesPlan API client service with authentication
  - [x] 1.4 Implement fetchEvents() function with pagination support
  - [x] 1.5 Implement fetchResources() function with pagination support
  - [x] 1.6 Implement fetchEventDetails(), fetchEventResources(), and fetchEventContacts() functions
  - [x] 1.7 Create data transformation utilities (parse dates, normalize data structures)
  - [x] 1.8 Implement error handling for API failures (401, 403, 429, network errors)
  - [x] 1.9 Verify all tests pass

- [x] 2. Calendar Component & Event Display
  - [x] 2.1 Write tests for Calendar component
  - [x] 2.2 Install and configure date utility library (date-fns or dayjs)
  - [x] 2.3 Create Calendar component with monthly grid layout
  - [x] 2.4 Implement date navigation (previous/next month, "Today" button, month/year selector)
  - [x] 2.5 Implement calendar grid generation (handle 4-6 week months, highlight current date)
  - [x] 2.6 Implement event rendering on calendar cells (position events by date, display name/time/room)
  - [x] 2.7 Handle multiple events per day and events spanning multiple days
  - [x] 2.8 Integrate Calendar with API data fetching and display events
  - [x] 2.9 Verify all tests pass

- [x] 3. Room Filtering
  - [x] 3.1 Write tests for RoomFilter component and filtering logic
  - [x] 3.2 Create RoomFilter component with checkbox/toggle UI
  - [x] 3.3 Implement "Select All" / "Deselect All" functionality
  - [x] 3.4 Implement filter state management (selected room IDs)
  - [x] 3.5 Implement filtering logic to filter events by selected rooms
  - [x] 3.6 Connect filter to Calendar component to update displayed events
  - [x] 3.7 Handle edge case when no rooms are selected
  - [x] 3.8 Verify all tests pass

- [x] 4. Booking Details Modal
  - [x] 4.1 Write tests for BookingDetailsModal component
  - [x] 4.2 Create Modal component (overlay, close button, click-outside-to-close)
  - [x] 4.3 Implement modal opening on calendar event click
  - [x] 4.4 Implement event details fetching when modal opens (event details, resources, contacts)
  - [x] 4.5 Create BookingDetailsModal component with event information display
  - [x] 4.6 Implement loading state while fetching event details
  - [x] 4.7 Format and display event details (name, dates, duration, rooms, contacts, description, status)
  - [x] 4.8 Verify all tests pass

- [x] 5. Responsive Layout & Polish
  - [x] 5.1 Write tests for responsive behavior
  - [x] 5.2 Implement responsive layout for mobile (< 768px): single column, stacked filters, full-width calendar
  - [x] 5.3 Implement responsive layout for tablet (768px - 1024px): two-column layout, sidebar/top-bar filters
  - [x] 5.4 Implement responsive layout for desktop (> 1024px): multi-column layout, sidebar filters, hover states
  - [x] 5.5 Implement loading indicators (spinner/skeleton) for initial data fetch
  - [x] 5.6 Implement error states and user-friendly error messages
  - [x] 5.7 Implement empty states (no bookings, no rooms)
  - [x] 5.8 Verify all tests pass and responsive design works across devices

