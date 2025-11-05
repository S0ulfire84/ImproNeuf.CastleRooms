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
})

