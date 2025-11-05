<template>
  <div class="booker-filter">
    <div class="filter-header">
      <h3>Filter by Booker</h3>
    </div>
    <div class="filter-list">
      <label
        v-for="option in booker_options"
        :key="option.value"
        class="filter-item"
      >
        <input
          type="radio"
          name="booker-filter"
          :value="option.value"
          :checked="selected_booker === option.value"
          @change="select_booker(option.value)"
        />
        <span class="booker-name">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  selected_booker: string
}>()

const emit = defineEmits<{
  'update:selected_booker': [booker: string]
}>()

const booker_options = [
  { label: 'Impro Neuf', value: 'Impro Neuf' },
  { label: 'Oslo Impro Festival', value: 'Oslo Impro Festival' },
  { label: 'Other', value: 'Other' },
]

const select_booker = (booker: string) => {
  emit('update:selected_booker', booker)
}
</script>

<style scoped>
.booker-filter {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
}

.filter-header {
  margin-bottom: 1rem;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
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

.filter-item input[type='radio'] {
  cursor: pointer;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
}

.booker-name {
  user-select: none;
  flex: 1;
}

/* Responsive Filter */
@media (max-width: 767px) {
  .booker-filter {
    padding: 0.75rem;
  }

  .filter-header {
    margin-bottom: 0.75rem;
  }
}
</style>
