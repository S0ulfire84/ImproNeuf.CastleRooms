<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Calendar from './components/Calendar.vue'
import RoomFilter from './components/RoomFilter.vue'
import BookingDetailsModal from './components/BookingDetailsModal.vue'
import { YesPlanApiService } from './services/yesplan-api'
import type { YesPlanEvent, YesPlanResource } from './services/yesplan-api'
import { filter_events_by_rooms } from './utils/filterUtils'

const api_service = new YesPlanApiService()
const events = ref<YesPlanEvent[]>([])
const resources = ref<YesPlanResource[]>([])
const selected_rooms = ref<string[]>([])
const event_resource_map = ref<Record<string, string[]>>({})
const selected_event_id = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Initialize selected_rooms with all rooms by default
const initialize_selected_rooms = () => {
  if (resources.value.length > 0 && selected_rooms.value.length === 0) {
    selected_rooms.value = resources.value.map((resource) => resource.id)
  }
}

// Filtered events based on selected rooms
const filtered_events = computed(() => {
  if (selected_rooms.value.length === 0) {
    return []
  }
  return filter_events_by_rooms(events.value, selected_rooms.value, event_resource_map.value)
})

const fetch_data = async () => {
  loading.value = true
  error.value = null
  try {
    // Fetch events and resources in parallel
    const [fetched_events, fetched_resources] = await Promise.all([
      api_service.fetchEvents(),
      api_service.fetchResources(),
    ])

    events.value = fetched_events
    resources.value = fetched_resources

    // Initialize selected rooms with all rooms
    initialize_selected_rooms()

    // Fetch event-resource relationships for all events
    // Note: This is a simplified approach - in production you might want to
    // fetch these on-demand or cache them
    const resource_map: Record<string, string[]> = {}
    await Promise.all(
      fetched_events.map(async (event) => {
        try {
          const event_resources = await api_service.fetchEventResources(event.id)
          resource_map[event.id] = event_resources.map((resource) => resource.id)
        } catch (err) {
          // If fetching fails, event has no resources
          resource_map[event.id] = []
        }
      })
    )
    event_resource_map.value = resource_map
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch data'
  } finally {
    loading.value = false
  }
}

const handle_event_selected = (event_id: string) => {
  selected_event_id.value = event_id
}

const handle_modal_close = () => {
  selected_event_id.value = null
}

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

    <div v-else-if="resources.length === 0" class="empty-container">
      <div class="empty-state-card">
        <h2>No Rooms Available</h2>
        <p>Unable to load room information. Please check your connection and try again.</p>
      </div>
    </div>

    <div v-else class="app-content">
      <aside class="sidebar">
        <RoomFilter
          :resources="resources"
          :selected_rooms="selected_rooms"
          @update:selected_rooms="selected_rooms = $event"
        />
      </aside>

      <main class="main-content">
        <Calendar
          :filtered_events="filtered_events"
          @event-selected="handle_event_selected"
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
