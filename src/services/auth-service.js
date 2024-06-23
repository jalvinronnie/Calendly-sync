import { AuthorizationCode } from 'simple-oauth2';
import { CALENDLY_CLIENT_ID, CALENDLY_CLIENT_SECRET, CALENDLY_TOKEN_HOST, CALENDLY_AUTHORIZE_PATH, CALENDLY_TOKEN_PATH } from '../constants/secret-keys.js';
import { getSecret } from '../helpers/secret-store.js';
import { getBaseUrl } from '../helpers/environment.js';

class BaseAuthManager {
  getAuthorizationUrl = (userId, state) => {
    throw new Error('Not implemented');
  };

  getToken = async (code) => {
    throw new Error('Not implemented');
  };
}

export class CalendlyAuthManager extends BaseAuthManager {
  getAuthorizationUrl = (userId, state) => {
    const client = this._getClient();
    const redirectUri = `${getBaseUrl()}/auth/calendly/callback`;
    const authorizationUrl = client.authorizeURL({
      redirect_uri: redirectUri,
      state: JSON.stringify({ userId, state }),
    });

     console.log(`Redirect URL: ${redirectUri}`);
     
    return authorizationUrl;
  };

  getToken = async (code) => {
    const client = this._getClient();
    const tokenConfig = {
      code: code,
      redirect_uri: `${getBaseUrl()}/auth/calendly/callback`,
    };

    console.log(`Token Request Config: ${JSON.stringify(tokenConfig)}`); 

    const response = await client.getToken(tokenConfig);
    const { access_token: token } = response.token;
    return token;
  };

  _getClient = () => {
    const tokenHost = getSecret(CALENDLY_TOKEN_HOST);
    const tokenPath = getSecret(CALENDLY_TOKEN_PATH);
    const authorizePath = getSecret(CALENDLY_AUTHORIZE_PATH);
    const clientId = getSecret(CALENDLY_CLIENT_ID);
    const clientSecret = getSecret(CALENDLY_CLIENT_SECRET);

    //console.log(`Client Configuration: ${clientId}, ${clientSecret}, ${tokenHost}, ${tokenPath}, ${authorizePath}`); // Add debug logging

    return new AuthorizationCode({
      client: {
        id: clientId,
        secret: clientSecret,
      },
      auth: {
        tokenHost: tokenHost,
        tokenPath: tokenPath,
        authorizePath: authorizePath,
      },
    });
  };
}
export class MondayAuthManager extends BaseAuthManager {
  getAuthorizationUrl = (userId, state) => {
    const client = this._getClient();
    const authorizationUrl = client.authorizeURL({
      state,
    });

    return authorizationUrl;
  };

  getToken = async (code) => {
    // const client = this._getClient();
    const response = await monday.oauthToken(code, getSecret(MONDAY_OAUTH_CLIENT_ID), getSecret(MONDAY_OAUTH_CLIENT_SECRET));
    return response?.access_token || response?.token || response;
  };

  _getClient = () => {
    return new AuthorizationCode({
      client: {
        id: getSecret(MONDAY_OAUTH_CLIENT_ID),
        secret: getSecret(MONDAY_OAUTH_CLIENT_SECRET),
      },
      auth: {
        tokenHost: getSecret(MONDAY_OAUTH_HOST),
        tokenPath: getSecret(MONDAY_OAUTH_TOKEN_PATH),
        authorizePath: getSecret(MONDAY_OAUTH_AUTHORIZE_PATH),
      },
    });
  };
}
