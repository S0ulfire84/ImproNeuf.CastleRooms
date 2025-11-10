# Spec Requirements Document

> Spec: API Call Optimization
> Created: 2025-11-09

## Overview

Optimize the application's API call strategy to minimize the number of requests to the YesPlan API while maintaining all current functionality. The application currently makes inefficient API calls by fetching all events upfront and then making individual calls for each event's contacts, which can result in hundreds of API calls. This spec will redesign the data fetching strategy to use relationship endpoints and bulk operations to reduce API calls to the absolute minimum.

## User Stories

### As an Impro Neuf Team Member

I want the application to load booking data quickly and efficiently, so that I can view room availability without experiencing slow load times or rate limiting issues.

**Workflow:**

1. User opens the application
2. Application identifies the Impro Neuf contact ID (or other selected booker)
3. Application fetches only events for that contact using the relationship endpoint
4. Application displays events in the calendar view
5. When user selects an event, full details are loaded efficiently

### As a Developer

I want the application to make minimal API calls, so that we avoid rate limiting, reduce server load, and improve application performance.

**Workflow:**

1. Application makes a single call to find the contact ID for the selected booker
2. Application makes a single call (with pagination) to get all events for that contact
3. Application uses event data that may already include embedded resources/contacts
4. Only when absolutely necessary, application makes additional calls for missing data

## Spec Scope

1. **Contact-Based Event Fetching** - Replace fetching all events with fetching events for a specific contact using `/api/contact/{id}/events` endpoint, reducing initial data load significantly.

2. **Contact ID Resolution** - Implement a method to find contact IDs for bookers (Impro Neuf, Oslo Impro Festival) by searching contacts and caching the results to avoid repeated lookups.

3. **Event Data Structure Analysis** - Analyze the event response structure from YesPlan API to determine if contacts and resources are already embedded, eliminating the need for separate relationship calls.

4. **Lazy Loading Strategy** - Implement lazy loading for event details, contacts, and resources only when needed (e.g., when opening the booking details modal), rather than pre-fetching for all visible events.

5. **Batch Operations** - Replace individual API calls for event contacts with batch operations where possible, or eliminate them entirely if contact data is embedded in event responses.

## Out of Scope

- Changes to the UI/UX of the application
- Adding new features or functionality
- Modifying the filtering logic (only the data fetching strategy)
- Caching strategies beyond session-based caching
- Offline functionality or persistent storage

## Expected Deliverable

1. Application makes fewer than 10 API calls on initial load (currently makes 1 + N calls where N can be 100+)
2. Application fetches events only for the selected booker, not all events in the system
3. Application uses relationship endpoints (`/api/contact/{id}/events`) instead of fetching all events and filtering client-side
4. Event details modal loads with minimal additional API calls (ideally 1-2 calls maximum)
5. All existing functionality (calendar view, filtering, event details) continues to work as before
