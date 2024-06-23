import https from 'https';
import { ConnectionModelService } from '../services/model-services/connection-model-service.js';
import logger from '../services/logger/index.js';

const TAG = 'webhook_controller';
const connectionModelService = new ConnectionModelService();

export async function appEvents(req, res) {
    console.log('reqBody --- ' + JSON.stringify(req.body));

    const reqBody = req.body;

    if (reqBody.type === "uninstall") {
        const connection = await connectionModelService.getConnectionByUserId(reqBody.data.user_id);

        if (!connection) {
            logger.error('No connection found for user', TAG, { userId: reqBody.data.user_id });
            return res.status(404).send({ message: 'No connection found' });
        }

        console.log('connection to be deleted --- ' + JSON.stringify(connection));

        await connectionModelService.deleteConnection(reqBody.data.user_id);

        const postData = JSON.stringify({ token: connection.calendlyToken });

        // Options for POST request to Calendly's OAuth 2.0 server to revoke a token
        const postOptions = {
            host: 'auth.calendly.com',
            port: '443',
            path: '/oauth/revoke',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // Set up the request
        const postReq = https.request(postOptions, function (response) {
            let responseData = '';
            response.setEncoding('utf8');
            response.on('data', chunk => {
                responseData += chunk;
            });
            response.on('end', () => {
                console.log('Response: ' + responseData);
                logger.info('Token revoked successfully', TAG, { responseData });
            });
        });

        postReq.on('error', error => {
            console.log('Request error:', error);
            logger.error('Failed to revoke token', TAG, { error });
        });

        // Post the request with data
        postReq.write(postData);
        postReq.end();
    }

    res.status(200).send({ message: 'Event handled' });
}
