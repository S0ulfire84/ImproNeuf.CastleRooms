/**
 * Filtering utilities for events by room
 */

import type { YesPlanEvent } from '../services/yesplan-api'

/**
 * Filter events by selected room IDs
 * Note: This assumes events have resource IDs associated with them.
 * In a real implementation, you would need to fetch event-resource relationships
 * or have them included in the event data.
 */
export function filter_events_by_rooms(
  events: YesPlanEvent[],
  selected_room_ids: string[],
  event_resource_map: Record<string, string[]>
): YesPlanEvent[] {
  // If no rooms selected, return empty array (as per spec requirement)
  if (selected_room_ids.length === 0) {
    return []
  }

  // Filter events that have at least one selected room
  return events.filter((event) => {
    const event_rooms = event_resource_map[event.id] || []
    return event_rooms.some((room_id) => selected_room_ids.includes(room_id))
  })
}

/**
 * Create a map of event IDs to their resource IDs
 * This would typically be populated by fetching event-resource relationships
 */
export function create_event_resource_map(
  events: YesPlanEvent[],
  event_resources: Record<string, string[]>
): Record<string, string[]> {
  return events.reduce((map, event) => {
    map[event.id] = event_resources[event.id] || []
    return map
  }, {} as Record<string, string[]>)
}

