<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Calendar from './components/Calendar.vue'
import BookerFilter from './components/BookerFilter.vue'
import BookingDetailsModal from './components/BookingDetailsModal.vue'
import { YesPlanApiService } from './services/yesplan-api'
import type { YesPlanEvent, YesPlanContact } from './services/yesplan-api'
import { filter_events_by_booker } from './utils/filterUtils'

const api_service = new YesPlanApiService()
const events = ref<YesPlanEvent[]>([])
const selected_booker = ref<string>('Impro Neuf') // Default to 'Impro Neuf'
const selected_event_id = ref<string | null>(null)
const calendar_date = ref<Date>(new Date())
const loading = ref(false)
const error = ref<string | null>(null)
// Note: event_contacts_map kept for compatibility with filter function
// Filtering now relies on the "owner" field from events
const event_contacts_map = ref<Record<string, YesPlanContact[]>>({})

// Cache for events by date range - avoid refetching the same date ranges
const events_cache = ref<{
  start_date: string
  end_date: string
  events: YesPlanEvent[]
} | null>(null)

// Note: Contacts API call removed - events don't have a "contacts" property.
// Filtering now relies on the "owner" field from events.

// Filtered events based on selected booker
const filtered_events = computed(() => {
  if (!selected_booker.value) {
    return []
  }

  // Filter by booker using owner field (contacts API not available)
  const filtered = filter_events_by_booker(
    events.value,
    selected_booker.value,
    event_contacts_map.value,
  )
  if (import.meta.env.DEV) {
    console.log('[App] filtered_events: Filtered by booker', {
      total_events: events.value.length,
      filtered_count: filtered.length,
      selected_booker: selected_booker.value,
      contact_map_size: Object.keys(event_contacts_map.value).length,
    })
  }
  return filtered
})

// Calculate date range for fetching events (current month only)
const get_date_range = (date: Date) => {
  const month = date.getMonth()
  const year = date.getFullYear()

  // Start: First day of current month
  const start_date = new Date(year, month, 1)

  // End: Last day of current month
  const end_date = new Date(year, month + 1, 0, 23, 59, 59, 999)

  return { start_date, end_date }
}

// Fetch events for the current date range (optimized to avoid rate limiting)
const fetch_data = async () => {
  loading.value = true
  error.value = null

  if (import.meta.env.DEV) {
    console.log('[App] fetch_data: Starting data fetch', {
      calendar_date: calendar_date.value.toISOString(),
      selected_booker: selected_booker.value,
    })
  }

  try {
    const { start_date, end_date } = get_date_range(calendar_date.value)
    const start_str = start_date.toISOString().split('T')[0]
    const end_str = end_date.toISOString().split('T')[0]

    if (import.meta.env.DEV) {
      console.log('[App] fetch_data: Date range calculated', {
        start_date: start_str,
        end_date: end_str,
        current_month: calendar_date.value.toISOString().split('T')[0],
      })
    }

    // Check if we already have events for this date range
    if (
      events_cache.value &&
      events_cache.value.start_date === start_str &&
      events_cache.value.end_date === end_str
    ) {
      // Use cached events
      events.value = events_cache.value.events
      if (import.meta.env.DEV) {
        console.log('[App] fetch_data: Using cached events', {
          date_range: `${start_str} to ${end_str}`,
          cached_event_count: events_cache.value.events.length,
        })
      }
    } else {
      // Fetch events for the date range (limit to 5 pages to avoid rate limiting)
      if (import.meta.env.DEV) {
        console.log('[App] fetch_data: Fetching events from API', {
          date_range: `${start_str} to ${end_str}`,
          max_pages: 5,
        })
      }

      const fetched_events = await api_service.fetchEvents(start_date, end_date, 5)

      if (import.meta.env.DEV) {
        console.log('[App] fetch_data: Events fetched from API', {
          event_count: fetched_events.length,
          date_range: `${start_str} to ${end_str}`,
          sample_event_ids: fetched_events.slice(0, 5).map((e) => e.id),
        })

        // Log all events with their details
        console.log(
          '[App] fetch_data: All fetched events',
          fetched_events.map((e) => ({
            id: e.id,
            name: e.name,
            start: e.start.toISOString(),
            end: e.end.toISOString(),
            status: e.status,
            owner: e.owner,
          })),
        )
      }

      events.value = fetched_events

      // Cache the events (ensure strings are defined)
      if (start_str && end_str) {
        events_cache.value = {
          start_date: start_str,
          end_date: end_str,
          events: fetched_events,
        }

        if (import.meta.env.DEV) {
          console.log('[App] fetch_data: Events cached', {
            date_range: `${start_str} to ${end_str}`,
            cached_event_count: fetched_events.length,
          })
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log('[App] fetch_data: Events before filtering', {
        total_events: events.value.length,
        selected_booker: selected_booker.value,
        contact_map_size: Object.keys(event_contacts_map.value).length,
      })

      // Log all events with owner information
      console.log(
        '[App] fetch_data: Events with owner information',
        events.value.map((e) => ({
          id: e.id,
          name: e.name,
          owner: e.owner,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
        })),
      )
    }

    // Note: Contacts API call removed - filtering uses owner field

    if (import.meta.env.DEV) {
      console.log('[App] fetch_data: Data fetch complete', {
        total_events: events.value.length,
        filtered_events_count: filtered_events.value.length,
        selected_booker: selected_booker.value,
        contact_map_size: Object.keys(event_contacts_map.value).length,
      })

      // Log filtered events that will be passed to calendar
      console.log(
        '[App] fetch_data: Filtered events passed to calendar',
        filtered_events.value.map((e) => ({
          id: e.id,
          name: e.name,
          owner: e.owner,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          contacts: event_contacts_map.value[e.id] || [],
        })),
      )
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[App] fetch_data: Error fetching data', {
        error: err instanceof Error ? err.message : String(err),
        calendar_date: calendar_date.value.toISOString(),
      })
    }
    error.value = err instanceof Error ? err.message : 'Failed to fetch data'
    events.value = []
  } finally {
    loading.value = false
  }
}

