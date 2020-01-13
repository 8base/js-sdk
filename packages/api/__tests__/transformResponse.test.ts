import { Api } from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('transformResponse', () => {
  it('transforms response', async () => {
    const fixedTimestamp = '1578562676970';

    const api = new Api({
      workspaceId: TEST_WORKSPACE_ID,
      transformResponse: [
        async (next, data) => {
          return next({
            ...data,
            response: {
              data: {
                apiTestCreate: {
                  timestamp: fixedTimestamp,
                },
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
