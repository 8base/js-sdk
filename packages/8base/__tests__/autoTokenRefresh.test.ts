jest.mock('@8base/auth', () => {
  const currentUser = jest.fn();
  const refreshToken = jest.fn();

  return {
    Auth: class Auth {
      public currentUser: () => {};
      public refreshToken: () => Promise<{}>;

      constructor() {
        this.currentUser = currentUser;
        this.refreshToken = refreshToken;
      }
    },
    currentUser,
    refreshToken,
  };
});

import { EightBase, AuthStrategy } from '../src';
import ErrorCodes from '@8base/error-codes';
// @ts-ignore
import { refreshToken, currentUser } from '@8base/auth';

const {
  AUTH_PROFILE_ID,
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  TEST_SERVER_URL,
  TEST_WORKSPACE_ID,
} = process.env as { [key: string]: string };

describe('Token auto refresh', () => {
  let originalFetch: any;
  let eightBase: any;

  beforeAll(() => {
    originalFetch = fetch;
    // @ts-ignore
    fetch = jest.fn();
  });

  beforeEach(() => {
    eightBase = new EightBase({
      workspaceId: TEST_WORKSPACE_ID,
      auth: {
        strategy: AuthStrategy.Auth0Auth,
        settings: {
          authProfileId: AUTH_PROFILE_ID,
          domain: AUTH0_DOMAIN,
          clientId: AUTH0_CLIENT_ID,
          logoutRedirectUri: TEST_SERVER_URL,
          redirectUri: TEST_SERVER_URL,
        },
      },
      api: {},
    });
  });

  afterEach(() => {
    // @ts-ignore
    fetch.mockClear();
  });

  afterAll(() => {
    // @ts-ignore
    fetch = originalFetch;
  });

  it('refreshes token', async () => {
    // @ts-ignore
    fetch.mockResolvedValueOnce({
      ok: true,
      json() {
        return Promise.resolve({
          errors: [
            {
              code: ErrorCodes.TokenExpiredErrorCode,
            },
          ],
        });
      },
    });

    // @ts-ignore
    fetch.mockResolvedValueOnce({
      ok: true,
      json() {
        return Promise.resolve({
          data: true,
        });
      },
    });

    refreshToken.mockResolvedValueOnce({});

    currentUser.mockReturnValueOnce({
      idToken: 'expired id token',
    });

    currentUser.mockReturnValueOnce({
      idToken: 'valid id token',
    });

    const result = await eightBase.api.request(
      `query {
        test
      }`,
    );

    expect(refreshToken).toHaveBeenCalled();
    expect(currentUser).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        headers: {
          auth: 'Bearer expired id token',
          'content-type': expect.any(String),
        },
        method: expect.any(String),
      }),
    );

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        headers: {
          auth: 'Bearer valid id token',
          'content-type': expect.any(String),
        },
        method: expect.any(String),
      }),
    );

    expect(result).toMatchObject({
      data: true,
    });
  });
});
