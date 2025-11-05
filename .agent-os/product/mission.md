# Product Mission

## Pitch

CastleRooms is a read-only booking visualization application that helps Impro Neuf team members understand room availability and existing bookings by providing a clear calendar view of all bookings from the YesPlan system without requiring write access.

## Users

### Primary Customers

- **Impro Neuf Team Members**: Staff, administrators, and coordinators who need to quickly check room availability and see what bookings exist without accessing the full YesPlan system.

### User Personas

**Room Coordinator** (25-45 years old)
- **Role:** Event coordinator, facility manager, or administrative staff
- **Context:** Needs to quickly check which rooms are available for planning purposes or to answer inquiries about room availability
- **Pain Points:** Having to log into YesPlan to check availability, complex interface for simple queries, no quick overview of room status
- **Goals:** See at a glance which rooms are booked and when, quickly identify available time slots, understand booking patterns

**Event Manager** (30-50 years old)
- **Role:** Event planning or programming staff
- **Context:** Needs to coordinate events and requires real-time visibility into room bookings
- **Pain Points:** Lack of visibility into room availability, difficulty planning around existing bookings, no intuitive calendar view
- **Goals:** Plan events around existing bookings, identify optimal time slots, avoid double-booking conflicts

## The Problem

### Limited Visibility into Room Availability

Team members need to check room availability frequently but currently must access the full YesPlan system, which requires credentials and navigation through a complex interface. This creates friction for simple "what's booked?" queries and reduces efficiency. **Our Solution:** Provide a streamlined, read-only interface focused solely on viewing bookings and availability in an intuitive calendar format.

### No Quick Overview of Booking Status

Without a dedicated viewing tool, team members cannot quickly see booking patterns, identify peak usage times, or get a holistic view of room utilization across multiple rooms and dates. This makes planning and coordination more difficult. **Our Solution:** Offer a calendar-based visualization that shows all bookings across rooms and time periods in a single, easy-to-understand interface.

### Fragmented Booking Information

Room booking information is spread across multiple views and requires multiple clicks to understand which rooms are booked when. Team members waste time navigating between different sections to gather complete information. **Our Solution:** Consolidate all booking information into a unified calendar view that shows room, date, and booking details in one place.

### Difficulty Identifying Available Slots

Without clear visualization of booked vs. available time slots, it's challenging to identify when rooms are free for planning purposes. This leads to uncertainty and potential scheduling conflicts. **Our Solution:** Display clear visual indicators for booked vs. available time slots, making it immediately obvious when rooms are free.

## Differentiators

### Read-Only Focused Design

Unlike YesPlan's full-featured interface, CastleRooms is purpose-built for viewing only. By removing all write/edit capabilities, we eliminate complexity and create a faster, more focused experience for users who just need to see booking status. This results in reduced cognitive load and faster decision-making.

### Calendar-Centric Visualization

Unlike YesPlan's list-based views, CastleRooms presents all booking information in an intuitive calendar format that makes temporal patterns immediately visible. This results in users being able to understand availability at a glance rather than parsing through lists of events.

### Simplified Interface

Unlike YesPlan's comprehensive system with many features, CastleRooms provides a minimal, focused interface that shows only what's needed: room bookings and availability. This results in zero learning curve for team members who just need quick booking visibility.

## Key Features

### Core Features

- **Calendar View:** Display all bookings in a monthly/weekly calendar format with clear visual indicators for booked time slots
- **Room Filtering:** Filter calendar view by specific rooms to focus on individual room availability
- **Multi-Room Overview:** View all rooms simultaneously in a grid layout to see availability across multiple spaces
- **Booking Details:** View detailed information about each booking including event name, time, duration, and associated contacts
- **Date Range Navigation:** Navigate through different time periods (month, week, day views) to explore booking patterns
- **Available Slot Highlighting:** Clearly distinguish between booked and available time slots with color coding

### Data Integration Features

- **YesPlan API Integration:** Seamlessly fetch booking data from YesPlan REST API without requiring direct YesPlan access
- **Real-Time Data Sync:** Automatically refresh booking data to ensure current availability information
- **Room Resource Mapping:** Display room names and details from YesPlan resources
- **Event Information Display:** Show event names, descriptions, start/end times, and associated contacts from YesPlan events

### User Experience Features

- **Responsive Design:** Works seamlessly on desktop, tablet, and mobile devices for access anywhere
- **Fast Loading:** Optimized data fetching and caching for quick access to booking information
- **Intuitive Navigation:** Simple, intuitive controls for navigating dates and filtering rooms
- **Visual Clarity:** Clear visual hierarchy and color coding to make booking status immediately obvious

