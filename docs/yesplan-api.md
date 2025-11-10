# YesPlan API Documentation

## Overview

This document explains how to use the YesPlan REST API to retrieve room booking information for Impro Neuf. The API provides access to events (bookings), resources (rooms), contacts, locations, and other related data.

**API Base URL:** `https://neuf.yesplan.be/api`  
**API Version:** 32.18  
**Documentation:** https://manual.yesplan.be/en/developers/rest-api/

## Authentication

All API requests require authentication using an API key passed as a query parameter:

```
?api_key=YOUR_API_KEY
```

## Example Swagger

https://neuf.yesplan.be/swagger/#/%2Fevents/get_events

The API key must be included in every request.

## API Response Structure

Most endpoints return responses in the following format:

```json
{
  "data": [...],  // Array of items
  "pagination": {
    // Pagination information (if applicable)
  }
}
```

## Key Endpoints for Room Bookings

### 1. Events (Bookings)

Events represent bookings/appointments in YesPlan. These contain information about what is booked, when, and which resources (rooms) are involved.

#### List All Events

```
GET /api/events
GET /api/events?book={book_id}&page={page}
```

**Query Parameters:**

- `book` (optional, integer): The book identifier for pagination
- `page` (optional, integer): The page identifier for pagination

**Response:** Returns a list of all events/bookings.

#### Search Events

```
GET /api/events/{query}
GET /api/events/{query}?book={book_id}&page={page}
```

**Path Parameters:**

- `query` (required, string): Search query string

**Query Parameters:**

- `book` (optional, integer): The book identifier for pagination
- `page` (optional, integer): The page identifier for pagination

**Use Case:** Search for events matching specific criteria (e.g., dates, contact names).

#### Get Specific Event Details

```
GET /api/event/{id}
```

**Path Parameters:**

- `id` (required, string): The event identifier

**Response:** Returns detailed information about a specific event/booking, including:

- Event name and description
- Start and end dates/times
- Associated resources (rooms)
- Associated contacts
- Custom data fields
- And more...

**Related Endpoints:**

- `GET /api/event/{id}/attachments` - Get attachments for an event
- `GET /api/event/{id}/customdata` - Get custom data for an event
- `GET /api/event/{id}/customdata?keywords={keywords}&valuesonly` - Get filtered custom data

### 2. Resources (Rooms)

Resources represent physical spaces like rooms, equipment, or other bookable items.

#### List All Resources

```
GET /api/resources
GET /api/resources?book={book_id}&page={page}
```

**Query Parameters:**

- `book` (optional, integer): The book identifier for pagination
- `page` (optional, integer): The page identifier for pagination

**Response:** Returns a list of all resources (rooms) available in the system.

#### Search Resources

```
GET /api/resources/{query}
GET /api/resources/{query}?book={book_id}&page={page}
```

**Path Parameters:**

- `query` (required, string): Search query string

**Use Case:** Search for specific rooms by name or other criteria.

#### Get Specific Resource Details

```
GET /api/resource/{id}
```

**Path Parameters:**

- `id` (required, string): The resource identifier

**Response:** Returns detailed information about a specific resource (room), including:

- Resource name and description
- Location information
- Capacity and specifications
- Custom data fields
- And more...

**Related Endpoints:**

- `GET /api/resource/{id}/attachments` - Get attachments for a resource
- `GET /api/resource/{id}/customdata` - Get custom data for a resource
- `GET /api/resource/{id}/customdata?keywords={keywords}&valuesonly` - Get filtered custom data

### 3. Locations

Locations represent physical places where resources (rooms) are located.

#### List All Locations

```
GET /api/locations
GET /api/locations?book={book_id}&page={page}
```

#### Search Locations

```
GET /api/locations/{query}
```

#### Get Specific Location Details

```
GET /api/location/{id}
```

**Use Case:** Get information about where rooms are located (building, address, etc.).

### 4. Contacts

Contacts represent people or organizations that make bookings.

#### List All Contacts

```
GET /api/contacts
GET /api/contacts?book={book_id}&page={page}
```

#### Search Contacts

```
GET /api/contacts/{query}
```

#### Get Specific Contact Details

```
GET /api/contact/{id}
```

**Use Case:** Get information about who made a booking (Impro Neuf or other contacts).

**Related Endpoints:**

- `GET /api/contact/{id}/attachments` - Get attachments for a contact
- `GET /api/contact/{id}/customdata` - Get custom data for a contact

### 5. Event Resources (Bookings ↔ Rooms Relationship)

To understand which rooms are booked for specific events:

#### Get Resources for an Event

```
GET /api/event/{id}/resources
```

**Path Parameters:**

- `id` (required, string): The event identifier

**Response:** Returns the resources (rooms) associated with a specific event/booking.

#### Get Events for a Resource

```
GET /api/resource/{id}/events
```

**Path Parameters:**

- `id` (required, string): The resource identifier