// Watch for booker selection changes - filtering uses owner field (no API call needed)
watch(
  selected_booker,
  async () => {
    // Filtering happens automatically via computed property
  },
  { immediate: false },
)

// Watch for calendar month changes - fetch events if needed, then contacts
watch(calendar_date, async () => {
  const { start_date, end_date } = get_date_range(calendar_date.value)
  const start_str = start_date.toISOString().split('T')[0]
  const end_str = end_date.toISOString().split('T')[0]

  // Check if we need to fetch new events for this date range
  if (
    !events_cache.value ||
    events_cache.value.start_date !== start_str ||
    events_cache.value.end_date !== end_str
  ) {
    // Date range changed, fetch new events
    await fetch_data()
  } else {
    // Same date range, filtering happens automatically via computed property
  }
})

const handle_event_selected = async (event_id: string) => {
  selected_event_id.value = event_id
  // Event details, resources, and contacts are now fetched lazily in BookingDetailsModal
}

const handle_modal_close = () => {
  selected_event_id.value = null
}

// Note: Watchers for contact fetching removed (Task 4.3)
// Contacts are now fetched lazily only when event details modal opens

onMounted(() => {
  fetch_data()
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>CastleRooms</h1>
      <p>Room Booking Calendar</p>
    </header>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <h2>Error Loading Data</h2>
        <p class="error-message">{{ error }}</p>
        <button class="retry-button" @click="fetch_data">Retry</button>
      </div>
    </div>

    <div v-else class="app-content">
      <aside class="sidebar">
        <BookerFilter
          :selected_booker="selected_booker"
          @update:selected_booker="selected_booker = $event"
        />
      </aside>

      <main class="main-content">
        <Calendar
          :filtered_events="filtered_events"
          :current_date="calendar_date"
          @event-selected="handle_event_selected"
          @month-changed="calendar_date = $event"
        />
      </main>
    </div>

    <BookingDetailsModal
      :event_id="selected_event_id"
      :api_service="api_service"
      @close="handle_modal_close"
    />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background-color: #2196f3;
  color: white;
  padding: 1.5rem;
  text-align: center;
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.app-header p {
  margin: 0;
  opacity: 0.9;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 2rem;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-spinner p {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.error-card,
.empty-state-card {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-card h2,
.empty-state-card h2 {
  margin: 0 0 1rem 0;
  color: #d32f2f;
  font-size: 1.5rem;
}

.empty-state-card h2 {
  color: #666;
}

.error-message {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.retry-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.retry-button:hover {
  background-color: #1976d2;
}

.empty-state-card p {
  color: #666;
  margin: 0;
}

.error {
  font-size: 1.2rem;
  color: #d32f2f;
}

.app-content {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
}

.sidebar {
  flex: 0 0 250px;
}

.main-content {
  flex: 1;
  min-width: 0; /* Allows flex item to shrink below content size */
}

/* Tablet Layout (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .app-content {
    flex-direction: row;
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .sidebar {
    flex: 0 0 220px;
  }
}

/* Mobile Layout (< 768px) */
@media (max-width: 767px) {
  .app-header {
    padding: 1rem;
  }

  .app-header h1 {
    font-size: 1.5rem;
  }

  .app-header p {
    font-size: 0.9rem;
  }

  .app-content {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .sidebar {
    flex: none;
    width: 100%;
    order: -1; /* Show filters above calendar on mobile */
  }

  .main-content {
    width: 100%;
  }

  .loading-container,
  .error-container,
  .empty-container {
    padding: 1rem;
    min-height: 40vh;
  }

  .error-card,
  .empty-state-card {
    padding: 1.5rem;
  }
}
</style>
