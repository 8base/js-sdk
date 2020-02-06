import ErrorCodes from '@8base/error-codes';

import { Api, IRerunFunction } from '../src';
import { ApiHTTPError } from '../src/errors/ApiHTTPError';
import { ApiGraphQLError } from '../src/errors/ApiGraphQLError';

const { TEST_WORKSPACE_ID } = process.env;

describe('catchErrors as a function', () => {
  const errorCatcher = jest.fn();
  let api: Api;

  beforeEach(() => {
    errorCatcher.mockClear();

    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      catchErrors: errorCatcher,
    });
  });

  // TODO: Should it catch HTTP errors?
  it.skip('catches HTTP error', async () => {
    try {
      await api.request(`
        {
          someUnknownQuery {
            id
          }
        }
      `);
    } catch {
      // @ts-ignore
    }

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(ApiHTTPError),
      expect.any(Function),
    );

    const error = errorCatcher.mock.calls[0][0];

    expect(error).toMatchObject({
      request: {
        query: expect.any(String),
      },
      httpResponse: expect.any(Response),
    });
  });

  it('catches GraphQL error', async () => {
    await api.request(`
      query {
        apiTestsList(first: -1) {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(ApiGraphQLError),
      expect.any(Function),
    );

    const error = errorCatcher.mock.calls[0][0];

    expect(error).toMatchObject({
      request: {
        query: expect.any(String),
      },
      response: {
        data: {},
        errors: [
          {
            code: expect.any(String),
            details: expect.any(Object),
            message: expect.any(String),
            path: expect.any(Array),
            locations: expect.any(Array),
          },
        ],
      },
    });
  });
});

describe('catchErrors as a map', () => {
  let errorCatcher = jest.fn();

  beforeEach(() => {
    errorCatcher.mockClear();
  });

  it('catches error by code', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      catchErrors: {
        [ErrorCodes.InvalidArgumentErrorCode]: errorCatcher,
      },
    });

    await api.request(`
      query {
        apiTestsList(first: -1) {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(ApiGraphQLError),
      expect.any(Function),
    );

    const error = errorCatcher.mock.calls[0][0];

    expect(error).toMatchObject({
      request: {
        query: expect.any(String),
      },
      response: {
        data: {},
        errors: [
          {
            code: expect.stringMatching(ErrorCodes.InvalidArgumentErrorCode),
            details: expect.any(Object),
            message: expect.any(String),
            path: expect.any(Array),
            locations: expect.any(Array),
          },
        ],
      },
    });
  });

  it('catches error in default clause', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      catchErrors: {
        default: errorCatcher,
      },
    });

    await api.request(`
      query {
        system {
          functionsList {
            items {
              description
            }
          }
        }
      }
    `);

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(ApiGraphQLError),
      expect.any(Function),
    );

    const error = errorCatcher.mock.calls[0][0];

    expect(error).toMatchObject({
      request: {
        query: expect.any(String),
      },
      response: {
        data: {},
        errors: [
          {
            code: expect.stringMatching(ErrorCodes.NotAuthorizedErrorCode),
            details: expect.any(Object),
            message: expect.any(String),
            path: expect.any(Array),
            locations: expect.any(Array),
          },
        ],
      },
    });
  });

  it('allows to rerun request', async () => {
    // @ts-ignore
    errorCatcher = jest.fn((error: ApiGraphQLError, rerun: IRerunFunction) => {
      return rerun({
        variables: {
          first: 1,
        },
      });
    });

    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      catchErrors: {
        default: errorCatcher,
      },
    });

    const result = await api.request(
      `
      query Test($first: Int) {
        apiTestsList(first: $first) {
          items {
            id
            timestamp
          }
        }
      }
    `,
      { first: -1 },
    );

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(ApiGraphQLError),
      expect.any(Function),
    );

    const error = errorCatcher.mock.calls[0][0];

    expect(error).toMatchObject({
      request: {
        query: expect.any(String),
      },
      response: {
        data: {},
        errors: [
          {
            code: expect.stringMatching(ErrorCodes.InvalidArgumentErrorCode),
            details: expect.any(Object),
            message: expect.any(String),
            path: expect.any(Array),
            locations: expect.any(Array),
          },
        ],
      },
    });

    expect(result).toMatchObject({
      data: {
        apiTestsList: {
          items: [
            {
              id: expect.any(String),
              timestamp: expect.any(String),
            },
          ],
        },
      },
    });
  });
});
