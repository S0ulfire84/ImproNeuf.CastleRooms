/**
 * YesPlan API Service
 *
 * Handles all communication with the YesPlan REST API for fetching
 * events, resources, and related data.
 */

// Use proxy in development, direct URL in production
const BASE_URL = import.meta.env.DEV 
  ? '/api' // Will be proxied by Vite dev server
  : 'https://neuf.yesplan.be/api'
const API_VERSION = '32.18'

export interface YesPlanEvent {
  id: string
  name: string
  start: Date
  end: Date
  status: string
  description?: string
  [key: string]: unknown
}

export interface YesPlanResource {
  id: string
  name: string
  description?: string
  [key: string]: unknown
}

export interface YesPlanLocation {
  id: string
  name: string
  url?: string
  _type?: string
  [key: string]: unknown
}

export interface YesPlanContact {
  id: string
  name: string
  email?: string
  [key: string]: unknown
}

export interface PaginationInfo {
  book?: number
  page?: number
  hasMore?: boolean
  next?: string
  expires?: string
}

export interface YesPlanResponse<T> {
  data: T[]
  pagination?: PaginationInfo
}

export class YesPlanApiService {
  private api_key: string
  private base_url: string
  private contact_cache: Map<string, string> = new Map()
  private last_endpoint: string | null = null
  private consecutive_call_count: number = 0
  private readonly RATE_LIMIT = 5

  constructor() {
    const api_key = import.meta.env.VITE_YESPLAN_API_KEY
    if (!api_key) {
      throw new Error('VITE_YESPLAN_API_KEY is required')
    }
    this.api_key = api_key
    this.base_url = BASE_URL
  }

