jest.mock('@8base-js-sdk/auth', () => {
  const getState = jest.fn();
  const refreshToken = jest.fn();

  return {
    __esModule: true,
    default: class Auth {
      public storage: {
        getState: () => {};
      };
      public refreshToken: () => Promise<{}>;

      constructor() {
        this.storage = {
          getState,
        };
        this.refreshToken = refreshToken;
      }
    },
    getState,
    refreshToken,
  };
});

import eightBase, { AuthStrategy } from '../src';
import ErrorCodes from '@8base/error-codes';
// @ts-ignore
import { refreshToken, getState } from '@8base-js-sdk/auth';

const {
  AUTH_PROFILE_ID,
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  TEST_SERVER_URL,
  TEST_WORKSPACE_ID,
} = process.env as { [key: string]: string };

describe('Token auto refresh', () => {
  let originalFetch: any;
  let api: any;

  beforeAll(() => {
    originalFetch = fetch;
    // @ts-ignore
    fetch = jest.fn();
  });

  beforeEach(() => {
    ({ api } = eightBase.configure({
      workspaceId: TEST_WORKSPACE_ID,
      Auth: {
        strategy: AuthStrategy.Auth0Auth,
        settings: {
          authProfileId: AUTH_PROFILE_ID,
          domain: AUTH0_DOMAIN,
          clientId: AUTH0_CLIENT_ID,
          logoutRedirectUri: TEST_SERVER_URL,
          redirectUri: TEST_SERVER_URL,
        },
      },
      Api: {},
      autoTokenRefresh: true,
    }));
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

    getState.mockReturnValueOnce({
      idToken: 'expired id token',
    });

    getState.mockReturnValueOnce({
      idToken: 'valid id token',
    });

    const result = await api.request(
      `query {
        test
      }`,
    );

    expect(refreshToken).toHaveBeenCalled();
    expect(getState).toHaveBeenCalledTimes(2);
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
