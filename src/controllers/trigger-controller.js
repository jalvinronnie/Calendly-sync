// src/controllers/trigger-controller.js
import { SubscriptionModelService } from '../services/model-services/subscription-model-service.js';
import { ConnectionModelService } from '../services/model-services/connection-model-service.js';
import * as calendlyService from '../services/calendly-service.js';
import * as mondayTriggersService from '../services/monday-triggers-service.js';
import logger from '../services/logger/index.js';

const connectionModelService = new ConnectionModelService();

export async function subscribe(req, res) {
  const { userId } = req.session;
  const { payload } = req.body;
  const { inputFields, webhookUrl } = payload;

  try {
    // var connection = await connectionModelService.getConnectionByUserId(userId);
    // console.log('connection --- ' + JSON.stringify(connection));

    // await connectionModelService.deleteConnection(userId);

    // connection = await connectionModelService.getConnectionByUserId(userId);

    const { value: eventTypeUri } = inputFields.eventTypeUri;
    logger.info('subscribe trigger received', { userId, eventTypeUri });


    const { mondayToken, calendlyToken } = await connectionModelService.getConnectionByUserId(userId);
    const subscriptionModelService = new SubscriptionModelService(mondayToken);
    const { id: subscriptionId } = await subscriptionModelService.createSubscription({
      mondayWebhookUrl: webhookUrl,
      eventTypeUri,
      mondayUserId: userId,
    });

    const webhookId = await calendlyService.registerCalendlyWebhook(calendlyToken, eventTypeUri, subscriptionId);
    await subscriptionModelService.updateSubscription(subscriptionId, { webhookId });

    return res.status(200).send({ webhookId: subscriptionId });
  } catch (err) {
    logger.error('failed to subscribe to webhook', { userId, error: err.message });
    return res.status(500).send({ message: 'internal server error' });
  }
}

export async function unsubscribe(req, res) {
  const { userId } = req.session;
  const { webhookId: subscriptionId } = req.body.payload;

  try {
    logger.info('unsubscribe trigger received', { userId, subscriptionId });

    const { calendlyToken, mondayToken } = await connectionModelService.getConnectionByUserId(userId);
    const subscriptionModelService = new SubscriptionModelService(mondayToken);
    const { eventTypeUri, webhookId } = await subscriptionModelService.getSubscription(subscriptionId);

    await calendlyService.deleteWebhook(calendlyToken, webhookId);
    await subscriptionModelService.deleteSubscription(subscriptionId);
    return res.status(200).send({ result: 'Unsubscribed successfully.' });
  } catch (err) {
    logger.error('failed to unsubscribe', { userId, error: err.message, subscriptionId });
    return res.status(500).send({ message: 'internal server error' });
  }
}

export async function triggerEventsHandler(req, res) {
  const { subscriptionId } = req.params;
  const { event } = req.body;

  if (req.body.hook_id) {
    return res.status(200).send({ success: true });
  }

  try {
    logger.info('trigger received', { subscriptionId, event });
    const subscriptionModelService = new SubscriptionModelService();
    const userId = await subscriptionModelService.getUserIdBySubscriptionId(subscriptionId);
    const { mondayToken } = await connectionModelService.getConnectionByUserId(userId);

    const { mondayWebhookUrl } = await subscriptionModelService.getSubscription(subscriptionId, mondayToken);

    await mondayTriggersService.triggerMondayIntegration(mondayWebhookUrl, { event });

    return res.status(200).send();
  } catch (err) {
    logger.error('failed to trigger', { subscriptionId, error: err.message, event });
    return res.status(500).send({ message: 'internal server error' });
  }
}
