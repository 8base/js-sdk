import { Api } from '../src';

const { TEST_WORKSPACE_ID } = process.env;

interface ApiTest {
  id: string;
  timeout: string;
}

interface ApiTestsListData {
  apiTestsList: {
    items: Array<ApiTest>;
  };
}

describe('request', () => {
  it('runs a graphql query', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID,
    });

    const response = await api.request<ApiTestsListData>({
      query: `
        query {
          apiTestsList(first: 5, sort: { timestamp: ASC}) {
            items {
              id
              timestamp
            }
          }
        }
      `,
    });

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

  it('runs a graphql query with variables', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID,
    });

    const response = await api.request<ApiTestsListData>({
      query: `
        query ApiTestsList($first: Int, $sort: [ApiTestSort!]) {
          apiTestsList(first: $first, sort: $sort) {
            items {
              id
              timestamp
            }
          }
        }
      `,
      variables: {
        first: 5,
        sort: {
          timestamp: "ASC",
        },
      },
    });

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

  it('runs a graphql mutation', async () => {
    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID,
    });

    const response = await api.request<ApiTest>({
      query: `
        mutation ApiTestCreate($data: ApiTestCreateInput!) {
          apiTestCreate(data: $data) {
            id
            timestamp
          }
        }
      `,
      variables: {
        data: {
          timestamp: Date.now().toString(),
        },
      },
    });

    expect(response).toMatchObject({
      data: {
        apiTestCreate: {
          id: expect.any(String),
          timestamp: expect.any(String),
        },
      },
    });
  });
});