**Response:** Returns all events/bookings associated with a specific resource (room).

**Use Case:** Get all bookings for a specific room.

### 6. Event Contacts (Bookings ↔ Contacts Relationship)

To understand which contacts are associated with bookings:

#### Get Contacts for an Event

```
GET /api/event/{id}/contacts
```

**Response:** Returns the contacts associated with a specific event/booking.

#### Get Events for a Contact

```
GET /api/contact/{id}/events
```

**Response:** Returns all events/bookings associated with a specific contact.

**Use Case:** Get all bookings made by Impro Neuf.

## Workflow: Finding Room Bookings for Impro Neuf

To find which rooms are booked to Impro Neuf, on which dates, and all booking details, follow this workflow:

### Step 1: Find Impro Neuf Contact

1. Search for the Impro Neuf contact:

   ```
   GET /api/contacts/{query}
   ```

   Where `{query}` is a search term like "Impro Neuf" or "Neuf"

2. Get the contact ID from the response

3. (Optional) Get detailed contact information:
   ```
   GET /api/contact/{id}
   ```

### Step 2: Get All Bookings for Impro Neuf

1. Get all events associated with the Impro Neuf contact:
   ```
   GET /api/contact/{id}/events
   ```
   This returns all bookings made by Impro Neuf.

### Step 3: Get Booking Details

For each event/booking returned:

1. Get full event details:

   ```
   GET /api/event/{id}
   ```

   This provides:
   - Event name and description
   - Start date/time
   - End date/time
   - Status
   - Other event properties

2. Get rooms booked for this event:

   ```
   GET /api/event/{id}/resources
   ```

   This returns all rooms/resources booked for this specific event.

3. (Optional) Get custom data for additional details:
   ```
   GET /api/event/{id}/customdata
   ```

### Step 4: Get Room Details

For each room/resource found:

1. Get detailed room information:

   ```
   GET /api/resource/{id}
   ```

   This provides:
   - Room name
   - Location
   - Capacity
   - Other specifications

2. (Optional) Get room location details:
   ```
   GET /api/location/{location_id}
   ```

## Alternative Workflow: Search Events by Date

If you want to find bookings within a specific date range:

1. Search events using the events endpoint with query parameters:

   ```
   GET /api/events/{query}
   ```

   Note: The exact query syntax may depend on YesPlan's search implementation.

2. Filter events by date in your application code (check the `start` and `end` fields in event objects).

3. For each matching event, check if it's associated with Impro Neuf:
   ```
   GET /api/event/{id}/contacts
   ```
   Then verify if Impro Neuf's contact ID is in the results.

## Response Codes

- `200 OK` - Request successful
- `204 Accepted` - Request accepted (for PUT/POST operations)
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - API key doesn't have permission for the requested resource
- `429 Too Many Requests` - Rate limit exceeded. Check the `Retry-After` header.

## Pagination

Many list endpoints support pagination using `book` and `page` query parameters. When a response includes pagination information, use it to fetch subsequent pages:

```json
{
  "data": [...],
  "pagination": {
    "book": 123,
    "page": 456,
    "hasMore": true
  }
}
```

To get the next page, include the `book` and `page` values from the pagination object in your next request.

## Example API Request

```bash
curl "https://neuf.yesplan.be/api/events?api_key=YOUR_API_KEY"
```

## Example Response Structure

```json
{
  "data": [
    {
      "id": "event-123",
      "name": "Event Name",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T12:00:00Z",
      "status": "confirmed"
      // ... other event fields
    }
  ],
  "pagination": {
    "book": 123,
    "page": 1,
    "hasMore": false
  }
}
```

## Notes

- All endpoints require the `api_key` query parameter
- The API uses standard HTTP methods (GET, PUT, POST, DELETE)
- Dates are typically returned in ISO 8601 format
- Custom data endpoints allow filtering by keywords
- The `valuesonly` flag on custom data endpoints returns only values without keys
- Many endpoints support both list and search variants
- Relationships between entities (events, resources, contacts) are accessible via nested endpoints

## Related Documentation

- [YesPlan REST API Manual](https://manual.yesplan.be/en/developers/rest-api/)
- [OpenAPI Specification](https://neuf.yesplan.be/api/openapi.json)
- [Content Type Definitions](https://neuf.yesplan.be/api/doc/) - Detailed field definitions for each entity type

## Implementation Tips

1. **Start with contacts**: Find Impro Neuf's contact ID first, then use relationship endpoints to get their bookings.

2. **Use relationship endpoints**: Instead of searching through all events, use `/api/contact/{id}/events` to get bookings directly.

3. **Cache resource details**: Room information doesn't change frequently, so cache resource details to reduce API calls.

4. **Handle pagination**: Always check for pagination and fetch all pages if needed.

5. **Filter by date**: Once you have events, filter them by date range in your application code.

6. **Get full details**: Use the specific ID endpoints (`/api/event/{id}`) to get complete information about each booking.
