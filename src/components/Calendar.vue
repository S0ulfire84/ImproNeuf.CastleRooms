<template>
  <div class="calendar">
    <div class="calendar-header">
      <button class="nav-button prev" aria-label="Previous month" @click="go_to_previous_month">
        ‹
      </button>
      <div class="month-year">
        <span>{{ formatted_month_year }}</span>
        <button class="today-button" aria-label="Today" @click="go_to_today">Today</button>
      </div>
      <button class="nav-button next" aria-label="Next month" @click="go_to_next_month">›</button>
    </div>

    <div class="calendar-grid">
      <div class="calendar-weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">
          {{ day }}
        </div>
      </div>
      <div class="calendar-days">
        <div
          v-for="day in calendar_days"
          :key="day.date.toISOString()"
          class="calendar-day"
          :class="{ today: day.is_today, 'other-month': day.is_other_month }"
          :data-date="day.date.toISOString().split('T')[0]"
        >
          <span class="day-number">{{ day.day_number }}</span>
          <div class="events-container">
            <div
              v-for="event in day.events"
              :key="event.id"
              class="event-item"
              :data-event-id="event.id"
              :style="{
                backgroundColor: getEventColor(event),
                '--hover-color': getEventHoverColor(event),
              }"
              @click="select_event(event.id)"
            >
              <span class="event-name">{{ event.name }}</span>
              <span class="event-time">{{ format_event_time(event) }}</span>
              <span v-if="get_event_location(event)" class="event-location">{{
                get_event_location(event)
              }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!filtered_by_month.length" class="empty-state">No events found for this month</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import type { YesPlanEvent } from '../services/yesplan-api'
import { hashNameToColor, darkenColor } from '../utils/colorUtils'

const props = defineProps<{
  current_date?: Date
  filtered_events?: YesPlanEvent[]
}>()

const emit = defineEmits<{
  'event-selected': [event_id: string]
  'month-changed': [date: Date]
}>()

const current_date = ref(props.current_date || new Date())
// Note: Events come from props (filtered_events) - no internal fetching to avoid duplicate API calls

// Watch for prop changes to sync internal state
watch(
  () => props.current_date,
  (new_date) => {
    if (new_date) {
      current_date.value = new_date
    }
  },
)

// Use filtered_events prop - events are always provided from App.vue
// This ensures we only make one API call to fetch all events
const displayed_events = computed(() => {
  const events = props.filtered_events || []

  if (import.meta.env.DEV) {
    console.log('[Calendar] displayed_events: Events received from App', {
      event_count: events.length,
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        owner: e.owner,
      })),
    })
  }

  return events
})

// Filter displayed events by current month
const filtered_by_month = computed(() => {
  const events_to_filter = displayed_events.value
  if (events_to_filter.length === 0) {
    if (import.meta.env.DEV) {
      console.log('[Calendar] filtered_by_month: No events to filter')
    }
    return []
  }

  const month_start = startOfMonth(current_date.value)
  const month_end = endOfMonth(current_date.value)

  if (import.meta.env.DEV) {
    console.log('[Calendar] filtered_by_month: Filtering events', {
      total_events: events_to_filter.length,
      current_month: format(current_date.value, 'yyyy-MM'),
      month_start: month_start.toISOString(),
      month_end: month_end.toISOString(),
    })
  }

  const filtered = events_to_filter.filter((event) => {
    const event_start = new Date(event.start)
    const event_end = new Date(event.end)

    // Validate dates
    if (isNaN(event_start.getTime()) || isNaN(event_end.getTime())) {
      if (import.meta.env.DEV) {
        console.warn('[Calendar] filtered_by_month: Event has invalid dates', {
          event_id: event.id,
          event_name: event.name,
          start_valid: !isNaN(event_start.getTime()),
          end_valid: !isNaN(event_end.getTime()),
        })
      }
      return false
    }

    // Event overlaps with month if:
    // - Event starts within the month, OR
    // - Event ends within the month, OR
    // - Event spans the entire month
    const starts_in_month = event_start >= month_start && event_start <= month_end
    const ends_in_month = event_end >= month_start && event_end <= month_end
    const spans_month = event_start <= month_start && event_end >= month_end

    const overlaps = starts_in_month || ends_in_month || spans_month

    if (import.meta.env.DEV) {
      if (!overlaps) {
        console.log('[Calendar] filtered_by_month: Event excluded', {
          event_id: event.id,
          event_name: event.name,
          event_start: event_start.toISOString(),
          event_end: event_end.toISOString(),
          month_start: month_start.toISOString(),
          month_end: month_end.toISOString(),
          reason:
            !starts_in_month && !ends_in_month && !spans_month
              ? 'completely outside month'
              : 'unknown',
        })
      } else {
        console.log('[Calendar] filtered_by_month: Event included', {
          event_id: event.id,
          event_name: event.name,
          event_start: event_start.toISOString(),
          event_end: event_end.toISOString(),
          reason: starts_in_month
            ? 'starts in month'
            : ends_in_month
              ? 'ends in month'
              : 'spans month',
        })
      }
    }

    return overlaps
  })

  if (import.meta.env.DEV) {
    console.log('[Calendar] filtered_by_month: Filtering complete', {
      total_events: events_to_filter.length,
      filtered_count: filtered.length,
      excluded_count: events_to_filter.length - filtered.length,
    })
  }

  return filtered
})

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const current_month = computed(() => current_date.value.getMonth())
const current_year = computed(() => current_date.value.getFullYear())

