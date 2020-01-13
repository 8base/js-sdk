import { Api } from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('transformRequest', () => {
  it('transforms request', async () => {
    const fixedTimestamp = '1578562676970';

    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID,
      transformRequest: [
        async (next, data) => {
          return next({
            ...data,
            query: `
              mutation ApiTestCreate($data: ApiTestCreateInput!) {
                apiTestCreate(data: $data) {
                  timestamp
                }
              }
            `,
            variables: {
              data: {
                timestamp: fixedTimestamp,
              },
            },
          });
        },
      ],
    });

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
          timestamp: fixedTimestamp,
        },
      },
    });
  });
});
