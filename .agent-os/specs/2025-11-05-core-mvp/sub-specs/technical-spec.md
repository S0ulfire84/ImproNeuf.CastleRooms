# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-05-core-mvp/spec.md

## Technical Requirements

### API Integration Layer

- **YesPlan API Client Setup**
  - Create a service module to handle YesPlan API communication
  - Implement authentication using API key (stored in environment variable)
  - Base URL: `https://neuf.yesplan.be/api`
  - Handle API version 32.18 format and response structure
  - Implement error handling for API failures (401, 403, 429, network errors)

- **Data Fetching Functions**
  - `fetchEvents()` - Retrieve all events/bookings with pagination support
  - `fetchResources()` - Retrieve all resources (rooms) available in the system
  - `fetchEventDetails(eventId)` - Get detailed information for a specific event
  - `fetchEventResources(eventId)` - Get rooms associated with a specific event
  - `fetchEventContacts(eventId)` - Get contacts associated with a specific event
  - Handle pagination using `book` and `page` parameters from API responses

- **Data Transformation**
  - Transform YesPlan API response format to application data models
  - Parse ISO 8601 date/time strings to JavaScript Date objects
  - Structure event data for calendar display (date grouping, time sorting)
  - Extract and normalize room/resource information

### Calendar Component

- **Calendar Grid Layout**
  - Monthly view showing a full calendar month grid
  - Display day numbers in grid cells
  - Highlight current date
  - Show month name and year in header
  - Handle months with different numbers of weeks (4-6 weeks)

- **Event Rendering**
  - Position events on correct calendar dates based on start date
  - Display event name and time range on calendar cells
  - Show abbreviated room name(s) for each event
  - Handle events spanning multiple days
  - Handle multiple events on the same day (stack or truncate with overflow indicator)
  - Visual distinction between events (basic styling)

- **Date Navigation**
  - Previous/Next month navigation buttons
  - Month/year selector (dropdown or calendar picker)
  - "Today" button to jump to current month
  - Update calendar view when date changes

### Room Filtering

- **Filter UI Component**
  - List of available rooms with checkboxes or toggle switches
  - "Select All" / "Deselect All" functionality
  - Visual indication of active filters
  - Persist filter state during session (optional: localStorage)

- **Filter Logic**
  - Filter events by selected rooms before rendering
  - Update calendar display when filters change
  - Handle case when no rooms are selected (show empty calendar or all rooms)
  - Filter by room IDs from event-resource relationships

### Booking Details Modal

- **Modal Component**
  - Overlay/modal dialog component
  - Display when clicking on calendar event
  - Close button (X) and click-outside-to-close functionality
  - Scrollable content area for long details

- **Information Display**
  - Event name (prominent heading)
  - Start date/time and end date/time
  - Duration calculation
  - Associated rooms (list all rooms)
  - Associated contacts (name, contact info if available)
  - Event description (if available)
  - Status (confirmed, tentative, etc.)
  - Loading state while fetching detailed event data

### Responsive Design

- **Mobile (< 768px)**
  - Single column layout
  - Stacked filter controls
  - Full-width calendar grid
  - Touch-friendly event targets (minimum 44px tap targets)
  - Modal takes full screen or near-full screen

- **Tablet (768px - 1024px)**
  - Two-column layout for filters and calendar
  - Sidebar or top-bar for room filters
  - Calendar grid adapts to available width

- **Desktop (> 1024px)**
  - Multi-column layout
  - Sidebar for room filters
  - Larger calendar grid with more space for event details
  - Hover states for interactive elements

### Loading States & Error Handling

- **Loading Indicators**
  - Show loading spinner or skeleton while fetching initial data
  - Per-component loading states (calendar loading, modal loading)
  - Disable interactions during loading

- **Error States**
  - Display error message if API fails
  - Show retry button for failed requests
  - Handle empty states (no bookings, no rooms)
  - Display user-friendly error messages

### State Management

- **Application State**
  - Current selected date/month
  - List of all events
  - List of all resources (rooms)
  - Active room filters (selected room IDs)
  - Selected event for modal display
  - Loading and error states

- **State Updates**
  - Update calendar when date changes
  - Update calendar when filters change
  - Refresh data when navigating dates
  - Clear selected event when modal closes

## External Dependencies

- **Vue 3** (v3.5.22) - Already installed
  - **Purpose:** Component framework for building the application
  - **Justification:** Core framework already in use

- **Vue Router** (v4.6.3) - Already installed
  - **Purpose:** Client-side routing (if needed for future navigation)
  - **Justification:** Already included in project

- **Date Utility Library** (TBD - e.g., date-fns or dayjs)
  - **Purpose:** Date manipulation, formatting, and calendar calculations
  - **Justification:** Required for calendar grid generation, date navigation, date comparisons, and formatting dates for display
  - **Version Requirements:** Latest stable version compatible with Vue 3

- **HTTP Client Library** (TBD - e.g., axios or use native fetch)
  - **Purpose:** API requests with better error handling and request/response interceptors
  - **Justification:** Native fetch is sufficient for MVP, but axios provides better error handling and interceptors for API key management
  - **Version Requirements:** Latest stable version (if axios chosen)

- **CSS Framework** (Optional - TBD)
  - **Purpose:** Styling and responsive layout utilities
  - **Justification:** Can use vanilla CSS or a lightweight framework for responsive grid and utilities
  - **Version Requirements:** TBD based on choice

