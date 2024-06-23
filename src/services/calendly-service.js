// src/services/calendly-service.js
import axios from 'axios';

const CALENDLY_WEBHOOK_URL = 'https://api.calendly.com/webhook_subscriptions';
const YOUR_WEBHOOK_URL = 'https://your-domain.com/integration/integration-events';

export const registerCalendlyWebhook = async (calendlyToken, eventTypeUri, subscriptionId) => {
  const headers = {
    Authorization: `Bearer ${calendlyToken}`,
    'Content-Type': 'application/json',
  };

  const data = {
    url: `${YOUR_WEBHOOK_URL}/${subscriptionId}`,
    events: ['invitee.created'], // Event for meeting scheduled
    organization: eventTypeUri, // Specific event type URI
  };

  try {
    const response = await axios.post(CALENDLY_WEBHOOK_URL, data, { headers });
    return response.data.id; // Return the webhook ID
  } catch (error) {
    console.error('Error registering Calendly webhook:', error.response.data);
    throw error;
  }
};

export const deleteWebhook = async (calendlyToken, webhookId) => {
  const headers = {
    Authorization: `Bearer ${calendlyToken}`,
  };

  try {
    await axios.delete(`${CALENDLY_WEBHOOK_URL}/${webhookId}`, { headers });
  } catch (error) {
    console.error('Error deleting Calendly webhook:', error.response.data);
    throw error;
  }
};

export const getEventTypes = async (calendlyToken) => {
  const headers = {
    Authorization: `Bearer ${calendlyToken}`,
  };

  try {
    const response = await axios.get('https://api.calendly.com/event_types', { headers });
    return response.data.collection.map(eventType => ({
      id: eventType.uri,
      title: eventType.name,
    }));
  } catch (error) {
    console.error('Error fetching Calendly event types:', error.response.data);
    throw error;
  }
};


export const getCalendlyUsers = async (calendlyToken) => {
  const headers = {
    Authorization: `Bearer ${calendlyToken}`,
  };

  try {
    const response = await axios.get('https://api.calendly.com/users', { headers });
    return response.data.collection.map(user => ({
      id: user.id,
      title: user.name,
    }));
  } catch (error) {
    console.error('Error fetching Calendly users:', error.response.data);
    throw error;
  }
};

export const getMeetingFieldDefs = () => {
  return [
    {
      id: 'title',
      title: 'Meeting Title',
      type: 'text',
    },
    {
      id: 'start_time',
      title: 'Start Time',
      type: 'datetime',
    },
    {
      id: 'end_time',
      title: 'End Time',
      type: 'datetime',
    },
    {
      id: 'invitee_name',
      title: 'Invitee Name',
      type: 'text',
    },
    {
      id: 'invitee_email',
      title: 'Invitee Email',
      type: 'email',
    },
  ];
};
