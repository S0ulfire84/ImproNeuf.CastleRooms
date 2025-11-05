import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RoomFilter from '../RoomFilter.vue'
import { YesPlanResource } from '../../services/yesplan-api'

describe('RoomFilter Component', () => {
  const mock_resources: YesPlanResource[] = [
    { id: 'room-1', name: 'Room A', description: 'Conference room' },
    { id: 'room-2', name: 'Room B', description: 'Meeting room' },
    { id: 'room-3', name: 'Room C', description: 'Workshop space' },
  ]

  describe('Filter UI', () => {
    it('should display list of available rooms with checkboxes', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
        },
      })
      await wrapper.vm.$nextTick()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(mock_resources.length)
    })

    it('should display room names next to checkboxes', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
        },
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Room A')
      expect(wrapper.text()).toContain('Room B')
      expect(wrapper.text()).toContain('Room C')
    })

    it('should check rooms that are in selected_rooms prop', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
          selected_rooms: ['room-1', 'room-3'],
        },
      })
      await wrapper.vm.$nextTick()

      const checkbox_1 = wrapper.find('input[value="room-1"]')
      const checkbox_2 = wrapper.find('input[value="room-2"]')
      const checkbox_3 = wrapper.find('input[value="room-3"]')

      expect((checkbox_1.element as HTMLInputElement).checked).toBe(true)
      expect((checkbox_2.element as HTMLInputElement).checked).toBe(false)
      expect((checkbox_3.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('Select All / Deselect All', () => {
    it('should have "Select All" button', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
        },
      })
      await wrapper.vm.$nextTick()

      const select_all_button = wrapper.find('[aria-label="Select All"]')
      expect(select_all_button.exists()).toBe(true)
    })

    it('should have "Deselect All" button', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
        },
      })
      await wrapper.vm.$nextTick()

      const deselect_all_button = wrapper.find('[aria-label="Deselect All"]')
      expect(deselect_all_button.exists()).toBe(true)
    })

    it('should select all rooms when "Select All" is clicked', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
          selected_rooms: [],
        },
      })
      await wrapper.vm.$nextTick()

      const select_all_button = wrapper.find('[aria-label="Select All"]')
      await select_all_button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:selected_rooms')).toBeTruthy()
      const emitted_value = wrapper.emitted('update:selected_rooms')[0][0]
      expect(emitted_value).toEqual(['room-1', 'room-2', 'room-3'])
    })

    it('should deselect all rooms when "Deselect All" is clicked', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
          selected_rooms: ['room-1', 'room-2', 'room-3'],
        },
      })
      await wrapper.vm.$nextTick()

      const deselect_all_button = wrapper.find('[aria-label="Deselect All"]')
      await deselect_all_button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:selected_rooms')).toBeTruthy()
      const emitted_value = wrapper.emitted('update:selected_rooms')[0][0]
      expect(emitted_value).toEqual([])
    })
  })

  describe('Individual Room Selection', () => {
    it('should emit update when a room checkbox is toggled', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
          selected_rooms: [],
        },
      })
      await wrapper.vm.$nextTick()

      const checkbox = wrapper.find('input[value="room-1"]')
      await checkbox.setValue(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:selected_rooms')).toBeTruthy()
      const emitted_value = wrapper.emitted('update:selected_rooms')[0][0]
      expect(emitted_value).toContain('room-1')
    })

    it('should remove room from selection when unchecked', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
          selected_rooms: ['room-1', 'room-2'],
        },
      })
      await wrapper.vm.$nextTick()

      const checkbox = wrapper.find('input[value="room-1"]')
      await checkbox.setValue(false)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:selected_rooms')).toBeTruthy()
      const emitted_value = wrapper.emitted('update:selected_rooms')[0][0]
      expect(emitted_value).not.toContain('room-1')
      expect(emitted_value).toContain('room-2')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty resources list', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: [],
          selected_rooms: [],
        },
      })
      await wrapper.vm.$nextTick()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(0)
    })

    it('should handle no rooms selected', async () => {
      const wrapper = mount(RoomFilter, {
        props: {
          resources: mock_resources,
          selected_rooms: [],
        },
      })
      await wrapper.vm.$nextTick()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        expect((checkbox.element as HTMLInputElement).checked).toBe(false)
      })
    })
  })
})

describe('Filtering Logic', () => {
  const mock_events = [
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
  ]

  it('should filter events by selected room IDs', () => {
    const event_resources = {
      'event-1': ['room-1', 'room-2'],
      'event-2': ['room-3'],
    }
    const selected_rooms = ['room-1']

    const filtered = mock_events.filter((event) => {
      const event_rooms = event_resources[event.id] || []
      return event_rooms.some((room_id) => selected_rooms.includes(room_id))
    })

    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('event-1')
  })

  it('should return all events when all rooms are selected', () => {
    const event_resources = {
      'event-1': ['room-1'],
      'event-2': ['room-2'],
    }
    const selected_rooms = ['room-1', 'room-2']

    const filtered = mock_events.filter((event) => {
      const event_rooms = event_resources[event.id] || []
      return event_rooms.some((room_id) => selected_rooms.includes(room_id))
    })

    expect(filtered.length).toBe(2)
  })

  it('should return empty array when no rooms are selected', () => {
    const event_resources = {
      'event-1': ['room-1'],
      'event-2': ['room-2'],
    }
    const selected_rooms: string[] = []

    const filtered = mock_events.filter((event) => {
      const event_rooms = event_resources[event.id] || []
      return event_rooms.some((room_id) => selected_rooms.includes(room_id))
    })

    expect(filtered.length).toBe(0)
  })

  it('should handle events with multiple rooms', () => {
    const event_resources = {
      'event-1': ['room-1', 'room-2'],
      'event-2': ['room-3'],
    }
    const selected_rooms = ['room-2']

    const filtered = mock_events.filter((event) => {
      const event_rooms = event_resources[event.id] || []
      return event_rooms.some((room_id) => selected_rooms.includes(room_id))
    })

    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('event-1')
  })
})

