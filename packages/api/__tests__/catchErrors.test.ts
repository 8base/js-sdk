import { Api } from '../src';
import { ApiHTTPError } from '../src/errors/ApiHTTPError';
import { ApiGraphQLError } from '../src/errors/ApiGraphQLError';

const { TEST_WORKSPACE_ID } = process.env;

describe('catchErrors', () => {
  const errorCatcher = jest.fn();
  let api: Api;

  beforeEach(() => {
    errorCatcher.mockClear();

    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      catchErrors: errorCatcher,
    });
  });

  it('catches HTTP error', async () => {
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

    expect(errorCatcher).toHaveBeenCalledWith(expect.any(ApiHTTPError));

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

    expect(errorCatcher).toHaveBeenCalledWith(expect.any(ApiGraphQLError));

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
