import { Api } from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('mutation', () => {
  let api: Api = null;

  beforeEach(() => {
    api = new Api({
      workspaceId: TEST_WORKSPACE_ID,
    });
  });

  afterEach(() => {
    api = null;
  });

  it('runs graphQL mutation with "{ someMutation(data) { field1 field2 }}" form', async () => {
    const response = await api.mutation(`
      {
        apiTestCreate(data: { timestamp: "${Date.now()}"}) {
          id
          timestamp
        }
      }
    `);

    expect(response).toMatchObject({
      data: {
        apiTestCreate: {
          id: expect.any(String),
          timestamp: expect.any(String),
        },
      },
    });
  });

  it('runs graphQL mutation with "mutation { someMutation(data) { field1 field2 }}" form', async () => {
    const response = await api.mutation(
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

  it("doesn't run queries", () => {
    const responsePromise = api.mutation(`
      query {
        apiTestsList(first: 5, sort: { timestamp: ASC}) {
          items {
            id
            timestamp
          }
        }
      }
    `);

    expect(responsePromise).rejects.toThrow('Expected GraphQL mutation.');
  });

  it("doesn't run subscriptions", () => {
    const responsePromise = api.mutation(`
      subscription {
        apiTest {
          node {
            id
          }
        }
      }
    `);

    expect(responsePromise).rejects.toThrow('Expected GraphQL mutation.');
  });
});
