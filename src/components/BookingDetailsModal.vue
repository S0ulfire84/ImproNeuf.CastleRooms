<template>
  <Teleport to="body">
    <div
      v-if="event_id"
      class="modal-overlay"
      @click.self="handle_close"
    >
      <div class="modal-content">
        <button
          class="modal-close"
          aria-label="Close"
          @click="handle_close"
        >
          ×
        </button>

        <div v-if="loading" class="loading">Loading event details...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="event_details" class="event-details">
          <h2 class="event-name">{{ event_details.name }}</h2>

          <div class="detail-section">
            <h3>When</h3>
            <div class="detail-item">
              <span class="detail-label">Start:</span>
              <span class="detail-value">{{ formatted_start }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">End:</span>
              <span class="detail-value">{{ formatted_end }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">{{ formatted_duration }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Status</h3>
            <div class="detail-item">
              <span class="detail-value status-badge" :class="status_class">
                {{ event_details.status }}
              </span>
            </div>
          </div>

          <div v-if="rooms.length > 0" class="detail-section">
            <h3>Rooms</h3>
            <ul class="detail-list">
              <li v-for="room in rooms" :key="room.id" class="detail-list-item">
                {{ room.name }}
              </li>
            </ul>
          </div>

          <div v-if="contacts.length > 0" class="detail-section">
            <h3>Contacts</h3>
            <ul class="detail-list">
              <li v-for="contact in contacts" :key="contact.id" class="detail-list-item">
                <div v-if="contact.name">{{ contact.name }}</div>
                <div v-if="contact.email" class="contact-email">{{ contact.email }}</div>
              </li>
            </ul>
          </div>

          <div v-if="event_details.description" class="detail-section">
            <h3>Description</h3>
            <p class="event-description">{{ event_details.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { format, differenceInHours, differenceInMinutes } from 'date-fns'
import { YesPlanApiService } from '../services/yesplan-api'
import type { YesPlanEvent, YesPlanResource, YesPlanContact } from '../services/yesplan-api'

const props = defineProps<{
  event_id: string | null
  api_service?: YesPlanApiService
}>()

const emit = defineEmits<{
  close: []
}>()

const api_service_instance = props.api_service || new YesPlanApiService()
const event_details = ref<YesPlanEvent | null>(null)
const rooms = ref<YesPlanResource[]>([])
const contacts = ref<YesPlanContact[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const formatted_start = computed(() => {
  if (!event_details.value) return ''
  const start = new Date(event_details.value.start)
  return format(start, 'PPP p') // e.g., "January 15, 2024 10:00 AM"
})

const formatted_end = computed(() => {
  if (!event_details.value) return ''
  const end = new Date(event_details.value.end)
  return format(end, 'PPP p')
})

const formatted_duration = computed(() => {
  if (!event_details.value) return ''
  const start = new Date(event_details.value.start)
  const end = new Date(event_details.value.end)
  const hours = differenceInHours(end, start)
  const minutes = differenceInMinutes(end, start) % 60

  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
})

const status_class = computed(() => {
  const status = event_details.value?.status?.toLowerCase() || ''
  return {
    'status-confirmed': status === 'confirmed',
    'status-tentative': status === 'tentative',
    'status-cancelled': status === 'cancelled' || status === 'canceled',
  }
})

const handle_close = () => {
  emit('close')
}

const fetch_event_details = async () => {
  if (!props.event_id) {
    event_details.value = null
    rooms.value = []
    contacts.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const [details, resources] = await Promise.all([
      api_service_instance.fetchEventDetails(props.event_id),
      api_service_instance.fetchEventResources(props.event_id),
      // Note: Contacts API call removed - events don't have a "contacts" property
    ])

    event_details.value = details
    rooms.value = resources
    contacts.value = [] // Contacts not available via API
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch event details'
    event_details.value = null
    rooms.value = []
    contacts.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.event_id,
  () => {
    fetch_event_details()
  },
  { immediate: true }
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.modal-close:hover {
  color: #000;
}

/* Responsive Modal */
@media (max-width: 767px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
    padding: 1.5rem;
  }

  .event-name {
    font-size: 1.25rem;
  }

  .modal-close {
    top: 0.5rem;
    right: 0.5rem;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .modal-content {
    max-width: 90%;
    padding: 1.75rem;
  }
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #d32f2f;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.event-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.detail-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.detail-section:first-child {
  border-top: none;
  padding-top: 0;
}

.detail-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #666;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.detail-label {
  font-weight: 500;
  min-width: 80px;
}

.detail-value {
  flex: 1;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-confirmed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-tentative {
  background-color: #fff3e0;
  color: #e65100;
}

.status-cancelled {
  background-color: #ffebee;
  color: #c62828;
}

.detail-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.detail-list-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-list-item:last-child {
  border-bottom: none;
}

.contact-email {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.event-description {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
}
</style>

