# Spec Requirements Document

> Spec: Core MVP - Basic Booking Viewer
> Created: 2025-11-05

## Overview

Create a functional read-only application that displays YesPlan bookings in a calendar view with basic room filtering, enabling Impro Neuf team members to quickly view room availability and booking information without accessing the full YesPlan system.

## User Stories

### View Bookings in Calendar Format

As a **Room Coordinator**, I want to **see all bookings displayed in a calendar format**, so that **I can quickly understand room availability patterns and identify when rooms are booked**.

The application will fetch booking data from the YesPlan API and display events on a monthly calendar view. Each booking will show basic information (name, time, room) on the calendar grid. Users can navigate between months to view different time periods.

### Filter Bookings by Room

As a **Room Coordinator**, I want to **filter the calendar view to show only specific rooms**, so that **I can focus on availability for a particular space**.

The application will provide filter controls (checkboxes or toggle buttons) that allow users to show or hide specific rooms. When a room is filtered out, its bookings will be hidden from the calendar view, making it easier to focus on selected rooms.

### View Detailed Booking Information

As an **Event Manager**, I want to **click on a booking to see detailed information**, so that **I can understand the full context of each booking including contacts, descriptions, and other relevant details**.

When a user clicks on a booking event displayed on the calendar, a modal dialog will open showing complete booking information including event name, description, start/end times, associated rooms, contacts, and any other relevant details from the YesPlan API.

## Spec Scope

1. **YesPlan API Integration** - Set up API client with authentication and basic data fetching for events, resources (rooms), and contacts
2. **Calendar Component** - Create monthly calendar view component with date navigation (previous/next month)
3. **Event Display** - Show booking events on calendar with basic information (name, time, room) visible on the calendar grid
4. **Room Filtering** - Add filter controls to show/hide specific rooms using checkboxes or toggle buttons
5. **Date Navigation** - Implement month/week/day view switching with navigation controls
6. **Booking Details Modal** - Display detailed booking information when clicking on events, including all relevant data from YesPlan API
7. **Responsive Layout** - Ensure application works on mobile, tablet, and desktop devices with appropriate layout adjustments

## Out of Scope

- Write/edit capabilities (creating, updating, or deleting bookings)
- User authentication or authorization
- Advanced filtering by date range, contact, or event type
- Search functionality for specific bookings
- Data caching or offline support
- Multi-room grid view (side-by-side room comparison)
- Color coding for booking types or rooms
- Export functionality (CSV/PDF)
- Print view optimization
- Performance optimizations beyond basic loading states
- Error handling beyond basic error messages

## Expected Deliverable

1. **Functional Calendar View** - Users can view bookings from YesPlan API displayed on a monthly calendar grid, with events positioned correctly based on their dates
2. **Room Filtering** - Users can toggle room visibility using filter controls, and the calendar updates to show only selected rooms' bookings
3. **Booking Details Access** - Users can click on any booking event to open a modal showing complete booking information including event name, time, duration, room(s), and contact information

