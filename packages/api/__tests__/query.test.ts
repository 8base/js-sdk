import { Api } from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('query', () => {
  let api: Api;

  beforeEach(() => {
    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
    });
  });

  it('runs graphQL query with "{ someQuery { field1 field2 }}" form', async () => {
    const response = await api.query(`
      {
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

  it('runs graphQL query with "query { someQuery { field1 field2 }}" form', async () => {
    const response = await api.query(`
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

  it("doesn't run mutations", () => {
    const responsePromise = api.query(
      `
      mutation ApiTestCreate($data: ApiTestCreateInput!) {
        apiTestCreate(data: $data) {
          id
          timestamp
        }
      }
    `,
      { data: { timestamp: Date.now() } },
    );

    expect(responsePromise).rejects.toThrow('Expected GraphQL query.');
  });

  it("doesn't run subscriptions", () => {
    const responsePromise = api.query(`
      subscription {
        apiTest {
          node {
            id
          }
        }
      }
    `);

    expect(responsePromise).rejects.toThrow('Expected GraphQL query.');
  });
});