const formatted_month_year = computed(() => {
  return format(current_date.value, 'MMMM yyyy')
})

interface CalendarDay {
  date: Date
  day_number: number
  is_today: boolean
  is_other_month: boolean
  events: YesPlanEvent[]
}

const calendar_days = computed((): CalendarDay[] => {
  const month_start = startOfMonth(current_date.value)
  const month_end = endOfMonth(current_date.value)
  const calendar_start = startOfWeek(month_start, { weekStartsOn: 1 })
  const calendar_end = endOfWeek(month_end, { weekStartsOn: 1 })

  if (import.meta.env.DEV) {
    console.log('[Calendar] calendar_days: Computing calendar days', {
      current_month: format(current_date.value, 'yyyy-MM'),
      month_start: month_start.toISOString(),
      month_end: month_end.toISOString(),
      calendar_start: calendar_start.toISOString(),
      calendar_end: calendar_end.toISOString(),
      total_events: filtered_by_month.value.length,
    })
  }

  const days_in_range = eachDayOfInterval({
    start: calendar_start,
    end: calendar_end,
  })

  // Verify the first day is Monday (1 = Monday in date-fns, 0 = Sunday)
  // If not, there might be an issue with the week calculation
  if (days_in_range.length > 0) {
    const first_day = days_in_range[0]
    if (first_day && getDay(first_day) !== 1) {
      if (import.meta.env.DEV) {
        console.warn('[Calendar] calendar_days: First day is not Monday!', {
          first_day: format(first_day, 'EEEE'),
          day_of_week: getDay(first_day),
        })
      }
    }
  }

  const calendar_days_result = days_in_range.map((date) => {
    const day_events = filtered_by_month.value.filter((event) => {
      const event_start = new Date(event.start)
      const event_end = new Date(event.end)

      // Validate dates
      if (isNaN(event_start.getTime()) || isNaN(event_end.getTime())) {
        if (import.meta.env.DEV) {
          console.warn('[Calendar] calendar_days: Event has invalid dates', {
            event_id: event.id,
            event_name: event.name,
            start_valid: !isNaN(event_start.getTime()),
            end_valid: !isNaN(event_end.getTime()),
          })
        }
        return false
      }

      const starts_on_day = isSameDay(event_start, date)
      const ends_on_day = isSameDay(event_end, date)
      const spans_day = event_start <= date && event_end >= date

      const matches = starts_on_day || ends_on_day || spans_day

      if (import.meta.env.DEV && matches) {
        console.log('[Calendar] calendar_days: Event assigned to day', {
          event_id: event.id,
          event_name: event.name,
          day: format(date, 'yyyy-MM-dd'),
          event_start: event_start.toISOString(),
          event_end: event_end.toISOString(),
          reason: starts_on_day ? 'starts on day' : ends_on_day ? 'ends on day' : 'spans day',
        })
      }

      return matches
    })

    return {
      date,
      day_number: date.getDate(),
      is_today: isToday(date),
      is_other_month: !isSameMonth(date, current_date.value),
      events: day_events,
    }
  })

  if (import.meta.env.DEV) {
    const total_events_assigned = calendar_days_result.reduce(
      (sum, day) => sum + day.events.length,
      0,
    )
    const days_with_events = calendar_days_result.filter((day) => day.events.length > 0).length
    console.log('[Calendar] calendar_days: Calendar days computed', {
      total_days: calendar_days_result.length,
      days_with_events,
      total_events_assigned,
      events_in_month: filtered_by_month.value.length,
    })
  }

  return calendar_days_result
})

