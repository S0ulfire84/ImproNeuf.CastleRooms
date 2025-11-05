import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { YesPlanApiService } from '../yesplan-api'

// Mock fetch globally
global.fetch = vi.fn()

describe('YesPlanApiService', () => {
  const mock_api_key = 'test-api-key-123'
  let api_service: YesPlanApiService

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up environment variable
    import.meta.env.VITE_YESPLAN_API_KEY = mock_api_key
    api_service = new YesPlanApiService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('should include API key in all requests', async () => {
      const mock_response = {
        ok: true,
        json: async () => ({ data: [] }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      await api_service.fetchEvents()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=' + mock_api_key),
        expect.any(Object)
      )
    })

    it('should throw error if API key is missing', () => {
      import.meta.env.VITE_YESPLAN_API_KEY = ''
      expect(() => new YesPlanApiService()).toThrow('VITE_YESPLAN_API_KEY is required')
    })
  })

  describe('fetchEvents', () => {
    it('should fetch events successfully', async () => {
      const mock_events = [
        {
          id: 'event-1',
          name: 'Test Event',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T12:00:00Z',
          status: 'confirmed',
        },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({
          data: mock_events,
          pagination: { book: 123, page: 1, hasMore: false },
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.fetchEvents()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('event-1')
      expect(result[0].name).toBe('Test Event')
      expect(result[0].start).toBeInstanceOf(Date)
      expect(result[0].end).toBeInstanceOf(Date)
      expect(result[0].status).toBe('confirmed')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events'),
        expect.any(Object)
      )
    })

    it('should handle pagination correctly', async () => {
      const first_page = [
        { id: 'event-1', name: 'Event 1', start: '2024-01-15T10:00:00Z', end: '2024-01-15T12:00:00Z', status: 'confirmed' },
      ]
      const second_page = [
        { id: 'event-2', name: 'Event 2', start: '2024-01-16T10:00:00Z', end: '2024-01-16T12:00:00Z', status: 'confirmed' },
      ]

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: first_page,
            pagination: { book: 123, page: 1, hasMore: true },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: second_page,
            pagination: { book: 123, page: 2, hasMore: false },
          }),
        } as Response)

      const result = await api_service.fetchEvents()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('event-1')
      expect(result[0].start).toBeInstanceOf(Date)
      expect(result[1].id).toBe('event-2')
      expect(result[1].start).toBeInstanceOf(Date)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should throw error on 401 Unauthorized', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response)

      await expect(api_service.fetchEvents()).rejects.toThrow('Invalid API key')
    })

    it('should throw error on 403 Forbidden', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response)

      await expect(api_service.fetchEvents()).rejects.toThrow('does not have permission')
    })

    it('should throw error on 429 Too Many Requests', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Retry-After': '5' }),
      } as Response)

      await expect(api_service.fetchEvents()).rejects.toThrow('Too Many Requests')
    })

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(api_service.fetchEvents()).rejects.toThrow('Network error')
    })
  })

  describe('fetchResources', () => {
    it('should fetch resources successfully', async () => {
      const mock_resources = [
        { id: 'resource-1', name: 'Room A', description: 'Conference room' },
        { id: 'resource-2', name: 'Room B', description: 'Meeting room' },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({
          data: mock_resources,
          pagination: { book: 123, page: 1, hasMore: false },
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.fetchResources()

      expect(result).toEqual(mock_resources)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/resources'),
        expect.any(Object)
      )
    })

    it('should handle pagination for resources', async () => {
      const first_page = [{ id: 'resource-1', name: 'Room 1' }]
      const second_page = [{ id: 'resource-2', name: 'Room 2' }]

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: first_page,
            pagination: { book: 123, page: 1, hasMore: true },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: second_page,
            pagination: { book: 123, page: 2, hasMore: false },
          }),
        } as Response)

      const result = await api_service.fetchResources()

      expect(result).toEqual([...first_page, ...second_page])
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('fetchEventDetails', () => {
    it('should fetch event details successfully', async () => {
      const event_id = 'event-123'
      const mock_event = {
        id: event_id,
        name: 'Test Event',
        description: 'Event description',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T12:00:00Z',
        status: 'confirmed',
      }
      const mock_response = {
        ok: true,
        json: async () => mock_event,
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.fetchEventDetails(event_id)

      expect(result.id).toBe(event_id)
      expect(result.name).toBe('Test Event')
      expect(result.description).toBe('Event description')
      expect(result.start).toBeInstanceOf(Date)
      expect(result.end).toBeInstanceOf(Date)
      expect(result.status).toBe('confirmed')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/event/${event_id}`),
        expect.any(Object)
      )
    })

    it('should throw error on 404 Not Found', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(api_service.fetchEventDetails('nonexistent')).rejects.toThrow('does not exist')
    })
  })

  describe('fetchEventResources', () => {
    it('should fetch event resources successfully', async () => {
      const event_id = 'event-123'
      const mock_resources = [
        { id: 'resource-1', name: 'Room A' },
        { id: 'resource-2', name: 'Room B' },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({ data: mock_resources }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.fetchEventResources(event_id)

      expect(result).toEqual(mock_resources)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/event/${event_id}/resources`),
        expect.any(Object)
      )
    })
  })

  describe('fetchEventContacts', () => {
    it('should fetch event contacts successfully', async () => {
      const event_id = 'event-123'
      const mock_contacts = [
        { id: 'contact-1', name: 'John Doe', email: 'john@example.com' },
        { id: 'contact-2', name: 'Jane Smith', email: 'jane@example.com' },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({ data: mock_contacts }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.fetchEventContacts(event_id)

      expect(result).toEqual(mock_contacts)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/event/${event_id}/contacts`),
        expect.any(Object)
      )
    })
  })

  describe('Data Transformation Utilities', () => {
    it('should parse ISO 8601 dates to Date objects', () => {
      const iso_string = '2024-01-15T10:00:00Z'
      const date = api_service.parseDate(iso_string)

      expect(date).toBeInstanceOf(Date)
      expect(date.toISOString()).toBe('2024-01-15T10:00:00.000Z')
    })

    it('should normalize event data structure', () => {
      const raw_event: Record<string, unknown> = {
        id: 'event-1',
        name: 'Test Event',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T12:00:00Z',
        status: 'confirmed',
      }
      const normalized = api_service.normalizeEvent(raw_event)

      expect(normalized).toHaveProperty('id', 'event-1')
      expect(normalized).toHaveProperty('name', 'Test Event')
      expect(normalized.start).toBeInstanceOf(Date)
      expect(normalized.end).toBeInstanceOf(Date)
    })

    it('should normalize resource data structure', () => {
      const raw_resource = {
        id: 'resource-1',
        name: 'Room A',
        description: 'Conference room',
      }
      const normalized = api_service.normalizeResource(raw_resource)

      expect(normalized).toHaveProperty('id', 'resource-1')
      expect(normalized).toHaveProperty('name', 'Room A')
    })

    it('should normalize contact data structure', () => {
      const raw_contact = {
        id: 'contact-1',
        name: 'John Doe',
        email: 'john@example.com',
      }
      const normalized = api_service.normalizeContact(raw_contact)

      expect(normalized).toHaveProperty('id', 'contact-1')
      expect(normalized).toHaveProperty('name', 'John Doe')
      expect(normalized).toHaveProperty('email', 'john@example.com')
    })
  })
})

