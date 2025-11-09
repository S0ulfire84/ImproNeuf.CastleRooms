# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-09-api-call-optimization/spec.md

## Endpoints

### GET /api/contacts/{query}

**Purpose:** Search for contacts by name to find contact IDs for bookers (Impro Neuf, Oslo Impro Festival).

**Parameters:**
- `query` (path parameter, required): Contact name to search for (e.g., "Impro Neuf")
- `api_key` (query parameter, required): API authentication key
- `book` (query parameter, optional): Pagination book identifier
- `page` (query parameter, optional): Pagination page identifier

**Response:**
```json
{
  "data": [
    {
      "id": "contact-123",
      "name": "Impro Neuf",
      "email": "contact@improneuf.be",
      ...
    }
  ],
  "pagination": {
    "book": 123,
    "page": 1,
    "hasMore": false
  }
}
```

**Usage:** Called once per booker name to find the contact ID. Results are cached to avoid repeated calls.

**Errors:**
- `401 Unauthorized` - Invalid API key
- `403 Forbidden` - API key doesn't have permission
- `404 Not Found` - No contacts found (handled gracefully)

---

### GET /api/contact/{id}/events

**Purpose:** Fetch all events associated with a specific contact (booker). This is the primary optimization endpoint that replaces fetching all events and filtering client-side.

**Parameters:**
- `id` (path parameter, required): Contact identifier
- `api_key` (query parameter, required): API authentication key
- `book` (query parameter, optional): Pagination book identifier
- `page` (query parameter, optional): Pagination page identifier

**Response:**
```json
{
  "data": [
    {
      "id": "event-456",
      "name": "Event Name",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T12:00:00Z",
      "status": "confirmed",
      // May include embedded contacts/resources
      ...
    }
  ],
  "pagination": {
    "book": 456,
    "page": 1,
    "hasMore": false
  }
}
```

**Usage:** Called once per selected booker to fetch all their events. Handles pagination automatically.

**Benefits:**
- Only returns events for the specified contact
- Eliminates need to fetch all events and filter client-side
- Significantly reduces data transfer

**Errors:**
- `401 Unauthorized` - Invalid API key
- `403 Forbidden` - API key doesn't have permission
- `404 Not Found` - Contact not found (should not happen if contact ID was resolved correctly)

---

### GET /api/event/{id}

**Purpose:** Fetch detailed information about a specific event. Used when user opens the booking details modal.

**Parameters:**
- `id` (path parameter, required): Event identifier
- `api_key` (query parameter, required): API authentication key

**Response:**
```json
{
  "id": "event-456",
  "name": "Event Name",
  "start": "2024-01-15T10:00:00Z",
  "end": "2024-01-15T12:00:00Z",
  "status": "confirmed",
  "description": "Event description",
  // May include embedded contacts and resources
  "contacts": [...],  // If embedded
  "resources": [...], // If embedded
  ...
}
```

**Usage:** Called only when user clicks on an event to view details. Response structure needs to be analyzed to determine if contacts and resources are embedded.

**Errors:**
- `401 Unauthorized` - Invalid API key
- `403 Forbidden` - API key doesn't have permission
- `404 Not Found` - Event not found

---

### GET /api/event/{id}/resources

**Purpose:** Fetch resources (rooms) associated with an event. May be unnecessary if resources are embedded in event response.

**Parameters:**
- `id` (path parameter, required): Event identifier
- `api_key` (query parameter, required): API authentication key

**Response:**
```json
{
  "data": [
    {
      "id": "resource-789",
      "name": "Room Name",
      ...
    }
  ]
}
```

**Usage:** Called only if resources are not embedded in the event response. Should be called in parallel with other event detail calls using `Promise.all()`.

**Conditional:** This endpoint may not be needed if `/api/event/{id}` includes embedded resources.

---

### GET /api/event/{id}/contacts

**Purpose:** Fetch contacts associated with an event. May be unnecessary if contacts are embedded in event response.

**Parameters:**
- `id` (path parameter, required): Event identifier
- `api_key` (query parameter, required): API authentication key

**Response:**
```json
{
  "data": [
    {
      "id": "contact-123",
      "name": "Impro Neuf",
      ...
    }
  ]
}
```

**Usage:** Called only if contacts are not embedded in the event response. Should be called in parallel with other event detail calls using `Promise.all()`.

**Conditional:** This endpoint may not be needed if `/api/event/{id}` includes embedded contacts, or if we're already fetching events via `/api/contact/{id}/events` which may include contact information.

---

## API Call Strategy

### Initial Load (Optimized)

1. **Find Contact ID** (cached after first call)
   ```
   GET /api/contacts/Impro Neuf?api_key={key}
   ```

2. **Fetch Events for Contact** (with pagination)
   ```
   GET /api/contact/{contactId}/events?api_key={key}
   GET /api/contact/{contactId}/events?api_key={key}&book={book}&page={page}  // If paginated
   ```

**Total: 1-2 calls** (vs. 1 + N calls currently)

### Event Details (Optimized)

1. **Fetch Event Details** (may include embedded data)
   ```
   GET /api/event/{id}?api_key={key}
   ```

2. **Fetch Resources** (only if not embedded)
   ```
   GET /api/event/{id}/resources?api_key={key}
   ```

3. **Fetch Contacts** (only if not embedded)
   ```
   GET /api/event/{id}/contacts?api_key={key}
   ```

**Total: 1-3 calls** (same as current, but may be reduced to 1 if data is embedded)

### Month Navigation (Optimized)

**Total: 0 calls** (vs. N calls currently, where N = number of events in month)

No additional API calls needed since events are already filtered by contact and cached.

### Booker Change (Optimized)

1. **Find Contact ID** (if not cached)
   ```
   GET /api/contacts/{bookerName}?api_key={key}
   ```

2. **Fetch Events for New Contact** (with pagination)
   ```
   GET /api/contact/{newContactId}/events?api_key={key}
   ```

**Total: 1-2 calls** (vs. 1 + N calls currently)

---

## Response Structure Analysis

**Critical Investigation:** The actual response structure from YesPlan API needs to be analyzed to determine:

1. Does `/api/event/{id}` include embedded `contacts` and `resources`?
2. Does `/api/contact/{id}/events` include embedded contact information in each event?
3. What is the exact field structure for relationships?

**Action Required:** Add logging/inspection code to document the actual API response structure before finalizing the implementation.

---

## Error Handling

All endpoints should handle:

- **401 Unauthorized:** Display error message, prevent further API calls
- **403 Forbidden:** Display error message, prevent further API calls
- **404 Not Found:** Handle gracefully (contact not found, event not found)
- **429 Too Many Requests:** Implement retry logic with exponential backoff
- **Network Errors:** Display user-friendly error message, provide retry option

---

## Rate Limiting Considerations

While optimizing API calls reduces the risk of rate limiting, the application should:

- Cache contact IDs to avoid repeated lookups
- Batch operations where possible
- Implement request queuing if needed
- Respect `Retry-After` headers from 429 responses

---

## References

- YesPlan API Documentation: `docs/yesplan-api.md`
- YesPlan REST API Manual: https://manual.yesplan.be/en/developers/rest-api/
- OpenAPI Specification: https://neuf.yesplan.be/api/openapi.json

