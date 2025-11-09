import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BookingDetailsModal from '../BookingDetailsModal.vue'
import { YesPlanApiService, YesPlanEvent, YesPlanResource, YesPlanContact } from '../../services/yesplan-api'

describe('BookingDetailsModal Component', () => {
  let mock_api_service: {
    fetchEventDetails: ReturnType<typeof vi.fn>
    fetchEventResources: ReturnType<typeof vi.fn>
    fetchEventContacts: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mock_api_service = {
      fetchEventDetails: vi.fn(),
      fetchEventResources: vi.fn(),
      fetchEventContacts: vi.fn(),
    }
    // Clear body before each test
    document.body.innerHTML = ''
  })

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = ''
  })

  const create_wrapper = (props = {}) => {
    return mount(BookingDetailsModal, {
      props: {
        api_service: mock_api_service as unknown as YesPlanApiService,
        event_id: null,
        ...props,
      },
    })
  }

  describe('Modal Visibility', () => {
    it('should not be visible when event_id is null', () => {
      const wrapper = create_wrapper({ event_id: null })
      const modal = wrapper.find('.modal-overlay')
      expect(modal.exists()).toBe(false)
    })

    it('should be visible when event_id is provided', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      // Teleport renders to body, so check in document body
      const modal = document.body.querySelector('.modal-overlay')
      expect(modal).toBeTruthy()
    })

    it('should hide modal when event_id becomes null', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      expect(document.body.querySelector('.modal-overlay')).toBeTruthy()

      await wrapper.setProps({ event_id: null })
      await wrapper.vm.$nextTick()
      expect(document.body.querySelector('.modal-overlay')).toBeFalsy()
    })
  })

  describe('Close Functionality', () => {
    it('should have close button', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      const close_button = document.body.querySelector('[aria-label="Close"]')
      expect(close_button).toBeTruthy()
    })

    it('should emit close event when close button clicked', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()

      const close_button = document.body.querySelector('[aria-label="Close"]') as HTMLElement
      close_button?.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit close event when clicking outside modal', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()

      const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
      overlay?.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should not close when clicking inside modal content', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()

      const modal_content = document.body.querySelector('.modal-content') as HTMLElement
      modal_content?.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('Event Details Fetching', () => {
    const mock_event: YesPlanEvent = {
      id: 'event-123',
      name: 'Test Event',
      description: 'Event description',
      start: new Date('2024-01-15T10:00:00Z'),
      end: new Date('2024-01-15T12:00:00Z'),
      status: 'confirmed',
    }

    const mock_resources: YesPlanResource[] = [
      { id: 'room-1', name: 'Room A' },
      { id: 'room-2', name: 'Room B' },
    ]

    const mock_contacts: YesPlanContact[] = [
      { id: 'contact-1', name: 'John Doe', email: 'john@example.com' },
    ]

    beforeEach(() => {
      mock_api_service.fetchEventDetails.mockResolvedValue(mock_event)
      mock_api_service.fetchEventResources.mockResolvedValue(mock_resources)
      mock_api_service.fetchEventContacts.mockResolvedValue(mock_contacts)
    })

    it('should fetch event details when modal opens', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mock_api_service.fetchEventDetails).toHaveBeenCalledWith('event-123')
    })

    it('should fetch event resources when modal opens', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mock_api_service.fetchEventResources).toHaveBeenCalledWith('event-123')
    })

    it('should fetch event contacts when modal opens', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mock_api_service.fetchEventContacts).toHaveBeenCalledWith('event-123')
    })

    it('should fetch all data in parallel when modal opens (lazy loading)', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify all three API calls were made
      expect(mock_api_service.fetchEventDetails).toHaveBeenCalledWith('event-123')
      expect(mock_api_service.fetchEventResources).toHaveBeenCalledWith('event-123')
      expect(mock_api_service.fetchEventContacts).toHaveBeenCalledWith('event-123')
      
      // Verify all calls were made (lazy loading - only when modal opens)
      expect(mock_api_service.fetchEventDetails).toHaveBeenCalledTimes(1)
      expect(mock_api_service.fetchEventResources).toHaveBeenCalledTimes(1)
      expect(mock_api_service.fetchEventContacts).toHaveBeenCalledTimes(1)
    })

    it('should show loading state while fetching', async () => {
      mock_api_service.fetchEventDetails.mockImplementation(() => new Promise(() => {})) // Never resolves

      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()

      const loading_indicator = document.body.querySelector('.loading')
      expect(loading_indicator).toBeTruthy()
    })

    it('should hide loading state after data is fetched', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const loading_indicator = document.body.querySelector('.loading')
      expect(loading_indicator).toBeFalsy()
    })
  })

  describe('Event Information Display', () => {
    const mock_event: YesPlanEvent = {
      id: 'event-123',
      name: 'Test Event',
      description: 'Event description',
      start: new Date('2024-01-15T10:00:00Z'),
      end: new Date('2024-01-15T12:00:00Z'),
      status: 'confirmed',
    }

    const mock_resources: YesPlanResource[] = [
      { id: 'room-1', name: 'Room A' },
    ]

    const mock_contacts: YesPlanContact[] = [
      { id: 'contact-1', name: 'John Doe', email: 'john@example.com' },
    ]

    beforeEach(() => {
      mock_api_service.fetchEventDetails.mockResolvedValue(mock_event)
      mock_api_service.fetchEventResources.mockResolvedValue(mock_resources)
      mock_api_service.fetchEventContacts.mockResolvedValue(mock_contacts)
    })

    it('should display event name', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const modal_content = document.body.querySelector('.modal-content')
      expect(modal_content?.textContent).toContain('Test Event')
    })

    it('should display event dates and times', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const modal_content = document.body.querySelector('.modal-content')
      const text = modal_content?.textContent || ''
      expect(text).toMatch(/January 15/) // Date formatted by date-fns
      expect(text).toMatch(/\d{1,2}:\d{2}/) // Time format (11:00 AM or 1:00 PM)
    })

    it('should display event duration', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const modal_content = document.body.querySelector('.modal-content')
      const text = modal_content?.textContent || ''
      expect(text).toMatch(/2\s*hours?/i) // Duration should be calculated
    })

    it('should display associated rooms', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const modal_content = document.body.querySelector('.modal-content')
      expect(modal_content?.textContent).toContain('Room A')
    })

    it('should display associated contacts', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const modal_content = document.body.querySelector('.modal-content')
      expect(modal_content?.textContent).toContain('John Doe')
      expect(modal_content?.textContent).toContain('john@example.com')
    })

    it('should display event description', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const modal_content = document.body.querySelector('.modal-content')
      expect(modal_content?.textContent).toContain('Event description')
    })

    it('should display event status', async () => {
      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const modal_content = document.body.querySelector('.modal-content')
      expect(modal_content?.textContent).toContain('confirmed')
    })

    it('should handle missing description gracefully', async () => {
      const event_no_description = {
        ...mock_event,
        description: undefined,
      }
      mock_api_service.fetchEventDetails.mockResolvedValue(event_no_description)

      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Should not crash, just not show description
      const modal_content = document.body.querySelector('.modal-content')
      expect(modal_content).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when event fetch fails', async () => {
      mock_api_service.fetchEventDetails.mockRejectedValue(new Error('Failed to fetch'))

      const wrapper = create_wrapper({ event_id: 'event-123' })
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const error_message = document.body.querySelector('.error')
      expect(error_message).toBeTruthy()
      expect(error_message?.textContent).toContain('Failed to fetch')
    })
  })
})

