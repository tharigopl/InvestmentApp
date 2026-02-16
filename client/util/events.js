// client/util/events.js
import apiClient from './api-client';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

/**
 * Get all events with optional filters
 * @param {Object} filters - Filter options (status, userId, etc.)
 * @returns {Promise<Array>} Array of events
 */
export async function getEvents(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    const response = await apiClient.get('/events', { params: filters });
    return response.data.events || [];
  } catch (error) {
    console.error('Get events error:', error.message);
    throw error;
  }
}

/**
 * Get single event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event details
 */
export async function getEventById(eventId) {
  try {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data.event;
  } catch (error) {
    console.error('Get event error:', error.message);
    throw error;
  }
}

/**
 * Create new investment event
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} Created event
 */
export async function createEvent(eventData) {
  try {
    const response = await apiClient.post('/events', eventData);
    return response.data.event;
  } catch (error) {
    console.error('Create event error:', error.message);
    throw error;
  }
}

/**
 * Update event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event
 */
export async function updateEvent(eventId, updates) {
  try {
    const response = await apiClient.patch(`/events/${eventId}`, updates);
    return response.data.event;
  } catch (error) {
    console.error('Update event error:', error.message);
    throw error;
  }
}

/**
 * Delete event
 * @param {string} eventId - Event ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteEvent(eventId) {
  try {
    await apiClient.delete(`/events/${eventId}`);
    return true;
  } catch (error) {
    console.error('Delete event error:', error.message);
    throw error;
  }
}

/**
 * Get events created by user
 * @returns {Promise<Array>} User's created events
 */
export async function getMyEvents() {
  try {
    const response = await apiClient.get('/events/my-events');
    return response.data.events || [];
  } catch (error) {
    console.error('Get my events error:', error.message);
    throw error;
  }
}

/**
 * Get events where user is recipient
 * @returns {Promise<Array>} Events where user receives gifts
 */
export async function getEventsForMe() {
  try {
    const response = await apiClient.get('/events/for-me');
    return response.data.events || [];
  } catch (error) {
    console.error('Get events for me error:', error.message);
    throw error;
  }
}

/**
 * Get events user has contributed to
 * @returns {Promise<Array>} Events with user's contributions
 */
export async function getContributedEvents() {
  try {
    const response = await apiClient.get('/events/contributed');
    return response.data.events || [];
  } catch (error) {
    console.error('Get contributed events error:', error.message);
    throw error;
  }
}

/**
 * Invite participants to event
 * @param {string} eventId - Event ID
 * @param {Array<string>} userIds - Array of user IDs to invite
 * @returns {Promise<Object>} Updated event
 */
export async function inviteParticipants(eventId, userIds) {
  try {
    const response = await apiClient.post(`/events/${eventId}/invite`, { userIds });
    return response.data.event;
  } catch (error) {
    console.error('Invite participants error:', error.message);
    throw error;
  }
}

/**
 * Get event participants
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} Array of participants
 */
export async function getEventParticipants(eventId) {
  try {
    const response = await apiClient.get(`/events/${eventId}/participants`);
    return response.data.participants || [];
  } catch (error) {
    console.error('Get participants error:', error.message);
    throw error;
  }
}

/**
 * Cancel event
 * @param {string} eventId - Event ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Updated event
 */
export async function cancelEvent(eventId, reason) {
  try {
    const response = await apiClient.post(`/events/${eventId}/cancel`, { reason });
    return response.data.event;
  } catch (error) {
    console.error('Cancel event error:', error.message);
    throw error;
  }
}

/**
 * Complete event (mark as completed)
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Updated event
 */
export async function completeEvent(eventId) {
  try {
    const response = await apiClient.post(`/events/${eventId}/complete`);
    return response.data.event;
  } catch (error) {
    console.error('Complete event error:', error.message);
    throw error;
  }
}

// ========================================
// BACKWARD COMPATIBILITY (DEPRECATED)
// Legacy functions that accept token parameter
// These will be removed in future versions
// ========================================

/**
 * @deprecated Use getEvents() instead
 */
export async function getEventsWithToken(token, filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.recipient) params.append('recipient', filters.recipient);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await axios.get(`${API_URL}/events?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.events || [];
  } catch (error) {
    console.error('Get events error:', error.message);
    throw error;
  }
}

/**
 * @deprecated Use createEvent() instead
 */
export async function createEventWithToken(token, eventData) {
  try {
    const response = await axios.post(`${API_URL}/events`, eventData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.event;
  } catch (error) {
    console.error('Create event error:', error.message);
    throw error;
  }
}