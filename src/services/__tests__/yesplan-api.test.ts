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

  describe('findContactByName', () => {
    it('should find contact by name successfully', async () => {
      const contact_name = 'Impro Neuf'
      const mock_contacts = [
        { id: 'contact-123', name: 'Impro Neuf', email: 'contact@improneuf.be' },
        { id: 'contact-456', name: 'Other Contact', email: 'other@example.com' },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({ data: mock_contacts }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.findContactByName(contact_name)

      expect(result).toBe('contact-123')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contacts/Impro%20Neuf'),
        expect.any(Object)
      )
    })

    it('should return null when contact is not found', async () => {
      const contact_name = 'Nonexistent Contact'
      const mock_response = {
        ok: true,
        json: async () => ({ data: [] }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.findContactByName(contact_name)

      expect(result).toBeNull()
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contacts/Nonexistent%20Contact'),
        expect.any(Object)
      )
    })

    it('should return null when no exact name match is found', async () => {
      const contact_name = 'Impro Neuf'
      const mock_contacts = [
        { id: 'contact-456', name: 'Impro Neuf Festival', email: 'festival@example.com' },
        { id: 'contact-789', name: 'Neuf Impro', email: 'neuf@example.com' },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({ data: mock_contacts }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.findContactByName(contact_name)

      expect(result).toBeNull()
    })

    it('should cache contact ID after first lookup', async () => {
      const contact_name = 'Impro Neuf'
      const mock_contacts = [
        { id: 'contact-123', name: 'Impro Neuf', email: 'contact@improneuf.be' },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({ data: mock_contacts }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      // First call
      const result1 = await api_service.findContactByName(contact_name)
      expect(result1).toBe('contact-123')
      expect(fetch).toHaveBeenCalledTimes(1)

      // Second call should use cache
      const result2 = await api_service.findContactByName(contact_name)
      expect(result2).toBe('contact-123')
      expect(fetch).toHaveBeenCalledTimes(1) // No additional API call
    })

    it('should handle 404 Not Found error gracefully', async () => {
      const contact_name = 'Nonexistent Contact'
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      const result = await api_service.findContactByName(contact_name)

      expect(result).toBeNull()
    })

    it('should handle network errors', async () => {
      const contact_name = 'Impro Neuf'
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(api_service.findContactByName(contact_name)).rejects.toThrow('Network error')
    })

    it('should handle empty response data', async () => {
      const contact_name = 'Impro Neuf'
      const mock_response = {
        ok: true,
        json: async () => ({ data: null }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.findContactByName(contact_name)

      expect(result).toBeNull()
    })

    it('should URL encode contact name properly', async () => {
      const contact_name = 'Oslo Impro Festival'
      const mock_contacts = [
        { id: 'contact-789', name: 'Oslo Impro Festival', email: 'oslo@example.com' },
      ]
      const mock_response = {
        ok: true,
        json: async () => ({ data: mock_contacts }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      await api_service.findContactByName(contact_name)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contacts/Oslo%20Impro%20Festival'),
        expect.any(Object)
      )
    })
  })

  describe('fetchEventsForContact', () => {
    it('should fetch events for contact successfully', async () => {
      const contact_id = 'contact-123'
      const mock_events = [
        {
          id: 'event-1',
          name: 'Test Event 1',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T12:00:00Z',
          status: 'confirmed',
        },
        {
          id: 'event-2',
          name: 'Test Event 2',
          start: '2024-01-16T10:00:00Z',
          end: '2024-01-16T12:00:00Z',
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

      const result = await api_service.fetchEventsForContact(contact_id)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('event-1')
      expect(result[0].name).toBe('Test Event 1')
      expect(result[0].start).toBeInstanceOf(Date)
      expect(result[1].id).toBe('event-2')
      expect(result[1].start).toBeInstanceOf(Date)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events'),
        expect.any(Object)
      )
    })

    it('should handle pagination correctly', async () => {
      const contact_id = 'contact-123'
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

      const result = await api_service.fetchEventsForContact(contact_id)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('event-1')
      expect(result[0].start).toBeInstanceOf(Date)
      expect(result[1].id).toBe('event-2')
      expect(result[1].start).toBeInstanceOf(Date)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should return empty array when contact has no events', async () => {
      const contact_id = 'contact-123'
      const mock_response = {
        ok: true,
        json: async () => ({
          data: [],
          pagination: { book: 123, page: 1, hasMore: false },
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.fetchEventsForContact(contact_id)

      expect(result).toEqual([])
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events'),
        expect.any(Object)
      )
    })

    it('should handle 404 Not Found error gracefully', async () => {
      const contact_id = 'nonexistent-contact'
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(api_service.fetchEventsForContact(contact_id)).rejects.toThrow('does not exist')
    })

    it('should handle network errors', async () => {
      const contact_id = 'contact-123'
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(api_service.fetchEventsForContact(contact_id)).rejects.toThrow('Network error')
    })

    it('should handle empty response data', async () => {
      const contact_id = 'contact-123'
      const mock_response = {
        ok: true,
        json: async () => ({
          data: null,
          pagination: { book: 123, page: 1, hasMore: false },
        }),
      }
      vi.mocked(fetch).mockResolvedValueOnce(mock_response as Response)

      const result = await api_service.fetchEventsForContact(contact_id)

      expect(result).toEqual([])
    })
  })

  describe('Data Transformation Utilities', () => {
    it('should parse ISO 8601 dates to Date objects', () => {
      const iso_string = '2024-01-15T10:00:00Z'
      const date = api_service.parseDate(iso_string)

      expect(date).toBeInstanceOf(Date)
      expect(date.toISOString()).toBe('2024-01-15T10:00:00.000Z')
    })

    describe('normalizeEvent', () => {
      it('should normalize event with starttime and endtime fields', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-1',
          name: 'Test Event',
          starttime: '2024-01-15T10:00:00Z',
          endtime: '2024-01-15T12:00:00Z',
          status: 'confirmed',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized).toHaveProperty('id', 'event-1')
        expect(normalized).toHaveProperty('name', 'Test Event')
        expect(normalized.start).toBeInstanceOf(Date)
        expect(normalized.end).toBeInstanceOf(Date)
        expect(normalized.start.toISOString()).toBe('2024-01-15T10:00:00.000Z')
        expect(normalized.end.toISOString()).toBe('2024-01-15T12:00:00.000Z')
      })

      it('should normalize event with defaultschedulestart and defaultscheduleend fields', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-2',
          name: 'Test Event 2',
          defaultschedulestart: '2024-01-16T14:00:00Z',
          defaultscheduleend: '2024-01-16T16:00:00Z',
          status: 'confirmed',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized).toHaveProperty('id', 'event-2')
        expect(normalized).toHaveProperty('name', 'Test Event 2')
        expect(normalized.start).toBeInstanceOf(Date)
        expect(normalized.end).toBeInstanceOf(Date)
        expect(normalized.start.toISOString()).toBe('2024-01-16T14:00:00.000Z')
        expect(normalized.end.toISOString()).toBe('2024-01-16T16:00:00.000Z')
      })

      it('should normalize event with start and end fields (fallback)', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-3',
          name: 'Test Event 3',
          start: '2024-01-17T09:00:00Z',
          end: '2024-01-17T11:00:00Z',
          status: 'confirmed',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized).toHaveProperty('id', 'event-3')
        expect(normalized).toHaveProperty('name', 'Test Event 3')
        expect(normalized.start).toBeInstanceOf(Date)
        expect(normalized.end).toBeInstanceOf(Date)
        expect(normalized.start.toISOString()).toBe('2024-01-17T09:00:00.000Z')
        expect(normalized.end.toISOString()).toBe('2024-01-17T11:00:00.000Z')
      })

      it('should prioritize starttime over defaultschedulestart', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-4',
          name: 'Test Event 4',
          starttime: '2024-01-18T10:00:00Z',
          defaultschedulestart: '2024-01-18T09:00:00Z',
          endtime: '2024-01-18T12:00:00Z',
          defaultscheduleend: '2024-01-18T11:00:00Z',
          status: 'confirmed',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.start.toISOString()).toBe('2024-01-18T10:00:00.000Z')
        expect(normalized.end.toISOString()).toBe('2024-01-18T12:00:00.000Z')
      })

      it('should handle timezone offsets correctly', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-5',
          name: 'Test Event 5',
          starttime: '2024-01-19T17:30:00+02:00',
          endtime: '2024-01-19T19:30:00+02:00',
          status: 'confirmed',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.start).toBeInstanceOf(Date)
        expect(normalized.end).toBeInstanceOf(Date)
        // The date should be correctly parsed with timezone offset
        expect(normalized.start.toISOString()).toBe('2024-01-19T15:30:00.000Z')
        expect(normalized.end.toISOString()).toBe('2024-01-19T17:30:00.000Z')
      })

      it('should handle null starttime and endtime values', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-6',
          name: 'Test Event 6',
          starttime: null,
          endtime: null,
          defaultschedulestart: '2024-01-20T10:00:00Z',
          defaultscheduleend: '2024-01-20T12:00:00Z',
          status: 'confirmed',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.start).toBeInstanceOf(Date)
        expect(normalized.end).toBeInstanceOf(Date)
        // Should fall back to defaultschedulestart/defaultscheduleend
        expect(normalized.start.toISOString()).toBe('2024-01-20T10:00:00.000Z')
        expect(normalized.end.toISOString()).toBe('2024-01-20T12:00:00.000Z')
      })

      it('should handle missing date fields by using current date', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-7',
          name: 'Test Event 7',
          status: 'confirmed',
        }
        const before_normalization = new Date()
        const normalized = api_service.normalizeEvent(raw_event)
        const after_normalization = new Date()

        expect(normalized.start).toBeInstanceOf(Date)
        expect(normalized.end).toBeInstanceOf(Date)
        // Should use current date when no date fields are present
        expect(normalized.start.getTime()).toBeGreaterThanOrEqual(before_normalization.getTime())
        expect(normalized.start.getTime()).toBeLessThanOrEqual(after_normalization.getTime())
        expect(normalized.end.getTime()).toBeGreaterThanOrEqual(before_normalization.getTime())
        expect(normalized.end.getTime()).toBeLessThanOrEqual(after_normalization.getTime())
      })

      it('should handle status as object with name property', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-8',
          name: 'Test Event 8',
          starttime: '2024-01-21T10:00:00Z',
          endtime: '2024-01-21T12:00:00Z',
          status: { name: 'confirmed' },
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.status).toBe('confirmed')
      })

      it('should handle status as string', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-9',
          name: 'Test Event 9',
          starttime: '2024-01-22T10:00:00Z',
          endtime: '2024-01-22T12:00:00Z',
          status: 'tentative',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.status).toBe('tentative')
      })

      it('should handle missing status', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-10',
          name: 'Test Event 10',
          starttime: '2024-01-23T10:00:00Z',
          endtime: '2024-01-23T12:00:00Z',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.status).toBe('')
      })

      it('should preserve all original event properties', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-11',
          name: 'Test Event 11',
          starttime: '2024-01-24T10:00:00Z',
          endtime: '2024-01-24T12:00:00Z',
          status: 'confirmed',
          description: 'Event description',
          custom_field: 'custom value',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.description).toBe('Event description')
        expect(normalized.custom_field).toBe('custom value')
      })

      it('should handle empty string date values', () => {
        const raw_event: Record<string, unknown> = {
          id: 'event-12',
          name: 'Test Event 12',
          starttime: '',
          endtime: '',
          defaultschedulestart: '2024-01-25T10:00:00Z',
          defaultscheduleend: '2024-01-25T12:00:00Z',
          status: 'confirmed',
        }
        const normalized = api_service.normalizeEvent(raw_event)

        expect(normalized.start).toBeInstanceOf(Date)
        expect(normalized.end).toBeInstanceOf(Date)
        // Should fall back to defaultschedulestart/defaultscheduleend
        expect(normalized.start.toISOString()).toBe('2024-01-25T10:00:00.000Z')
        expect(normalized.end.toISOString()).toBe('2024-01-25T12:00:00.000Z')
      })
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

