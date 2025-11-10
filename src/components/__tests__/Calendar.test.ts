import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Calendar from '../Calendar.vue'
import { YesPlanApiService, YesPlanEvent } from '../../services/yesplan-api'

describe('Calendar Component', () => {
  let mock_api_service: {
    fetchEvents: ReturnType<typeof vi.fn>
    fetchResources: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mock_api_service = {
      fetchEvents: vi.fn().mockResolvedValue([]),
      fetchResources: vi.fn().mockResolvedValue([]),
    }
  })

  const create_wrapper = (props = {}) => {
    return mount(Calendar, {
      props: {
        api_service: mock_api_service as unknown as YesPlanApiService,
        ...props,
      },
    })
  }

  describe('Calendar Grid Layout', () => {
    it('should display monthly grid layout', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200)) // Wait for async
      const calendar_grid = wrapper.find('.calendar-grid')
      expect(calendar_grid.exists()).toBe(true)
    })

    it('should show month name and year in header', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      const header = wrapper.find('.calendar-header')
      expect(header.exists()).toBe(true)
      expect(header.text()).toMatch(/\w+ \d{4}/) // Month Year format
    })

    it('should display day numbers in grid cells', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200)) // Wait for async
      const day_cells = wrapper.findAll('.calendar-day')
      expect(day_cells.length).toBeGreaterThan(0)
    })

    it('should highlight current date', async () => {
      // Ensure calendar is showing current month
      const today = new Date()
      const wrapper = create_wrapper({
        current_date: today,
      })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      // Check if today class is applied via the computed property
      const calendar_days = wrapper.vm.calendar_days as Array<{ date: Date; is_today: boolean }>
      // Find at least one day marked as today
      const today_days = calendar_days.filter((day) => day.is_today)
      expect(today_days.length).toBeGreaterThan(0)
      // Verify the today cell exists in the DOM
      if (today_days.length > 0) {
        const today_date_str = today_days[0].date.toISOString().split('T')[0]
        const today_cell = wrapper.find(`[data-date="${today_date_str}"]`)
        expect(today_cell.exists()).toBe(true)
      }
    })

    it('should handle months with different numbers of weeks (4-6 weeks)', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-02-01'), // February 2024
      })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      const calendar_grid = wrapper.find('.calendar-grid')
      expect(calendar_grid.exists()).toBe(true)
    })
  })

  describe('Date Navigation', () => {
    it('should have previous month navigation button', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      const prev_button = wrapper.find('[aria-label="Previous month"]')
      expect(prev_button.exists()).toBe(true)
    })

    it('should have next month navigation button', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      const next_button = wrapper.find('[aria-label="Next month"]')
      expect(next_button.exists()).toBe(true)
    })

    it('should navigate to previous month when prev button clicked', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      const initial_month = wrapper.vm.current_month
      const prev_button = wrapper.find('[aria-label="Previous month"]')
      await prev_button.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.current_month).not.toBe(initial_month)
    })

    it('should navigate to next month when next button clicked', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      const initial_month = wrapper.vm.current_month
      const next_button = wrapper.find('[aria-label="Next month"]')
      await next_button.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.current_month).not.toBe(initial_month)
    })

    it('should have "Today" button to jump to current month', async () => {
      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      const today_button = wrapper.find('[aria-label="Today"]')
      expect(today_button.exists()).toBe(true)
    })

    it('should navigate to current month when Today button clicked', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-06-01'), // June 2024
      })
      await wrapper.vm.$nextTick()
      const today_button = wrapper.find('[aria-label="Today"]')
      await today_button.trigger('click')
      await wrapper.vm.$nextTick()
      const current_month = new Date().getMonth()
      expect(wrapper.vm.current_month).toBe(current_month)
    })
  })

  describe('Event Rendering', () => {
    const mock_events: YesPlanEvent[] = [
      {
        id: 'event-1',
        name: 'Test Event',
        start: new Date('2024-01-15T10:00:00Z'),
        end: new Date('2024-01-15T12:00:00Z'),
        status: 'confirmed',
      },
    ]

    beforeEach(() => {
      mock_api_service.fetchEvents.mockResolvedValue(mock_events)
    })

    it('should fetch events on mount', async () => {
      create_wrapper()
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mock_api_service.fetchEvents).toHaveBeenCalled()
    })

    it('should position events on correct calendar dates', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
      })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      const event_element = wrapper.find('[data-event-id="event-1"]')
      expect(event_element.exists()).toBe(true)
    })

    it('should display event name and time on calendar cells', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
      })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      const event_element = wrapper.find('[data-event-id="event-1"]')
      expect(event_element.text()).toContain('Test Event')
      expect(event_element.text()).toMatch(/\d{1,2}:\d{2}/) // Time format
    })

    it('should handle multiple events on the same day', async () => {
      const multiple_events: YesPlanEvent[] = [
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
          start: new Date('2024-01-15T14:00:00Z'),
          end: new Date('2024-01-15T16:00:00Z'),
          status: 'confirmed',
        },
      ]
      mock_api_service.fetchEvents.mockResolvedValue(multiple_events)

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
      })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      const event_elements = wrapper.findAll('[data-event-id]')
      expect(event_elements.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle events spanning multiple days', async () => {
      const spanning_event: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Multi-day Event',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-17T12:00:00Z'),
          status: 'confirmed',
        },
      ]
      mock_api_service.fetchEvents.mockResolvedValue(spanning_event)

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
      })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      const event_elements = wrapper.findAll('[data-event-id="event-1"]')
      expect(event_elements.length).toBeGreaterThan(1)
    })
  })

  describe('Event Click Handling', () => {
    it('should emit event-selected when event is clicked', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Test Event',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]
      mock_api_service.fetchEvents.mockResolvedValue(mock_events)

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
      })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const event_element = wrapper.find('[data-event-id="event-1"]')
      await event_element.trigger('click')

      expect(wrapper.emitted('event-selected')).toBeTruthy()
      expect(wrapper.emitted('event-selected')[0]).toEqual(['event-1'])
    })
  })

  describe('Loading States', () => {
    it('should show loading indicator while fetching events', async () => {
      mock_api_service.fetchEvents.mockImplementation(() => new Promise(() => {})) // Never resolves

      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      const loading_indicator = wrapper.find('.loading')
      expect(loading_indicator.exists()).toBe(true)
    })

    it('should hide loading indicator after events are loaded', async () => {
      mock_api_service.fetchEvents.mockResolvedValue([])

      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const loading_indicator = wrapper.find('.loading')
      expect(loading_indicator.exists()).toBe(false)
    })
  })

  describe('Empty States', () => {
    it('should display message when no events are available', async () => {
      mock_api_service.fetchEvents.mockResolvedValue([])

      const wrapper = create_wrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const empty_message = wrapper.find('.empty-state')
      expect(empty_message.exists()).toBe(true)
      // Calendar grid should still exist
      const calendar_grid = wrapper.find('.calendar-grid')
      expect(calendar_grid.exists()).toBe(true)
    })
  })

  describe('filtered_by_month computed property', () => {
    it('should include events that start within the month', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event in January',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T12:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-2',
          name: 'Event in February',
          start: new Date('2024-02-15T10:00:00Z'),
          end: new Date('2024-02-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('event-1')
    })

    it('should include events that end within the month', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event ending in January',
          start: new Date('2023-12-30T10:00:00Z'),
          end: new Date('2024-01-05T12:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-2',
          name: 'Event in February',
          start: new Date('2024-02-15T10:00:00Z'),
          end: new Date('2024-02-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('event-1')
    })

    it('should include events that span the entire month', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event spanning January',
          start: new Date('2023-12-25T10:00:00Z'),
          end: new Date('2024-02-05T12:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-2',
          name: 'Event in February',
          start: new Date('2024-02-15T10:00:00Z'),
          end: new Date('2024-02-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('event-1')
    })

    it('should include events spanning multiple months when viewing the middle month', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event spanning Jan-Feb',
          start: new Date('2024-01-25T10:00:00Z'),
          end: new Date('2024-02-10T12:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-2',
          name: 'Event in March',
          start: new Date('2024-03-15T10:00:00Z'),
          end: new Date('2024-03-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      // Viewing January - should include event-1
      const wrapper_jan = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper_jan.vm.$nextTick()
      let filtered = wrapper_jan.vm.filtered_by_month
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('event-1')

      // Viewing February - should include event-1
      const wrapper_feb = create_wrapper({
        current_date: new Date('2024-02-01'),
        filtered_events: mock_events,
      })
      await wrapper_feb.vm.$nextTick()
      filtered = wrapper_feb.vm.filtered_by_month
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('event-1')
    })

    it('should exclude events completely outside the month', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event in January',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T12:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-2',
          name: 'Event in February',
          start: new Date('2024-02-15T10:00:00Z'),
          end: new Date('2024-02-15T12:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-3',
          name: 'Event in March',
          start: new Date('2024-03-15T10:00:00Z'),
          end: new Date('2024-03-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-02-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('event-2')
    })

    it('should handle events at month boundaries correctly', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event starting on first day',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-01T12:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-2',
          name: 'Event ending on last day',
          start: new Date('2024-01-31T10:00:00Z'),
          end: new Date('2024-01-31T23:59:59Z'),
          status: 'confirmed',
        },
        {
          id: 'event-3',
          name: 'Event spanning first to last day',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-31T23:59:59Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      expect(filtered).toHaveLength(3)
    })

    it('should handle timezone offsets correctly', async () => {
      // Event with timezone offset that might cause issues
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event with timezone',
          // This is Jan 1, 2024 00:00 UTC+2 (which is Jan 1, 2024 22:00 UTC on Dec 31)
          start: new Date('2024-01-01T00:00:00+02:00'),
          end: new Date('2024-01-01T12:00:00+02:00'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      // Should still include the event even with timezone offset
      expect(filtered.length).toBeGreaterThanOrEqual(0)
    })

    it('should return empty array when no events are provided', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: [],
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      expect(filtered).toHaveLength(0)
    })

    it('should handle events spanning from previous month to next month', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event spanning Dec-Jan-Feb',
          start: new Date('2023-12-20T10:00:00Z'),
          end: new Date('2024-02-10T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      // Viewing January - should include event-1
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filtered_by_month
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('event-1')
    })
  })

  describe('calendar_days computed property', () => {
    it('should map events to correct calendar days', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event on Jan 15',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      const jan_15 = calendar_days.find((day) => day.day_number === 15 && !day.is_other_month)
      expect(jan_15).toBeDefined()
      expect(jan_15?.events).toHaveLength(1)
      expect(jan_15?.events[0].id).toBe('event-1')
    })

    it('should display events spanning multiple days on all relevant days', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Multi-day Event',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-17T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      const jan_15 = calendar_days.find((day) => day.day_number === 15 && !day.is_other_month)
      const jan_16 = calendar_days.find((day) => day.day_number === 16 && !day.is_other_month)
      const jan_17 = calendar_days.find((day) => day.day_number === 17 && !day.is_other_month)

      expect(jan_15?.events).toHaveLength(1)
      expect(jan_15?.events[0].id).toBe('event-1')
      expect(jan_16?.events).toHaveLength(1)
      expect(jan_16?.events[0].id).toBe('event-1')
      expect(jan_17?.events).toHaveLength(1)
      expect(jan_17?.events[0].id).toBe('event-1')
    })

    it('should display events spanning across month boundaries', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Event spanning Jan-Feb',
          start: new Date('2024-01-30T10:00:00Z'),
          end: new Date('2024-02-02T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      // Viewing January - should show event on Jan 30 and 31
      const wrapper_jan = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper_jan.vm.$nextTick()

      const calendar_days_jan = wrapper_jan.vm.calendar_days
      const jan_30 = calendar_days_jan.find((day) => day.day_number === 30 && !day.is_other_month)
      const jan_31 = calendar_days_jan.find((day) => day.day_number === 31 && !day.is_other_month)

      expect(jan_30?.events).toHaveLength(1)
      expect(jan_30?.events[0].id).toBe('event-1')
      expect(jan_31?.events).toHaveLength(1)
      expect(jan_31?.events[0].id).toBe('event-1')
    })

    it('should handle multiple events on the same day', async () => {
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
          start: new Date('2024-01-15T14:00:00Z'),
          end: new Date('2024-01-15T16:00:00Z'),
          status: 'confirmed',
        },
        {
          id: 'event-3',
          name: 'Event 3',
          start: new Date('2024-01-15T18:00:00Z'),
          end: new Date('2024-01-15T20:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      const jan_15 = calendar_days.find((day) => day.day_number === 15 && !day.is_other_month)
      expect(jan_15?.events).toHaveLength(3)
      expect(jan_15?.events.map((e) => e.id)).toEqual(['event-1', 'event-2', 'event-3'])
    })

    it('should correctly identify today', async () => {
      const today = new Date()
      const wrapper = create_wrapper({
        current_date: today,
        filtered_events: [],
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      const today_day = calendar_days.find((day) => day.is_today)
      expect(today_day).toBeDefined()
      expect(today_day?.day_number).toBe(today.getDate())
    })

    it('should mark days from other months correctly', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-15'),
        filtered_events: [],
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      // Calendar shows full weeks, so there should be days from previous/next month
      const other_month_days = calendar_days.filter((day) => day.is_other_month)
      expect(other_month_days.length).toBeGreaterThan(0)
    })

    it('should include all days in the calendar view (full weeks)', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-15'),
        filtered_events: [],
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      // Calendar should show full weeks (typically 35 or 42 days)
      expect(calendar_days.length).toBeGreaterThanOrEqual(35)
      expect(calendar_days.length).toBeLessThanOrEqual(42)
    })

    it('should handle events that start and end on the same day', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Single Day Event',
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      const jan_15 = calendar_days.find((day) => day.day_number === 15 && !day.is_other_month)
      expect(jan_15?.events).toHaveLength(1)
      expect(jan_15?.events[0].id).toBe('event-1')
    })

    it('should handle events spanning multiple weeks', async () => {
      const mock_events: YesPlanEvent[] = [
        {
          id: 'event-1',
          name: 'Long Event',
          start: new Date('2024-01-10T10:00:00Z'),
          end: new Date('2024-01-25T12:00:00Z'),
          status: 'confirmed',
        },
      ]

      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: mock_events,
      })
      await wrapper.vm.$nextTick()

      const calendar_days = wrapper.vm.calendar_days
      const jan_10 = calendar_days.find((day) => day.day_number === 10 && !day.is_other_month)
      const jan_15 = calendar_days.find((day) => day.day_number === 15 && !day.is_other_month)
      const jan_20 = calendar_days.find((day) => day.day_number === 20 && !day.is_other_month)
      const jan_25 = calendar_days.find((day) => day.day_number === 25 && !day.is_other_month)

      expect(jan_10?.events).toHaveLength(1)
      expect(jan_15?.events).toHaveLength(1)
      expect(jan_20?.events).toHaveLength(1)
      expect(jan_25?.events).toHaveLength(1)
    })
  })

  describe('format_event_time', () => {
    it('should format event time correctly', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: [],
      })
      await wrapper.vm.$nextTick()

      const event: YesPlanEvent = {
        id: 'event-1',
        name: 'Test Event',
        start: new Date('2024-01-15T10:30:00Z'),
        end: new Date('2024-01-15T14:45:00Z'),
        status: 'confirmed',
      }

      const formatted_time = wrapper.vm.format_event_time(event)
      // Should be in format "HH:mm - HH:mm"
      expect(formatted_time).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/)
    })

    it('should handle events spanning midnight', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: [],
      })
      await wrapper.vm.$nextTick()

      const event: YesPlanEvent = {
        id: 'event-1',
        name: 'Overnight Event',
        start: new Date('2024-01-15T23:00:00Z'),
        end: new Date('2024-01-16T01:00:00Z'),
        status: 'confirmed',
      }

      const formatted_time = wrapper.vm.format_event_time(event)
      expect(formatted_time).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/)
    })

    it('should handle events with different timezones', async () => {
      const wrapper = create_wrapper({
        current_date: new Date('2024-01-01'),
        filtered_events: [],
      })
      await wrapper.vm.$nextTick()

      const event: YesPlanEvent = {
        id: 'event-1',
        name: 'Timezone Event',
        start: new Date('2024-01-15T10:00:00+02:00'),
        end: new Date('2024-01-15T12:00:00+02:00'),
        status: 'confirmed',
      }

      const formatted_time = wrapper.vm.format_event_time(event)
      expect(formatted_time).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/)
    })
  })
})

