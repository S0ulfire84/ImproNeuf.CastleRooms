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

export interface YesPlanContact {
  id: string
  name: string
  email?: string
  [key: string]: unknown
}

export interface PaginationInfo {
  book: number
  page: number
  hasMore: boolean
}

export interface YesPlanResponse<T> {
  data: T[]
  pagination?: PaginationInfo
}

export class YesPlanApiService {
  private api_key: string
  private base_url: string

  constructor() {
    const api_key = import.meta.env.VITE_YESPLAN_API_KEY
    if (!api_key) {
      throw new Error('VITE_YESPLAN_API_KEY is required')
    }
    this.api_key = api_key
    this.base_url = BASE_URL
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
   * Make API request with error handling
   */
  private async request<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
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
   * Fetch all events with pagination support
   */
  async fetchEvents(): Promise<YesPlanEvent[]> {
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

      const response = await this.request<YesPlanResponse<unknown>>('/events', params)
      const events = (response.data || []).map((event: unknown) => this.normalizeEvent(event as Record<string, unknown>))
      all_events.push(...events)

      if (response.pagination) {
        book = response.pagination.book
        has_more = response.pagination.hasMore
        page++
      } else {
        has_more = false
      }
    }

    return all_events
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
        has_more = response.pagination.hasMore
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
    return this.normalizeEvent(response)
  }

  /**
   * Fetch resources associated with a specific event
   */
  async fetchEventResources(event_id: string): Promise<YesPlanResource[]> {
    const response = await this.request<YesPlanResponse<unknown>>(`/event/${event_id}/resources`)
    return (response.data || []).map((resource: unknown) => this.normalizeResource(resource as Record<string, unknown>))
  }

  /**
   * Fetch contacts associated with a specific event
   */
  async fetchEventContacts(event_id: string): Promise<YesPlanContact[]> {
    const response = await this.request<YesPlanResponse<unknown>>(`/event/${event_id}/contacts`)
    return (response.data || []).map((contact: unknown) => this.normalizeContact(contact as Record<string, unknown>))
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
    const normalized: YesPlanEvent = {
      ...raw_event,
      id: String(raw_event.id || ''),
      name: String(raw_event.name || ''),
      start: this.parseDate(String(raw_event.start || '')),
      end: this.parseDate(String(raw_event.end || '')),
      status: String(raw_event.status || ''),
      description: raw_event.description ? String(raw_event.description) : undefined,
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

