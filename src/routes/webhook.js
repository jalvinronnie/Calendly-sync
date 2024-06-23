// src/routes/webhook.js
import express from 'express';
import { triggerMondayIntegration } from '../services/monday-triggers-service.js';
import { webhookAuthenticationMiddleware } from '../middlewares/authentication.js';
import * as webhookController from '../controllers/webhook-controller.js';
import { ConnectionModelService } from '../services/model-services/connection-model-service.js';
import logger from '../services/logger/index.js';

const router = express.Router();
const connectionModelService = new ConnectionModelService();

router.post('/integration/integration-events/:subscriptionId', async (req, res) => {
  const { subscriptionId } = req.params;
  const { event } = req.body;

  if (req.body.hook_id) {
    // Initial URL verification step from Calendly
    return res.status(200).send({ success: true });
  }

  try {
    logger.info('Received Calendly event', { subscriptionId, event });

    // Extract meeting details
    const meetingDetails = {
      title: event.payload.event_type.name,
      start_time: event.payload.start_time,
      end_time: event.payload.end_time,
      invitee_name: event.payload.invitee.name,
      invitee_email: event.payload.invitee.email,
    };

    // Fetch the user's connection details to get their Monday webhook URL
    const connection = await connectionModelService.getConnectionBySubscriptionId(subscriptionId);
    const { mondayWebhookUrl } = connection;

    // Trigger the Monday integration
    await triggerMondayIntegration(mondayWebhookUrl, meetingDetails);

    logger.info('Meeting scheduled and added to Monday board', { meetingDetails });
    res.status(200).send({ success: true });
  } catch (err) {
    logger.error('Failed to handle Calendly webhook', { error: err.message, subscriptionId });
    res.status(500).send({ success: false, error: err.message });
  }
});

router.post('/calendly/app-events', webhookAuthenticationMiddleware, webhookController.appEvents);

export default router;
