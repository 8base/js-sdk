import Api from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('request', () => {
  let api: Api;

  beforeEach(() => {
    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
    });
  });

  it('runs a graphQL query', async () => {
    const response = await api.request(`
      query {
        apiTestsList(first: 5, sort: { timestamp: ASC}) {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(response).toMatchObject({
      data: {
        apiTestsList: {
          items: new Array(5).fill({
            id: expect.any(String),
            timestamp: expect.any(String),
          }),
        },
      },
    });
  });

  it('runs a graphQL query with variables', async () => {
    const response = await api.request(
      `
      query ApiTestsList($first: Int, $sort: [ApiTestSort!]) {
        apiTestsList(first: $first, sort: $sort) {
          items {
            id
            timestamp
          }
        }
      }
    `,
      {
        first: 5,
        sort: {
          timestamp: 'ASC',
        },
      },
    );

    expect(response).toMatchObject({
      data: {
        apiTestsList: {
          items: new Array(5).fill({
            id: expect.any(String),
            timestamp: expect.any(String),
          }),
        },
      },
    });
  });

  it('runs a graphQL mutation', async () => {
    const response = await api.request(
      `
      mutation ApiTestCreate($data: ApiTestCreateInput!) {
        apiTestCreate(data: $data) {
          id
          timestamp
        }
      }
    `,
      {
        data: {
          timestamp: Date.now().toString(),
        },
      },
    );

    expect(response).toMatchObject({
      data: {
        apiTestCreate: {
          id: expect.any(String),
          timestamp: expect.any(String),
        },
      },
    });
  });

  it('throws a HTTP error', () => {
    const requestPromise = api.request(`
      {
        someUnknownQuery {
          id
        }
      }
    `);

    return expect(requestPromise).rejects.toThrow(
      'HTTP Error. Code: 400. Message: Bad Request.',
    );
  });

  it('passes a graphQL error in a return value', async () => {
    const response = await api.request(`
      query {
        apiTestsList(first: -1) {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(response).toMatchObject({
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
    });
  });

  it("doesn't run subscriptions", () => {
    const responsePromise = api.request(`
      subscription {
        apiTest {
          node {
            id
          }
        }
      }
    `);

    return expect(responsePromise).rejects.toThrow(
      'Expected GraphQL query or mutation.',
    );
  });
});
