# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-05-core-mvp/spec.md

## YesPlan API Integration

This application integrates with the YesPlan REST API to fetch booking data. All API calls are read-only GET requests.

### Authentication

All API requests require an API key passed as a query parameter:
```
?api_key=YOUR_API_KEY
```

The API key should be stored in an environment variable (e.g., `VITE_YESPLAN_API_KEY`) and accessed via `import.meta.env.VITE_YESPLAN_API_KEY`.

### Base Configuration

- **Base URL:** `https://neuf.yesplan.be/api`
- **API Version:** 32.18
- **Content-Type:** `application/json`
- **Accept:** `application/json`

### Endpoints

#### GET /api/events

**Purpose:** Retrieve all events/bookings from YesPlan

**Parameters:**
- `api_key` (required, query): API key for authentication
- `book` (optional, query, integer): Book identifier for pagination
- `page` (optional, query, integer): Page identifier for pagination

**Response:**
```json
{
  "data": [
    {
      "id": "event-123",
      "name": "Event Name",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T12:00:00Z",
      "status": "confirmed",
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

**Implementation Notes:**
- Handle pagination by checking `hasMore` and fetching subsequent pages
- Filter events by date range in application code (not via API query)
- Store all events in application state for calendar rendering

**Errors:**
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - API key doesn't have permission
- `429 Too Many Requests` - Rate limit exceeded (check `Retry-After` header)
- Network errors - Handle timeout and connection failures

#### GET /api/event/{id}

**Purpose:** Retrieve detailed information for a specific event/booking

**Parameters:**
- `id` (required, path, string): Event identifier
- `api_key` (required, query): API key for authentication

**Response:**
```json
{
  "id": "event-123",
  "name": "Event Name",
  "description": "Event description",
  "start": "2024-01-15T10:00:00Z",
  "end": "2024-01-15T12:00:00Z",
  "status": "confirmed",
  // ... other detailed event fields
}
```

**Use Case:** Fetch complete event details when user clicks on a booking in the calendar to display in the modal

**Errors:**
- `404 Not Found` - Event doesn't exist
- `401 Unauthorized` - Invalid API key
- `403 Forbidden` - No permission to access event

#### GET /api/event/{id}/resources

**Purpose:** Get all resources (rooms) associated with a specific event

**Parameters:**
- `id` (required, path, string): Event identifier
- `api_key` (required, query): API key for authentication

**Response:**
```json
{
  "data": [
    {
      "id": "resource-456",
      "name": "Room Name",
      // ... other resource fields
    }
  ]
}
```

**Use Case:** Display which rooms are booked for an event in the calendar and booking details modal

**Errors:**
- `404 Not Found` - Event doesn't exist
- `401 Unauthorized` - Invalid API key

#### GET /api/event/{id}/contacts

**Purpose:** Get all contacts associated with a specific event

**Parameters:**
- `id` (required, path, string): Event identifier
- `api_key` (required, query): API key for authentication

**Response:**
```json
{
  "data": [
    {
      "id": "contact-789",
      "name": "Contact Name",
      // ... other contact fields
    }
  ]
}
```

**Use Case:** Display contact information in the booking details modal

**Errors:**
- `404 Not Found` - Event doesn't exist
- `401 Unauthorized` - Invalid API key

#### GET /api/resources

**Purpose:** Retrieve all resources (rooms) available in the system

**Parameters:**
- `api_key` (required, query): API key for authentication
- `book` (optional, query, integer): Book identifier for pagination
- `page` (optional, query, integer): Page identifier for pagination

**Response:**
```json
{
  "data": [
    {
      "id": "resource-456",
      "name": "Room Name",
      "description": "Room description",
      // ... other resource fields
    }
  ],
  "pagination": {
    "book": 123,
    "page": 1,
    "hasMore": false
  }
}
```

**Use Case:** Populate room filter list with all available rooms

**Implementation Notes:**
- Fetch once on application load
- Cache resource list in application state (resources don't change frequently)
- Handle pagination if needed

**Errors:**
- `401 Unauthorized` - Invalid API key
- `403 Forbidden` - No permission to access resources

## API Integration Patterns

### Request Flow

1. **Initial Load:**
   - Fetch all resources (`GET /api/resources`) - populate filter list
   - Fetch all events (`GET /api/events`) - populate calendar
   - Handle pagination for both endpoints

2. **Event Click:**
   - Fetch event details (`GET /api/event/{id}`)
   - Fetch event resources (`GET /api/event/{id}/resources`)
   - Fetch event contacts (`GET /api/event/{id}/contacts`)
   - Display all data in modal

3. **Date Navigation:**
   - Filter events in application code by date range
   - No additional API calls needed (events already cached)

### Error Handling Strategy

- **401 Unauthorized:** Show error message, prompt user to check API key configuration
- **403 Forbidden:** Show error message indicating insufficient permissions
- **429 Too Many Requests:** Implement exponential backoff retry logic
- **Network Errors:** Show user-friendly error message with retry button
- **404 Not Found:** Handle gracefully (event may have been deleted)

### Rate Limiting Considerations

- YesPlan API may have rate limits
- Implement request throttling if needed
- Cache responses to minimize API calls
- For MVP, fetch all events once on load rather than per-date requests

### Data Transformation

Transform YesPlan API responses to application data models:

- **Event Model:**
  - Parse ISO 8601 dates to JavaScript Date objects
  - Extract and normalize room/resource IDs
  - Extract and normalize contact IDs
  - Structure for calendar display

- **Resource Model:**
  - Extract room name and ID
  - Store in filter list structure

- **Contact Model:**
  - Extract contact name and details
  - Format for display in modal

