import ConnectionStorage from '../../storage/connection-storage.js';
import logger from '../logger/index.js';

const TAG = 'connection_model_service';

export class ConnectionModelService {
  constructor() {
    this.secureStorage = new ConnectionStorage();
  }

  async getConnectionByUserId(userId) {
    try {
      const response = await this.secureStorage.get(userId);
      return response;
    } catch (err) {
      logger.error('Failed to retrieve connection by user ID', TAG, { userId, error: err.message });
    }
  }

  async upsertConnection(userId, attributes) {
    const { mondayToken, githubToken, calendlyToken } = attributes;
    const connection = await this.getConnectionByUserId(userId);
    const newConnection = {
      ...connection,
      ...mondayToken && { mondayToken },
      ...githubToken && { githubToken },
      ...calendlyToken && { calendlyToken },
      userId
    };
    try {
      const response = await this.secureStorage.set(userId, newConnection);

      if (!response) {
        throw new Error('Failed to create connection');
      }

      return { userId, mondayToken, githubToken, calendlyToken };
    } catch (err) {
      logger.error('Failed to create connection', TAG, { userId, error: err.message });
    }
  }

  async deleteConnection(userId) {
    try {
      const response = await this.secureStorage.delete(userId);

      if (!response) {
        throw new Error('Failed to delete connection');
      }
    } catch (err) {
      logger.error('Failed to delete connection', TAG, { userId, error: err.message });
    }
  }
  async deleteConnectionByUserId(userId) {
    await db.query('DELETE FROM connections WHERE user_id = $1', [userId]);
  }
}
