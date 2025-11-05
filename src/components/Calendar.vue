<template>
  <div class="calendar">
    <div class="calendar-header">
      <button
        class="nav-button prev"
        aria-label="Previous month"
        @click="go_to_previous_month"
      >
        ‹
      </button>
      <div class="month-year">
        <span>{{ formatted_month_year }}</span>
        <button
          class="today-button"
          aria-label="Today"
          @click="go_to_today"
        >
          Today
        </button>
      </div>
      <button
        class="nav-button next"
        aria-label="Next month"
        @click="go_to_next_month"
      >
        ›
      </button>
    </div>

    <div v-if="loading" class="loading">Loading events...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="calendar-grid">
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
          :class="{ 'today': day.is_today, 'other-month': day.is_other_month }"
          :data-date="day.date.toISOString().split('T')[0]"
        >
          <span class="day-number">{{ day.day_number }}</span>
          <div class="events-container">
            <div
              v-for="event in day.events"
              :key="event.id"
              class="event-item"
              :data-event-id="event.id"
              @click="select_event(event.id)"
            >
              <span class="event-name">{{ event.name }}</span>
              <span class="event-time">{{ format_event_time(event) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!displayed_events.length" class="empty-state">No events found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns'
import { YesPlanApiService } from '../services/yesplan-api'
import type { YesPlanEvent } from '../services/yesplan-api'

const props = defineProps<{
  current_date?: Date
  api_service?: YesPlanApiService
  filtered_events?: YesPlanEvent[]
}>()

const emit = defineEmits<{
  'event-selected': [event_id: string]
  'month-changed': [date: Date]
}>()

const api_service_instance = props.api_service || new YesPlanApiService()
const current_date = ref(props.current_date || new Date())
const events = ref<YesPlanEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Watch for prop changes to sync internal state
watch(
  () => props.current_date,
  (new_date) => {
    if (new_date) {
      current_date.value = new_date
    }
  }
)

// Use filtered_events prop if provided, otherwise use internal events
const displayed_events = computed(() => {
  return props.filtered_events !== undefined ? props.filtered_events : events.value
})

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
  const calendar_start = startOfWeek(month_start, { weekStartsOn: 0 })
  const calendar_end = endOfWeek(month_end, { weekStartsOn: 0 })

  const days_in_range = eachDayOfInterval({
    start: calendar_start,
    end: calendar_end,
  })

  return days_in_range.map((date) => {
    const day_events = displayed_events.value.filter((event) => {
      const event_start = new Date(event.start)
      const event_end = new Date(event.end)
      return (
        isSameDay(event_start, date) ||
        isSameDay(event_end, date) ||
        (event_start <= date && event_end >= date)
      )
    })

    return {
      date,
      day_number: date.getDate(),
      is_today: isToday(date),
      is_other_month: !isSameMonth(date, current_date.value),
      events: day_events,
    }
  })
})

const format_event_time = (event: YesPlanEvent): string => {
  const start = new Date(event.start)
  const end = new Date(event.end)
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
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

const fetch_events = async () => {
  // Only fetch if filtered_events prop is not provided
  if (props.filtered_events !== undefined) {
    return
  }
  
  loading.value = true
  error.value = null
  try {
    const fetched_events = await api_service_instance.fetchEvents()
    events.value = fetched_events
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch events'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetch_events()
})
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
  background: #007bff;
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
  background: #0056b3;
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
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
}

.weekday {
  background-color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
}

.calendar-day {
  background-color: white;
  min-height: 100px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
}

.calendar-day.other-month {
  background-color: #f5f5f5;
  color: #999;
}

.calendar-day.today {
  background-color: #e3f2fd;
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
  background-color: #2196f3;
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
  background-color: #1976d2;
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

