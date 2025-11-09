# Spec Summary (Lite)

Optimize API call strategy to minimize YesPlan API requests by using relationship endpoints (`/api/contact/{id}/events`) instead of fetching all events, implementing contact ID resolution and caching, analyzing event response structure for embedded data, and lazy loading event details only when needed. Target: reduce initial load from 100+ calls to fewer than 10 calls while maintaining all existing functionality.