  /**
   * Extract endpoint path without query parameters for rate limiting
   * Normalizes dynamic IDs (like event IDs, contact IDs) to {id} placeholder
   * so that /event/123/contacts and /event/456/contacts are treated as the same endpoint
   */
  private extractEndpointPath(endpoint: string): string {
    // Remove query parameters if present
    const path = endpoint.split('?')[0]
    
    // Normalize path: ensure it starts with / and remove trailing slashes
    let normalized = path.replace(/\/+$/, '') || '/'
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`
    }
    
    // Normalize dynamic IDs to {id} placeholder
    // Known endpoint keywords that should not be replaced
    const endpoint_keywords = new Set([
      'events', 'event', 'resources', 'resource', 
      'contacts', 'contact', 'locations', 'location'
    ])
    
    // Split path into segments
    const segments = normalized.split('/').filter(segment => segment.length > 0)
    const normalized_segments: string[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      
      // Check if this segment should be normalized to {id}
      // It should be normalized if:
      // 1. It's not a known endpoint keyword, AND
      // 2. It comes after a singular resource name (event, contact, resource, location)
      const prev_segment = i > 0 ? segments[i - 1] : null
      const is_after_singular_resource = prev_segment && 
        ['event', 'contact', 'resource', 'location'].includes(prev_segment)
      
      if (is_after_singular_resource && !endpoint_keywords.has(segment)) {
        // This looks like an ID - replace with placeholder
        normalized_segments.push('{id}')
      } else {
        // Keep the segment as-is
        normalized_segments.push(segment)
      }
    }
    
    // Reconstruct the normalized path
    const normalized_path = '/' + normalized_segments.join('/')
    return normalized_path
  }

  /**
   * Check rate limit for consecutive calls to the same endpoint
   */
  private checkRateLimit(endpoint: string): void {
    const endpoint_path = this.extractEndpointPath(endpoint)

    if (this.last_endpoint === endpoint_path) {
      // Same endpoint - increment counter
      this.consecutive_call_count++
      
      if (this.consecutive_call_count > this.RATE_LIMIT) {
        throw new Error(
          `Rate limit exceeded: More than ${this.RATE_LIMIT} consecutive calls to the same endpoint (${endpoint_path}). ` +
          'Please wait before making more calls to this endpoint.'
        )
      }
    } else {
      // Different endpoint - reset counter
      this.last_endpoint = endpoint_path
      this.consecutive_call_count = 1
    }
  }

  /**
   * Build URL with API key query parameter
   */
  private build_url(endpoint: string, params?: Record<string, string | number>): string {
    // Handle relative URLs (for proxy) vs absolute URLs
    let url: URL
    if (this.base_url.startsWith('/')) {
      // Relative URL - use window.location.origin as base or fallback to full URL
      // In test environment, we'll use the full URL
      if (typeof window !== 'undefined' && window.location) {
        url = new URL(`${this.base_url}${endpoint}`, window.location.origin)
      } else {
        // Fallback for test environments or when window is not available
        url = new URL(`${this.base_url}${endpoint}`, 'http://localhost:5174')
      }
    } else {
      // Absolute URL
      url = new URL(`${this.base_url}${endpoint}`)
    }
    
    url.searchParams.set('api_key', this.api_key)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value))
      })
    }

    return url.toString()
  }

  /**
   * Make API request with error handling and rate limiting
   */
  private async request<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    // Check rate limit before making the request
    this.checkRateLimit(endpoint)

    const url = this.build_url(endpoint, params)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        await this.handle_error(response)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        throw error
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Handle API errors
   */
  private async handle_error(response: Response): Promise<never> {
    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid API key')
    }
    if (response.status === 403) {
      throw new Error('Forbidden: API key does not have permission')
    }
    if (response.status === 429) {
      throw new Error('Too Many Requests: Rate limit exceeded')
    }
    if (response.status === 404) {
      throw new Error('Not Found: Resource does not exist')
    }

    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  /**
   * Format date as DD-MM-YYYY for YesPlan API
   */
  private formatDateForApi(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  /**
   * Build events endpoint path with optional date filter
   */
  private buildEventsEndpoint(start_date?: Date, end_date?: Date): string {
    if (start_date && end_date) {
      const start_str = this.formatDateForApi(start_date)
      const end_str = this.formatDateForApi(end_date)
      const filter = `date:${start_str} TO ${end_str}`
      return `/events/${encodeURIComponent(filter)}`
    }
    return '/events'
  }

  /**
   * Fetch events with pagination support, optionally limited to a date range
   * 
   * @param start_date - Optional start date to limit fetching (only fetch events after this date)
   * @param end_date - Optional end date to limit fetching (only fetch events before this date)
   * @param max_pages - Maximum number of pages to fetch (default: 10 to avoid rate limiting)
   */
  async fetchEvents(start_date?: Date, end_date?: Date, max_pages: number = 10): Promise<YesPlanEvent[]> {
    if (import.meta.env.DEV) {
      console.log('[YesPlanApiService] fetchEvents: Starting event fetch', {
        start_date: start_date?.toISOString(),
        end_date: end_date?.toISOString(),
        max_pages,
      })
    }

    const all_events: YesPlanEvent[] = []
    let book: number | undefined = undefined
    let page = 1
    let has_more = true
    let pages_fetched = 0

    // Build the endpoint path with date filter if provided
    const endpoint = this.buildEventsEndpoint(start_date, end_date)

    while (has_more && pages_fetched < max_pages) {
      const params: Record<string, string | number> = {}
      if (book !== undefined) {
        params.book = book
        params.page = page
      }

      if (import.meta.env.DEV) {
        console.log('[YesPlanApiService] fetchEvents: Fetching page', {
          page,
          book,
          params,
          endpoint,
        })
      }

      const response = await this.request<YesPlanResponse<unknown>>(endpoint, params)
      
      if (import.meta.env.DEV) {
        console.log('[YesPlanApiService] fetchEvents: Raw API response received', {
          page,
          book,
          total_items: response.data?.length || 0,
          has_pagination: !!response.pagination,
          pagination_info: response.pagination ? {
            book: response.pagination.book,
            page: response.pagination.page,
            hasMore: response.pagination.hasMore,
            next: response.pagination.next,
          } : null,
          sample_event_keys: response.data?.[0] ? Object.keys(response.data[0] as Record<string, unknown>) : [],
        })
        
        // Log raw events from API response - PROMINENT LOGGING FOR DEBUGGING
        if (response.data && response.data.length > 0) {
          console.log('═══════════════════════════════════════════════════════════')
          console.log(`📅 EVENTS FROM /events ENDPOINT (Page ${page})`)
          console.log(`   Total events in this page: ${response.data.length}`)
          console.log('═══════════════════════════════════════════════════════════')
          
          response.data.forEach((event: unknown, index: number) => {
            const e = event as Record<string, unknown>
            console.log(`\n[Event ${index + 1}]`, {
              id: e.id,
              name: e.name,
              starttime: e.starttime,
              endtime: e.endtime,
              defaultschedulestart: e.defaultschedulestart,
              defaultscheduleend: e.defaultscheduleend,
              start: e.start,
              end: e.end,
              owner: e.owner,
              status: e.status,
            })
          })
          
          console.log('═══════════════════════════════════════════════════════════\n')
          
          // Also log as a structured object for easier inspection
          console.log('[YesPlanApiService] fetchEvents: Raw events from API (structured)', {
            page,
            event_count: response.data.length,
            events: response.data.map((event: unknown) => {
              const e = event as Record<string, unknown>
              return {
                id: e.id,
                name: e.name,
                starttime: e.starttime,
                endtime: e.endtime,
                defaultschedulestart: e.defaultschedulestart,
                defaultscheduleend: e.defaultscheduleend,
                start: e.start,
                end: e.end,
                owner: e.owner,
                status: e.status,
              }
            }),
          })
        } else {
          console.log('⚠️  No events returned from /events endpoint for this page')
        }
      }

      const events = (response.data || []).map((event: unknown) => this.normalizeEvent(event as Record<string, unknown>))
      
      if (import.meta.env.DEV && page === 1) {
        // Log normalized events from first page
        console.log('[YesPlanApiService] fetchEvents: Normalized events (page 1)', {
          event_count: events.length,
          events: events.map((e) => ({
            id: e.id,
            name: e.name,
            start: e.start.toISOString(),
            end: e.end.toISOString(),
            status: e.status,
            owner: e.owner,
          })),
        })
      }
      
      if (import.meta.env.DEV) {
        console.log('[YesPlanApiService] fetchEvents: Page processed', {
          page,
          events_in_page: events.length,
          total_events_so_far: all_events.length + events.length,
        })
      }
      
      all_events.push(...events)
      pages_fetched++

      if (response.pagination) {
        // Check if there's a next page using either 'next' URL or 'hasMore' flag
        if (response.pagination.next) {
          // Parse book and page from the next URL if available
          try {
            const next_url = new URL(response.pagination.next)
            const next_book = next_url.searchParams.get('book')
            const next_page = next_url.searchParams.get('page')
            if (next_book) book = parseInt(next_book, 10)
            if (next_page) page = parseInt(next_page, 10)
          } catch {
            // If URL parsing fails, try to increment page
            page++
          }
          has_more = true
        } else if (response.pagination.hasMore !== undefined) {
          has_more = response.pagination.hasMore
          if (response.pagination.book !== undefined) {
            book = response.pagination.book
          }
          page++
        } else {
          // No pagination info means we're done
          has_more = false
        }
      } else {
        has_more = false
      }
    }

    if (import.meta.env.DEV) {
      console.log('[YesPlanApiService] fetchEvents: Fetch complete', {
        total_events: all_events.length,
        pages_fetched,
        date_range: start_date || end_date ? {
          start: start_date?.toISOString().split('T')[0],
          end: end_date?.toISOString().split('T')[0],
        } : null,
        sample_event_ids: all_events.slice(0, 5).map((e) => e.id),
      })
    }

    return all_events
  }

  /**
   * Filter events for a specific month (client-side filtering, no API call)
   * 
   * @param events - Array of events to filter
   * @param date - A date within the target month
   * @returns Events that overlap with the specified month
   */
  filterEventsForMonth(events: YesPlanEvent[], date: Date): YesPlanEvent[] {
    const month_start = new Date(date.getFullYear(), date.getMonth(), 1)
    const month_end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
    
    return events.filter((event) => {
      const event_start = new Date(event.start)
      const event_end = new Date(event.end)
      
      // Event overlaps with month if:
      // - Event starts within the month, OR
      // - Event ends within the month, OR
      // - Event spans the entire month (starts before and ends after)
      return (
        (event_start >= month_start && event_start <= month_end) ||
        (event_end >= month_start && event_end <= month_end) ||
        (event_start <= month_start && event_end >= month_end)
      )
    })
  }

  /**
   * Fetch all resources with pagination support
   */
  async fetchResources(): Promise<YesPlanResource[]> {
    const all_resources: YesPlanResource[] = []
    let book: number | undefined = undefined
    let page = 1
    let has_more = true

    while (has_more) {
      const params: Record<string, string | number> = {}
      if (book !== undefined) {
        params.book = book
        params.page = page
      }

      const response = await this.request<YesPlanResponse<unknown>>('/resources', params)
      const resources = (response.data || []).map((resource: unknown) =>
        this.normalizeResource(resource as Record<string, unknown>)
      )
      all_resources.push(...resources)

      if (response.pagination) {
        book = response.pagination.book
        has_more = response.pagination.hasMore ?? false
        page++
      } else {
        has_more = false
      }
    }

    return all_resources
  }

  /**
   * Fetch detailed information for a specific event
   */
  async fetchEventDetails(event_id: string): Promise<YesPlanEvent> {
    const response = await this.request<Record<string, unknown>>(`/event/${event_id}`)
    
    // TEMPORARY: Log response structure for analysis (Task 2.1)
    if (import.meta.env.DEV) {
      console.log('[API Analysis] /api/event/{id} response structure:', {
        event_id,
        has_contacts: 'contacts' in response || 'contact_ids' in response,
        has_resources: 'resources' in response || 'resource_ids' in response,
        contact_keys: Object.keys(response).filter(key => key.toLowerCase().includes('contact')),
        resource_keys: Object.keys(response).filter(key => key.toLowerCase().includes('resource')),
        full_response_keys: Object.keys(response),
        sample_response: JSON.stringify(response, null, 2).substring(0, 1000), // First 1000 chars
      })
    }
    
    return this.normalizeEvent(response)
  }

  /**
   * Normalize location data structure
   */
  normalizeLocation(raw_location: Record<string, unknown>): YesPlanLocation {
    return {
      id: String(raw_location.id || ''),
      name: String(raw_location.name || ''),
      url: raw_location.url ? String(raw_location.url) : undefined,
      _type: raw_location._type ? String(raw_location._type) : undefined,
      ...raw_location,
    }
  }

  /**
   * Fetch event details and extract embedded resources/locations if available
   * Returns both the event and any resources/locations found in the response
   * Note: YesPlan API returns "locations" which represent the physical rooms/spaces
   */
  async fetchEventDetailsWithResources(event_id: string): Promise<{
    event: YesPlanEvent
    resources: YesPlanResource[]
  }> {
    const response = await this.request<Record<string, unknown>>(`/event/${event_id}`)
    
    // Extract resources/locations from the response if they're embedded
    // Check multiple possible locations and formats
    let resources: YesPlanResource[] = []
    
    // First, check for 'locations' array (this is what YesPlan API actually returns for rooms)
    if ('locations' in response && Array.isArray(response.locations)) {
      resources = (response.locations as unknown[]).map((location: unknown) => {
        const location_obj = location as Record<string, unknown>
        // Convert location to resource format for display
        return {
          id: String(location_obj.id || ''),
          name: String(location_obj.name || ''),
          description: undefined,
          ...location_obj,
        } as YesPlanResource
      })
    }
    // Check for 'resources' array (fallback)
    else if ('resources' in response && Array.isArray(response.resources)) {
      resources = (response.resources as unknown[]).map((resource: unknown) =>
        this.normalizeResource(resource as Record<string, unknown>)
      )
    }
    // Check for 'resource' (singular) array
    else if ('resource' in response && Array.isArray(response.resource)) {
      resources = (response.resource as unknown[]).map((resource: unknown) =>
        this.normalizeResource(resource as Record<string, unknown>)
      )
    }
    // Check for nested 'data.resources' structure
    else if ('data' in response && typeof response.data === 'object' && response.data !== null) {
      const data = response.data as Record<string, unknown>
      if ('resources' in data && Array.isArray(data.resources)) {
        resources = (data.resources as unknown[]).map((resource: unknown) =>
          this.normalizeResource(resource as Record<string, unknown>)
        )
      }
    }
    
    // Log what we found for debugging
    if (import.meta.env.DEV) {
      console.log('[YesPlanApiService] fetchEventDetailsWithResources: Resource/Location extraction', {
        event_id,
        found_resources: resources.length,
        has_locations_field: 'locations' in response,
        has_resources_field: 'resources' in response,
        has_resource_field: 'resource' in response,
        locations_count: ('locations' in response && Array.isArray(response.locations)) 
          ? (response.locations as unknown[]).length 
          : 0,
        response_keys: Object.keys(response),
      })
    }
    
    const event = this.normalizeEvent(response)
    
    return { event, resources }
  }

  /**
   * Fetch resources associated with a specific event
   * Note: This endpoint may not exist for all events. Use fetchEventDetailsWithResources first.
   */
  async fetchEventResources(event_id: string): Promise<YesPlanResource[]> {
    try {
      const response = await this.request<YesPlanResponse<unknown>>(`/event/${event_id}/resources`)
      return (response.data || []).map((resource: unknown) => this.normalizeResource(resource as Record<string, unknown>))
    } catch (error) {
      // If the endpoint doesn't exist, return empty array
      if (error instanceof Error && error.message.includes('does not exist')) {
        if (import.meta.env.DEV) {
          console.warn(`[YesPlanApiService] /api/event/${event_id}/resources endpoint not available`)
        }
        return []
      }
      throw error
    }
  }

  /**
   * Fetch contacts associated with a specific event
   */
  async fetchEventContacts(event_id: string): Promise<YesPlanContact[]> {
    const response = await this.request<YesPlanResponse<unknown>>(`/event/${event_id}/contacts`)
    return (response.data || []).map((contact: unknown) => this.normalizeContact(contact as Record<string, unknown>))
  }

  /**
   * Fetch all events for a specific contact
   * 
   * Note: The YesPlan API doesn't support /api/contact/{id}/events endpoint.
   * This method returns all events - filtering by contact should be done client-side
   * using the contact information fetched lazily when needed.
   * 
   * @param contact_id - Contact identifier (currently unused due to API limitation)
   * @returns Array of all events (filtering by contact should be done client-side)
   */
  async fetchEventsForContact(contact_id: string): Promise<YesPlanEvent[]> {
    // The YesPlan API doesn't support /api/contact/{id}/events endpoint
    // Fallback: Fetch all events - filtering by contact will be done client-side
    // when contacts are fetched lazily for events
    
    if (import.meta.env.DEV) {
      console.warn(`[YesPlanApiService] /api/contact/{id}/events not supported. Fetching all events - filtering will be done client-side.`)
    }
    
    // Fetch all events (same as fetchEvents())
    return await this.fetchEvents()
  }
  
  /**
   * DEPRECATED: Original implementation that tried to use /api/contact/{id}/events
   * This endpoint doesn't exist in the YesPlan API
   */
  async _fetchEventsForContact_original(contact_id: string): Promise<YesPlanEvent[]> {
    const all_events: YesPlanEvent[] = []
    let book: number | undefined = undefined
    let page = 1
    let has_more = true

    while (has_more) {
      const params: Record<string, string | number> = {}
      if (book !== undefined) {
        params.book = book
        params.page = page
      }

      const response = await this.request<YesPlanResponse<unknown>>(`/contact/${contact_id}/events`, params)
      
      // TEMPORARY: Log response structure for analysis (Task 2.2)
      if (import.meta.env.DEV && page === 1) {
        const first_event = response.data?.[0] as Record<string, unknown> | undefined
        console.log('[API Analysis] /api/contact/{id}/events response structure:', {
          contact_id,
          total_events: response.data?.length || 0,
          has_pagination: !!response.pagination,
          first_event_keys: first_event ? Object.keys(first_event) : [],
          first_event_has_contacts: first_event ? ('contacts' in first_event || 'contact_ids' in first_event) : false,
          first_event_has_resources: first_event ? ('resources' in first_event || 'resource_ids' in first_event) : false,
          contact_keys: first_event ? Object.keys(first_event).filter(key => key.toLowerCase().includes('contact')) : [],
          resource_keys: first_event ? Object.keys(first_event).filter(key => key.toLowerCase().includes('resource')) : [],
          sample_event: first_event ? JSON.stringify(first_event, null, 2).substring(0, 1000) : null,
        })
      }
      
      const events = (response.data || []).map((event: unknown) => this.normalizeEvent(event as Record<string, unknown>))
      all_events.push(...events)

      if (response.pagination) {
        // Check if there's a next page using either 'next' URL or 'hasMore' flag
        if (response.pagination.next) {
          // Parse book and page from the next URL if available
          try {
            const next_url = new URL(response.pagination.next)
            const next_book = next_url.searchParams.get('book')
            const next_page = next_url.searchParams.get('page')
            if (next_book) book = parseInt(next_book, 10)
            if (next_page) page = parseInt(next_page, 10)
          } catch {
            // If URL parsing fails, try to increment page
            page++
          }
          has_more = true
        } else if (response.pagination.hasMore !== undefined) {
          has_more = response.pagination.hasMore
          if (response.pagination.book !== undefined) {
            book = response.pagination.book
          }
          page++
        } else {
          // No pagination info means we're done
          has_more = false
        }
      } else {
        has_more = false
      }
    }

    return all_events
  }

  /**
   * Find contact ID by name with caching
   * 
   * @param name - Contact name to search for (e.g., "Impro Neuf")
   * @returns Contact ID if found, null otherwise
   */
  async findContactByName(name: string): Promise<string | null> {
    // Check cache first
    if (this.contact_cache.has(name)) {
      const cached_id = this.contact_cache.get(name) || null
      if (import.meta.env.DEV) {
        console.log(`[YesPlanApiService] Using cached contact ID for "${name}": ${cached_id}`)
      }
      return cached_id
    }

    try {
      // Search contacts
      const search_url = `/contacts/${encodeURIComponent(name)}`
      if (import.meta.env.DEV) {
        console.log(`[YesPlanApiService] Searching for contact: "${name}" at ${search_url}`)
      }
      
      const response = await this.request<YesPlanResponse<unknown>>(search_url)
      const contacts = response.data || []

      if (import.meta.env.DEV) {
        console.log(`[YesPlanApiService] Found ${contacts.length} contacts matching "${name}"`)
        if (contacts.length > 0) {
          console.log(`[YesPlanApiService] Contact names found:`, contacts.map((c: unknown) => (c as Record<string, unknown>).name))
        }
      }

      // Find exact match
      const contact = contacts.find((c: unknown) => {
        const contact_obj = c as Record<string, unknown>
        return contact_obj.name === name
      })

      if (contact) {
        const contact_id = String((contact as Record<string, unknown>).id || '')
        this.contact_cache.set(name, contact_id)
        if (import.meta.env.DEV) {
          console.log(`[YesPlanApiService] Found exact match for "${name}": ${contact_id}`)
        }
        return contact_id
      }

      if (import.meta.env.DEV) {
        console.warn(`[YesPlanApiService] No exact match found for "${name}" in ${contacts.length} results`)
      }
      return null
    } catch (error) {
      // Handle 404 Not Found gracefully
      if (error instanceof Error && error.message.includes('does not exist')) {
        if (import.meta.env.DEV) {
          console.warn(`[YesPlanApiService] Contact search returned 404 for "${name}"`)
        }
        return null
      }
      // Re-throw other errors
      if (import.meta.env.DEV) {
        console.error(`[YesPlanApiService] Error searching for contact "${name}":`, error)
      }
      throw error
    }
  }

  /**
   * Parse ISO 8601 date string to Date object
   */
  parseDate(date_string: string): Date {
    return new Date(date_string)
  }

  /**
   * Normalize event data structure
   */
  normalizeEvent(raw_event: Record<string, unknown>): YesPlanEvent {
    // Log before normalization in development mode
    if (import.meta.env.DEV) {
      console.log('[YesPlanApiService] normalizeEvent: Before normalization', {
        event_id: raw_event.id,
        has_starttime: !!raw_event.starttime,
        has_endtime: !!raw_event.endtime,
        has_defaultschedulestart: !!raw_event.defaultschedulestart,
        has_defaultscheduleend: !!raw_event.defaultscheduleend,
        has_start: !!raw_event.start,
        has_end: !!raw_event.end,
        starttime: raw_event.starttime,
        endtime: raw_event.endtime,
        defaultschedulestart: raw_event.defaultschedulestart,
        defaultscheduleend: raw_event.defaultscheduleend,
      })
    }

    // Extract start and end times - API uses 'starttime' and 'endtime'
    // Priority: starttime > start > defaultschedulestart
    const start_time = raw_event.starttime || raw_event.start || raw_event.defaultschedulestart
    // Priority: endtime > end > defaultscheduleend
    const end_time = raw_event.endtime || raw_event.end || raw_event.defaultscheduleend
    
    // Extract status - API returns status as an object with 'name' property
    let status_value = ''
    if (raw_event.status) {
      if (typeof raw_event.status === 'object' && raw_event.status !== null && 'name' in raw_event.status) {
        status_value = String((raw_event.status as { name: string }).name)
      } else {
        status_value = String(raw_event.status)
      }
    }
    
    // Parse dates with validation
    let start_date: Date
    let end_date: Date
    
    if (start_time && start_time !== null && String(start_time).trim() !== '') {
      try {
        start_date = this.parseDate(String(start_time))
        // Validate the parsed date
        if (isNaN(start_date.getTime())) {
          if (import.meta.env.DEV) {
            console.warn('[YesPlanApiService] normalizeEvent: Invalid start date, using current date', {
              event_id: raw_event.id,
              start_time,
            })
          }
          start_date = new Date()
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[YesPlanApiService] normalizeEvent: Error parsing start date, using current date', {
            event_id: raw_event.id,
            start_time,
            error,
          })
        }
        start_date = new Date()
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[YesPlanApiService] normalizeEvent: No start time found, using current date', {
          event_id: raw_event.id,
        })
      }
      start_date = new Date()
    }
    
    if (end_time && end_time !== null && String(end_time).trim() !== '') {
      try {
        end_date = this.parseDate(String(end_time))
        // Validate the parsed date
        if (isNaN(end_date.getTime())) {
          if (import.meta.env.DEV) {
            console.warn('[YesPlanApiService] normalizeEvent: Invalid end date, using current date', {
              event_id: raw_event.id,
              end_time,
            })
          }
          end_date = new Date()
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[YesPlanApiService] normalizeEvent: Error parsing end date, using current date', {
            event_id: raw_event.id,
            end_time,
            error,
          })
        }
        end_date = new Date()
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[YesPlanApiService] normalizeEvent: No end time found, using current date', {
          event_id: raw_event.id,
        })
      }
      end_date = new Date()
    }
    
    const normalized: YesPlanEvent = {
      ...raw_event,
      id: String(raw_event.id || ''),
      name: String(raw_event.name || ''),
      start: start_date,
      end: end_date,
      status: status_value,
      description: raw_event.description ? String(raw_event.description) : undefined,
    }
    
    // Log after normalization in development mode
    if (import.meta.env.DEV) {
      console.log('[YesPlanApiService] normalizeEvent: After normalization', {
        event_id: normalized.id,
        event_name: normalized.name,
        start: normalized.start.toISOString(),
        end: normalized.end.toISOString(),
        status: normalized.status,
        start_is_valid: !isNaN(normalized.start.getTime()),
        end_is_valid: !isNaN(normalized.end.getTime()),
      })
    }
    
    // Final validation - ensure dates are valid
    if (isNaN(normalized.start.getTime()) || isNaN(normalized.end.getTime())) {
      if (import.meta.env.DEV) {
        console.error('[YesPlanApiService] normalizeEvent: Normalized event has invalid dates', {
          event_id: normalized.id,
          start_valid: !isNaN(normalized.start.getTime()),
          end_valid: !isNaN(normalized.end.getTime()),
        })
      }
      // Fallback to current date if validation fails
      normalized.start = isNaN(normalized.start.getTime()) ? new Date() : normalized.start
      normalized.end = isNaN(normalized.end.getTime()) ? new Date() : normalized.end
    }
    
    return normalized
  }

  /**
   * Normalize resource data structure
   */
  normalizeResource(raw_resource: Record<string, unknown>): YesPlanResource {
    return {
      id: String(raw_resource.id || ''),
      name: String(raw_resource.name || ''),
      description: raw_resource.description ? String(raw_resource.description) : undefined,
      ...raw_resource,
    }
  }

  /**
   * Normalize contact data structure
   */
  normalizeContact(raw_contact: Record<string, unknown>): YesPlanContact {
    return {
      id: String(raw_contact.id || ''),
      name: String(raw_contact.name || ''),
      email: raw_contact.email ? String(raw_contact.email) : undefined,
      ...raw_contact,
    }
  }
}

