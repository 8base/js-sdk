import Api from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('fetch options', () => {
  let originalFetch: any;
  let api: Api;

  beforeAll(() => {
    originalFetch = fetch;
    // @ts-ignore
    fetch = jest.fn((...args) => originalFetch(...args));
  });

  beforeEach(() => {
    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
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

  it('passes options from request method', async () => {
    await api.request(
      `
      query {
        apiTestsList {
          items {
            id
            timestamp
          }
        }
      }
    `,
      {},
      { cache: 'no-cache' },
    );

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.any(String),
        headers: expect.any(Object),
        cache: 'no-cache',
      }),
    );
  });

  it("doesn't overwrite body option", async () => {
    const customBody = JSON.stringify({ query: 'Wrong Query', variables: {} });
    await api.request(
      `
      query {
        apiTestsList {
          items {
            id
            timestamp
          }
        }
      }
    `,
      {},
      // @ts-ignore
      { body: customBody },
    );

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.not.stringContaining(customBody),
        method: expect.any(String),
        headers: expect.any(Object),
      }),
    );
  });

  it("doesn't overwrite method option", async () => {
    await api.request(
      `
      query {
        apiTestsList {
          items {
            id
            timestamp
          }
        }
      }
    `,
      {},
      // @ts-ignore
      { method: 'WRONG_METHOD' },
    );

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.not.stringMatching('WRONG_METHOD'),
        headers: expect.any(Object),
      }),
    );
  });
});
