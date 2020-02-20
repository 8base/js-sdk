import Api from '../src';

const { TEST_WORKSPACE_ID } = process.env;

jest.setTimeout(30000);

const runDelayedMutation = (api: Api, delay = 3000) => {
  setTimeout(() => {
    api.request(
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
  }, delay);
};

describe.skip('subscription', () => {
  let api: Api;
  let unsubscribe: () => void;

  afterEach(() => {
    unsubscribe();
    api.closeSubscriptionConnection();
  });

  it('runs a GraphQL subscription over WebSocket', async done => {
    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      subscription: {
        connected() {
          runDelayedMutation(api);
        },
      },
    });

    unsubscribe = api.subscription(
      `
      subscription {
        ApiTests {
          node {
            id
            timestamp
          }
        }
      }
    `,
      {
        data: result => {
          expect(result).toMatchObject({
            data: {
              ApiTests: {
                node: {
                  id: expect.any(String),
                  timestamp: expect.any(String),
                },
              },
            },
          });

          done();
        },
      },
    );
  });

  it('accepts variables', async done => {
    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
      subscription: {
        connected() {
          runDelayedMutation(api);
        },
      },
    });

    unsubscribe = api.subscription(
      `
      subscription($filter: ApiTestSubscriptionFilter!) {
        ApiTests(filter: $filter) {
          node {
            id
            timestamp
          }
        }
      }
    `,
      {
        variables: {
          filter: {
            mutation_in: 'create',
          },
        },
        data: result => {
          expect(result).toMatchObject({
            data: {
              ApiTests: {
                node: {
                  id: expect.any(String),
                  timestamp: expect.any(String),
                },
              },
            },
          });

          done();
        },
      },
    );
  });
});
