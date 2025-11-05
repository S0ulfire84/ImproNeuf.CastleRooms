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
const event_contacts_map = ref<Record<string, YesPlanContact[]>>({})
const selected_event_id = ref<string | null>(null)
const calendar_date = ref<Date>(new Date())
const loading = ref(false)
const error = ref<string | null>(null)
const loading_contacts = ref(false)

// Cache for event contacts - tracks which events we've already fetched
const event_contacts_cache = ref<Record<string, YesPlanContact[]>>({})
const fetching_event_ids = ref<Set<string>>(new Set())

// Fetch event contacts for specific events (with caching)
const fetch_event_contacts_batch = async (event_ids: string[]) => {
  // Filter out events we've already fetched
  const uncached_ids = event_ids.filter((id) => !(id in event_contacts_cache.value) && !fetching_event_ids.value.has(id))
  
  if (uncached_ids.length === 0) {
    return
  }

  // Mark as fetching
  uncached_ids.forEach((id) => fetching_event_ids.value.add(id))

  try {
    // Fetch contacts for events in batches to avoid rate limiting
    // Process in smaller batches with delays between batches
    const batch_size = 5
    for (let i = 0; i < uncached_ids.length; i += batch_size) {
      const batch = uncached_ids.slice(i, i + batch_size)
      
      await Promise.all(
        batch.map(async (event_id) => {
          try {
            const event_contacts = await api_service.fetchEventContacts(event_id)
            event_contacts_cache.value[event_id] = event_contacts
          } catch (err) {
            // If fetching fails, event has no contacts
            event_contacts_cache.value[event_id] = []
          } finally {
            fetching_event_ids.value.delete(event_id)
          }
        })
      )

      // Small delay between batches to avoid rate limiting
      if (i + batch_size < uncached_ids.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Update the event_contacts_map with newly fetched data
    event_contacts_map.value = {
      ...event_contacts_map.value,
      ...event_contacts_cache.value,
    }
  } catch (err) {
    // Clean up fetching flags on error
    uncached_ids.forEach((id) => fetching_event_ids.value.delete(id))
    throw err
  }
}

// Fetch event contacts for events visible in a specific month
const fetch_contacts_for_month = async (date: Date) => {
  if (events.value.length === 0) {
    return
  }

  loading_contacts.value = true
  
  try {
    // Calculate month boundaries
    const month_start = new Date(date.getFullYear(), date.getMonth(), 1)
    const month_end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    // Find events that are visible in this month
    const visible_events = events.value.filter((event) => {
      const event_start = new Date(event.start)
      const event_end = new Date(event.end)
      return (
        (event_start >= month_start && event_start <= month_end) ||
        (event_end >= month_start && event_end <= month_end) ||
        (event_start <= month_start && event_end >= month_end)
      )
    })

    const visible_event_ids = visible_events.map((event) => event.id)
    await fetch_event_contacts_batch(visible_event_ids)
  } catch (err) {
    console.error('Error fetching event contacts:', err)
  } finally {
    loading_contacts.value = false
  }
}

// Fetch event contacts for events visible in the current month
const fetch_contacts_for_visible_events = async () => {
  if (!selected_booker.value) {
    return
  }
  await fetch_contacts_for_month(calendar_date.value)
}

// Filtered events based on selected booker
const filtered_events = computed(() => {
  if (!selected_booker.value) {
    return []
  }
  return filter_events_by_booker(events.value, selected_booker.value, event_contacts_map.value)
})

// Fetch all events once on mount - this is the ONLY place we fetch events
// Calendar component filters these events client-side by month
// This ensures we make minimal API calls (only pagination requests needed to get all events)
const fetch_data = async () => {
  loading.value = true
  error.value = null
  try {
    // Fetch all events (handles pagination automatically)
    const fetched_events = await api_service.fetchEvents()
    events.value = fetched_events

    // Fetch event contacts for visible events after events are loaded
    // This will happen lazily when booker is selected
    if (selected_booker.value) {
      await fetch_contacts_for_visible_events()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch data'
  } finally {
    loading.value = false
  }
}

const handle_event_selected = async (event_id: string) => {
  selected_event_id.value = event_id
  
  // Ensure event contacts are fetched for the selected event
  if (!(event_id in event_contacts_cache.value)) {
    await fetch_event_contacts_batch([event_id])
  }
}

const handle_modal_close = () => {
  selected_event_id.value = null
}

// Watch for booker selection changes - fetch contacts for visible events when booker is selected
watch(
  [selected_booker, () => events.value.length],
  async () => {
    if (selected_booker.value && events.value.length > 0) {
      await fetch_contacts_for_visible_events()
    }
  },
  { immediate: false }
)

// Watch for calendar month changes - fetch contacts for events in the new month
watch(
  calendar_date,
  async () => {
    if (selected_booker.value && events.value.length > 0) {
      await fetch_contacts_for_month(calendar_date.value)
    }
  }
)

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
