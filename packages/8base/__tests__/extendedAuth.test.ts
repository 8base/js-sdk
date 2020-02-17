import { ExtendedAuth } from '../src/ExtendedAuth';
import { AuthStrategy, Auth } from '@8base-js-sdk/auth';
import { Api } from '@8base-js-sdk/api';

const {
  AUTH_PROFILE_ID,
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH_EMAIL,
  AUTH_PASSWORD,
  TEST_SERVER_URL,
  TEST_WORKSPACE_ID,
} = process.env as { [key: string]: string };

describe('8base extended auth', () => {
  let api: Api;
  let auth: Auth;
  let extendedAuth: ExtendedAuth;

  beforeEach(() => {
    auth = new Auth({
      strategy: AuthStrategy.Auth0Auth,
      settings: {
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        redirectUri: TEST_SERVER_URL,
        logoutRedirectUri: TEST_SERVER_URL,
      },
    });

    api = new Api({
      workspaceId: TEST_WORKSPACE_ID,
    });

    extendedAuth = new ExtendedAuth({
      api,
      auth,
      authProfileId: AUTH_PROFILE_ID,
    });
  });

  it('signs in', async () => {
    const result = await extendedAuth.signIn(AUTH_EMAIL, AUTH_PASSWORD);

    expect(result).toMatchObject({
      idToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('throws an ApiGraphQLError', () => {
    const resultPromise = extendedAuth.signIn('someEmail@test.com', '123456');

    return expect(resultPromise).rejects.toThrow(
      'GraphQL Error. Code: ValidationError. Message: The request is invalid..',
    );
  });
});
