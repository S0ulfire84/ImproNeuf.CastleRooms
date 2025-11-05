<template>
  <div class="room-filter">
    <div class="filter-header">
      <h3>Filter by Room</h3>
      <div class="filter-actions">
        <button
          class="filter-button select-all"
          aria-label="Select All"
          @click="select_all"
        >
          Select All
        </button>
        <button
          class="filter-button deselect-all"
          aria-label="Deselect All"
          @click="deselect_all"
        >
          Deselect All
        </button>
      </div>
    </div>
    <div class="filter-list">
      <label
        v-for="resource in resources"
        :key="resource.id"
        class="filter-item"
      >
        <input
          type="checkbox"
          :value="resource.id"
          :checked="is_selected(resource.id)"
          @change="toggle_room(resource.id)"
        />
        <span class="room-name">{{ resource.name }}</span>
      </label>
      <div v-if="resources.length === 0" class="empty-resources">
        No rooms available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { YesPlanResource } from '../services/yesplan-api'

const props = defineProps<{
  resources: YesPlanResource[]
  selected_rooms?: string[]
}>()

const emit = defineEmits<{
  'update:selected_rooms': [room_ids: string[]]
}>()

const is_selected = (room_id: string): boolean => {
  return (props.selected_rooms || []).includes(room_id)
}

const toggle_room = (room_id: string) => {
  const current_selection = props.selected_rooms || []
  const new_selection = is_selected(room_id)
    ? current_selection.filter((id) => id !== room_id)
    : [...current_selection, room_id]
  emit('update:selected_rooms', new_selection)
}

const select_all = () => {
  const all_room_ids = props.resources.map((resource) => resource.id)
  emit('update:selected_rooms', all_room_ids)
}

const deselect_all = () => {
  emit('update:selected_rooms', [])
}
</script>

<style scoped>
.room-filter {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-button {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 0.9rem;
}

.filter-button:hover {
  background-color: #f0f0f0;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  min-height: 44px; /* Touch-friendly */
}

.filter-item:hover {
  background-color: #f5f5f5;
}

.filter-item input[type='checkbox'] {
  cursor: pointer;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
}

.room-name {
  user-select: none;
  flex: 1;
}

/* Responsive Filter */
@media (max-width: 767px) {
  .room-filter {
    padding: 0.75rem;
  }

  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .filter-actions {
    width: 100%;
    justify-content: space-between;
  }

  .filter-button {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.85rem;
  }
}

.empty-resources {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}
</style>

