/**
 * Filtering utilities for events by room and booker
 */

import type { YesPlanEvent, YesPlanContact } from '../services/yesplan-api'

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
 * Filter events by selected booker
 * @param events - Array of events to filter
 * @param selected_booker - The selected booker: 'Impro Neuf', 'Oslo Impro Festival', or 'Other'
 * @param event_contacts_map - Map of event IDs to their associated contacts
 */
export function filter_events_by_booker(
  events: YesPlanEvent[],
  selected_booker: string,
  event_contacts_map: Record<string, YesPlanContact[]>
): YesPlanEvent[] {
  if (!selected_booker) {
    return []
  }

  const relevant_bookers = ['Impro Neuf', 'Oslo Impro Festival']

  return events.filter((event) => {
    // Get contact names from the contacts map
    const event_contacts = event_contacts_map[event.id] || []
    const contact_names = event_contacts.map((contact) => contact.name)

    // Also check the owner field from the event (owner might not be in contacts)
    let owner_name: string | undefined
    if (event.owner) {
      if (typeof event.owner === 'object' && event.owner !== null && 'name' in event.owner) {
        owner_name = String((event.owner as { name: string }).name)
      } else if (typeof event.owner === 'string') {
        owner_name = event.owner
      }
    }

    // Combine contact names and owner name for matching
    const all_names = [...contact_names]
    if (owner_name) {
      all_names.push(owner_name)
    }

    if (import.meta.env.DEV) {
      if (owner_name && !contact_names.includes(owner_name)) {
        console.log('[filterUtils] filter_events_by_booker: Using owner field for filtering', {
          event_id: event.id,
          event_name: event.name,
          owner_name,
          contact_names,
          all_names,
          selected_booker,
        })
      }
    }

    if (selected_booker === 'Other') {
      // Show events that don't have Impro Neuf or Oslo Impro Festival as contacts or owner
      return !all_names.some((name) => relevant_bookers.includes(name))
    } else {
      // Show events that have the selected booker as a contact or owner
      return all_names.includes(selected_booker)
    }
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

