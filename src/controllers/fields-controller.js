// src/controllers/fields-controller.js
import { ConnectionModelService } from '../services/model-services/connection-model-service.js';
import { getEventTypes } from '../services/calendly-service.js';
import logger from '../services/logger/index.js';

const connectionModelService = new ConnectionModelService();

/**
 * This function returns an array of options to populate a dropdown in the recipe editor.
 * In this example, it returns a list of Calendly event types.
 */
export async function getRemoteListOptions(req, res) {
  const { userId } = req.session;
  try {
    logger.info('get remote list options received', { userId });

    // Fetch the user's connection details to get their Calendly token
    const { calendlyToken } = await connectionModelService.getConnectionByUserId(userId);
    const eventTypes = await getEventTypes(calendlyToken);

    return res.status(200).send(eventTypes);
  } catch (err) {
    logger.error('failed to get remote list options', { userId, error: err.message });
    return res.status(500).send({ message: 'internal server error' });
  }
}

export async function getFieldDefs(req, res) {
  try {
    const fieldDefs = [
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
      }
    ];
    return res.status(200).send(fieldDefs);
  } catch (err) {
    logger.error('failed to get field definitions', { error: err.message });
    return res.status(500).send({ message: 'internal server error' });
  }
}