const format_event_time = (event: YesPlanEvent): string => {
  const start = new Date(event.start)
  const end = new Date(event.end)
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
}

const get_event_location = (event: YesPlanEvent): string | null => {
  // Check if event has locations array (from raw API response)
  const locations = (event as Record<string, unknown>).locations
  if (Array.isArray(locations) && locations.length > 0) {
    const first_location = locations[0] as Record<string, unknown>
    if (first_location && typeof first_location.name === 'string') {
      return first_location.name
    }
  }
  return null
}

const go_to_previous_month = () => {
  current_date.value = subMonths(current_date.value, 1)
  emit('month-changed', current_date.value)
}

const go_to_next_month = () => {
  current_date.value = addMonths(current_date.value, 1)
  emit('month-changed', current_date.value)
}

const go_to_today = () => {
  current_date.value = new Date()
  emit('month-changed', current_date.value)
}

const select_event = (event_id: string) => {
  emit('event-selected', event_id)
}

const getEventColor = (event: YesPlanEvent): string => {
  return hashNameToColor(event.name)
}

const getEventHoverColor = (event: YesPlanEvent): string => {
  const baseColor = getEventColor(event)
  return darkenColor(baseColor, 0.15)
}

// Note: Calendar component does not fetch events - it receives them via props
// This ensures we only make API calls once from App.vue
</script>

<style scoped>
.calendar {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.nav-button {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1.2rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button:hover {
  background-color: #f0f0f0;
}

.month-year {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  flex: 1;
  justify-content: center;
}

.today-button {
  background: #000000;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 44px;
  min-height: 44px;
}

.today-button:hover {
  background: #333333;
}

.loading,
.error,
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 1rem;
}

.error {
  color: #d32f2f;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background-color: #e0e0e0;
}

.weekday {
  background-color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background-color: #e0e0e0;
}

.calendar-day {
  background-color: white;
  min-height: 100px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.calendar-day.other-month {
  background-color: #f5f5f5;
  color: #999;
}

.calendar-day.today {
  background-color: #e0e0e0;
}

.day-number {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.events-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;
}

.event-item {
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.event-item:hover {
  background-color: var(--hover-color) !important;
}

.event-name {
  display: block;
  font-weight: 500;
}

.event-time {
  display: block;
  font-size: 0.7rem;
  opacity: 0.9;
}

.event-location {
  display: block;
  font-size: 0.65rem;
  opacity: 0.85;
  margin-top: 0.1rem;
  font-style: italic;
}

/* Responsive Calendar */
@media (max-width: 767px) {
  .calendar-header {
    padding: 0.25rem;
  }

  .month-year {
    font-size: 1rem;
    gap: 0.5rem;
  }

  .today-button {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }

  .calendar-day {
    min-height: 80px;
    padding: 0.25rem;
  }

  .event-item {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }

  .weekday {
    font-size: 0.8rem;
    padding: 0.25rem;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .calendar-day {
    min-height: 90px;
  }
}

@media (min-width: 1025px) {
  .calendar-day {
    min-height: 100px;
  }

  .event-item {
    transition: background-color 0.2s ease;
  }
}
</style>
