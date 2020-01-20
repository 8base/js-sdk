import { Api } from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('headers', () => {
  let originalFetch: any;

  beforeAll(() => {
    originalFetch = fetch;
    // @ts-ignore
    fetch = jest.fn((...args) => originalFetch(...args));
  });

  afterEach(() => {
    // @ts-ignore
    fetch.mockClear();
  });

  afterAll(() => {
    // @ts-ignore
    fetch = originalFetch;
  });

  it('passes headers from constructor. Object', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      headers: {
        auth: 'Some token',
      },
    });

    await api.request(`
      query {
        apiTestsList {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.any(String),
        headers: {
          auth: 'Some token',
          'content-type': 'application/json',
        },
      }),
    );
  });

  it('passes headers from constructor. Function', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      headers: () => ({
        auth: 'Some token',
      }),
    });

    await api.request(`
      query {
        apiTestsList {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.any(String),
        headers: {
          auth: 'Some token',
          'content-type': 'application/json',
        },
      }),
    );
  });

  it('passes headers from method', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      headers: {
        auth: 'Some token',
      },
    });

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
      { headers: { workspace: TEST_WORKSPACE_ID as string } },
    );

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.any(String),
        headers: {
          auth: 'Some token',
          workspace: TEST_WORKSPACE_ID,
          'content-type': 'application/json',
        },
      }),
    );
  });

  it("method's headers overwrite constructor's headers", async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      headers: {
        auth: 'Some token',
      },
    });

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
      { headers: { auth: 'Some another token' } },
    );

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.any(String),
        headers: {
          auth: 'Some another token',
          'content-type': 'application/json',
        },
      }),
    );
  });

  it("constructor's headers can't overwrite 'content-type' header", async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      headers: {
        'content-type': '*/*',
      },
    });

    await api.request(`
      query {
        apiTestsList {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.any(String),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );
  });

  it("method's headers can't overwrite 'content-type' header", async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
    });

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
      { headers: { 'content-type': '*/*' } },
    );

    expect(fetch).lastCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.any(String),
        method: expect.any(String),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );
  });
});
