import { CalendlyAuthManager } from '../services/auth-service.js';
import { ConnectionModelService } from '../services/model-services/connection-model-service.js';
import jwt from 'jsonwebtoken';
import { getSecret } from '../helpers/secret-store.js';
import logger from '../services/logger/index.js';

const TAG = 'auth_controller';
const calendlyAuthManager = new CalendlyAuthManager();
const connectionModelService = new ConnectionModelService();

export const authorizeCalendly = async (req, res) => {
  const { userId, backToUrl } = req.session;
  const { token } = req.query;

  try {
    const connection = await connectionModelService.getConnectionByUserId(userId);
    if (connection?.calendlyToken) {
      return res.redirect(backToUrl);
    }

    // Include backToUrl in state parameter
    const state = JSON.stringify({ userId, backToUrl, token });
    const calendlyAuthorizationUrl = calendlyAuthManager.getAuthorizationUrl(userId, state);
    return res.redirect(calendlyAuthorizationUrl);
    
  } catch (err) {
    logger.error('authorization failed', TAG, { userId, error: err.message });
    return res.status(500).send({ message: 'internal server error' });
  }
  
};

export const calendlyCallback = async (req, res) => {
  const { code, state } = req.query;
  const { userId, backToUrl } = JSON.parse(state);

  logger.info('calendly oauth callback received', { userId, code, backToUrl });

  try {
    
    const token = await calendlyAuthManager.getToken(code);

    // Fetch the Calendly user ID
    const userResponse = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    });
    const calendlyUserId = userResponse.data.resource.uri.split('/').pop();

    // Fetch available event types
    const eventTypes = await getEventTypes(token.access_token);

    // Store the token, Calendly user ID, and event types
    await connectionModelService.upsertConnection(userId, {
      calendlyToken: token.access_token,
      calendlyUserId,
      eventTypes
    });

    return res.redirect(backToUrl);
  } catch (err) {
    logger.error('calendly oauth callback failed', { userId, error: err.message });
    return res.status(500).send({ message: 'internal server error' });
  }

};

export const authorize = async (req, res) => {

  const { userId, backToUrl } = req.session;
  const { token } = req.query;

  try {
    const connection = await connectionModelService.getConnectionByUserId(userId);
    if (connection?.calendlyToken) {
      return res.redirect(backToUrl);
    }

    // Include backToUrl in state parameter
    const state = JSON.stringify({ userId, backToUrl, token });
    const calendlyAuthorizationUrl = calendlyAuthManager.getAuthorizationUrl(userId, state);
    return res.redirect(calendlyAuthorizationUrl);
  } catch (err) {
    logger.error('authorization failed', TAG, { userId, error: err.message });
    return res.status(500).send({ message: 'internal server error' });
  }
  
};

/**
 * Retrieves an monday.com OAuth token and then redirects the user to the backToUrl.
 * Docs: https://developer.monday.com/apps/docs/integration-authorization#authorization-url-example
 * @todo Connect this to your product's OAuth flow.
 */
export const mondayCallback = async (req, res) => {
  const { code, state: mondayToken } = req.query;
  const { userId, backToUrl } = jwt.verify(mondayToken, getSecret(MONDAY_SIGNING_SECRET));
  logger.info('monday oauth callback', TAG, { userId, code, backToUrl });

  try {
    const mondayToken = await mondayAuthManager.getToken(code);
    await connectionModelService.upsertConnection(userId, { mondayToken });

    return res.redirect(backToUrl);
  } catch (err) {
    logger.error('monday oauth callback failed', TAG, { userId, error: err.message });
    return res.status(500).send({ message: 'internal server error' });
  }
};

export const logout = async (req, res) => {
  // Ensure the session and userId are defined
  if (!req.session || !req.session.userId) {
    return res.status(400).send({ message: 'No active session found' });
  }

  const { userId } = req.session;

  try {
    // Fetch the user's connection details to get their Calendly token
    const connection = await connectionModelService.getConnectionByUserId(userId);

    if (connection && connection.calendlyToken) {
      // Revoke the OAuth token
      await axios.post('https://auth.calendly.com/oauth/revoke', null, {
        headers: {
          Authorization: `Bearer ${connection.calendlyToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // Delete the connection details from the database
    await connectionModelService.deleteConnectionByUserId(userId);

    logger.info('Successfully logged out', { userId });

    // Destroy the user session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send({ message: 'Failed to destroy session' });
      }
      return res.status(200).send({ message: 'Successfully logged out' });
    });
  } catch (err) {
    logger.error('Failed to log out', { userId, error: err.message });
    return res.status(500).send({ message: 'Failed to log out' });
  }
};