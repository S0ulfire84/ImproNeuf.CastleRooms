import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { YesPlanApiService, YesPlanEvent, YesPlanContact } from '../services/yesplan-api'

describe('App Component - filtered_events', () => {
  let mock_api_service: {
    fetchEvents: ReturnType<typeof vi.fn>
    fetchEventContacts: ReturnType<typeof vi.fn>
  }

  const mock_events: YesPlanEvent[] = [
    {
      id: 'event-1',
      name: 'Event 1',
      start: new Date('2024-01-15T10:00:00Z'),
      end: new Date('2024-01-15T12:00:00Z'),
      status: 'confirmed',
    },
    {
      id: 'event-2',
      name: 'Event 2',
      start: new Date('2024-01-16T10:00:00Z'),
      end: new Date('2024-01-16T12:00:00Z'),
      status: 'confirmed',
    },
    {
      id: 'event-3',
      name: 'Event 3',
      start: new Date('2024-01-17T10:00:00Z'),
      end: new Date('2024-01-17T12:00:00Z'),
      status: 'confirmed',
    },
  ]

  const mock_contacts_impro_neuf: YesPlanContact[] = [
    { id: 'contact-1', name: 'Impro Neuf' },
  ]

  const mock_contacts_oslo: YesPlanContact[] = [
    { id: 'contact-2', name: 'Oslo Impro Festival' },
  ]

  beforeEach(() => {
    mock_api_service = {
      fetchEvents: vi.fn().mockResolvedValue(mock_events),
      fetchEventContacts: vi.fn().mockResolvedValue([]),
    }
    // Mock YesPlanApiService constructor
    vi.spyOn(YesPlanApiService.prototype, 'fetchEvents').mockImplementation(mock_api_service.fetchEvents)
    vi.spyOn(YesPlanApiService.prototype, 'fetchEventContacts').mockImplementation(mock_api_service.fetchEventContacts)
  })

  describe('filtered_events with empty contact map', () => {
    it('should return all events when event_contacts_map is empty and events exist', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      // Wait for events to be fetched
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Set events directly (simulating fetch completion)
      wrapper.vm.events = mock_events
      wrapper.vm.event_contacts_map = {}
      wrapper.vm.selected_booker = 'Impro Neuf'

      await wrapper.vm.$nextTick()

      const filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(3)
      expect(filtered_events).toEqual(mock_events)
    })

    it('should return all events when event_contacts_map is empty even if selected_booker is set', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      wrapper.vm.events = mock_events
      wrapper.vm.event_contacts_map = {}
      wrapper.vm.selected_booker = 'Oslo Impro Festival'

      await wrapper.vm.$nextTick()

      const filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(3)
      expect(filtered_events).toEqual(mock_events)
    })

    it('should return empty array when no events exist and contact map is empty', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      wrapper.vm.events = []
      wrapper.vm.event_contacts_map = {}
      wrapper.vm.selected_booker = 'Impro Neuf'

      await wrapper.vm.$nextTick()

      const filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(0)
    })
  })

  describe('filtered_events with populated contact map', () => {
    it('should filter events by booker when contact map is populated', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      wrapper.vm.events = mock_events
      wrapper.vm.event_contacts_map = {
        'event-1': mock_contacts_impro_neuf,
        'event-2': mock_contacts_oslo,
        'event-3': [],
      }
      wrapper.vm.selected_booker = 'Impro Neuf'

      await wrapper.vm.$nextTick()

      const filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(1)
      expect(filtered_events[0].id).toBe('event-1')
    })

    it('should filter events correctly when switching booker selection', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      wrapper.vm.events = mock_events
      await wrapper.vm.$nextTick()
      
      // Set the contact map and cache (the watch reads from cache)
      const contact_map = {
        'event-1': mock_contacts_impro_neuf,
        'event-2': mock_contacts_oslo,
        'event-3': [],
      }
      wrapper.vm.event_contacts_map = contact_map
      wrapper.vm.event_contacts_cache = contact_map
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // First selection: Impro Neuf
      wrapper.vm.selected_booker = 'Impro Neuf'
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))
      let filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(1)
      expect(filtered_events[0].id).toBe('event-1')

      // Verify map is still populated before switching
      expect(Object.keys(wrapper.vm.event_contacts_map).length).toBe(3)
      
      // Switch to Oslo Impro Festival
      wrapper.vm.selected_booker = 'Oslo Impro Festival'
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))
      filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(1)
      expect(filtered_events[0].id).toBe('event-2')

      // Switch to Other (should show events without Impro Neuf or Oslo)
      wrapper.vm.selected_booker = 'Other'
      await wrapper.vm.$nextTick()
      filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(1)
      expect(filtered_events[0].id).toBe('event-3')
    })

    it('should return empty array when no booker is selected', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      wrapper.vm.events = mock_events
      wrapper.vm.event_contacts_map = {
        'event-1': mock_contacts_impro_neuf,
        'event-2': mock_contacts_oslo,
      }
      wrapper.vm.selected_booker = ''

      await wrapper.vm.$nextTick()

      const filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(0)
    })
  })

  describe('filtered_events transition from empty to populated contact map', () => {
    it('should show all events initially, then filter once contacts are loaded', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      wrapper.vm.events = mock_events
      wrapper.vm.selected_booker = 'Impro Neuf'

      // Initially, contact map is empty - should show all events
      wrapper.vm.event_contacts_map = {}
      await wrapper.vm.$nextTick()

      let filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(3)
      expect(filtered_events).toEqual(mock_events)

      // After contacts are loaded, should filter by booker
      wrapper.vm.event_contacts_map = {
        'event-1': mock_contacts_impro_neuf,
        'event-2': mock_contacts_oslo,
        'event-3': [],
      }
      await wrapper.vm.$nextTick()

      filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(1)
      expect(filtered_events[0].id).toBe('event-1')
    })

    it('should filter events by owner field when contacts are empty', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Create events with owner field
      const events_with_owner: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event 1',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T12:00:00Z'),
          status: 'confirmed',
          owner: { name: 'Impro Neuf' },
        },
        {
          id: 'event-2',
          name: 'Event 2',
          start: new Date('2024-01-16T10:00:00Z'),
          end: new Date('2024-01-16T12:00:00Z'),
          status: 'confirmed',
          owner: { name: 'Oslo Impro Festival' },
        },
        {
          id: 'event-3',
          name: 'Event 3',
          start: new Date('2024-01-17T10:00:00Z'),
          end: new Date('2024-01-17T12:00:00Z'),
          status: 'confirmed',
          owner: { name: 'Other Booker' },
        },
      ]

      wrapper.vm.events = events_with_owner
      wrapper.vm.event_contacts_map = {} // Empty contacts map
      wrapper.vm.event_contacts_cache = {} // Empty cache
      wrapper.vm.selected_booker = 'Impro Neuf'

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should show all events initially (contacts not loaded)
      let filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(3)

      // Now simulate contacts being loaded (empty contacts, but owner field should be used)
      wrapper.vm.event_contacts_map = {
        'event-1': [],
        'event-2': [],
        'event-3': [],
      }
      wrapper.vm.event_contacts_cache = {
        'event-1': [],
        'event-2': [],
        'event-3': [],
      }

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should filter by owner field
      filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(1)
      expect(filtered_events[0].id).toBe('event-1')
      expect((filtered_events[0].owner as { name: string })?.name).toBe('Impro Neuf')
    })

    it('should filter events by owner field when owner is not in contacts', async () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Calendar: true,
            BookerFilter: true,
            BookingDetailsModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Create events with owner field and different contacts
      const events_with_owner: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event 1',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T12:00:00Z'),
          status: 'confirmed',
          owner: { name: 'Impro Neuf' },
        },
        {
          id: 'event-2',
          name: 'Event 2',
          start: new Date('2024-01-16T10:00:00Z'),
          end: new Date('2024-01-16T12:00:00Z'),
          status: 'confirmed',
          owner: { name: 'Other Booker' },
        },
      ]

      wrapper.vm.events = events_with_owner
      wrapper.vm.event_contacts_map = {
        'event-1': [{ id: 'contact-1', name: 'Different Contact' }],
        'event-2': [{ id: 'contact-2', name: 'Another Contact' }],
      }
      wrapper.vm.event_contacts_cache = {
        'event-1': [{ id: 'contact-1', name: 'Different Contact' }],
        'event-2': [{ id: 'contact-2', name: 'Another Contact' }],
      }
      wrapper.vm.selected_booker = 'Impro Neuf'

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should filter by owner field even though contacts don't match
      const filtered_events = wrapper.vm.filtered_events
      expect(filtered_events).toHaveLength(1)
      expect(filtered_events[0].id).toBe('event-1')
      expect((filtered_events[0].owner as { name: string })?.name).toBe('Impro Neuf')
    })
  })
})

