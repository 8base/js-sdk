import Api from '../src';

const { TEST_WORKSPACE_ID } = process.env;

describe('invoke', () => {
  let api: Api;

  beforeEach(() => {
    api = new Api({
      workspaceId: TEST_WORKSPACE_ID as string,
    });
  });

  it('runs specified webhook', async () => {
    const response = await api.invoke('webhookWithoutParams', {
      method: 'GET',
    });
    const json = await response.json();

    expect(json).toMatchObject({
      data: null,
    });
  });

  it('passes data', async () => {
    const response = await api.invoke('webhookWithoutParams', {
      method: 'GET',
      data: {
        test: 'some value',
      },
    });
    const json = await response.json();

    expect(json).toMatchObject({
      data: {
        test: 'some value',
      },
    });
  });

  it('fetches by path specified', async () => {
    const response = await api.invoke('webhookWithParams', {
      method: 'POST',
      data: {
        test: 'some value',
      },
      path: 'firstParam/path/secondParam/test',
    });
    const json = await response.json();

    expect(json).toMatchObject({
      data: {
        test: 'some value',
      },
      pathParameters: {
        param1: 'firstParam',
        param2: 'secondParam',
      },
    });
  });

  it('passes headers', async () => {
    const response = await api.invoke(
      'webhookWithParams',
      {
        method: 'POST',
        data: {
          test: 'some value',
        },
        path: 'firstParam/path/secondParam/test',
      },
      {
        headers: {
          auth: 'some auth token',
        },
      },
    );
    const json = await response.json();

    expect(json).toMatchObject({
      data: {
        test: 'some value',
      },
      pathParameters: {
        param1: 'firstParam',
        param2: 'secondParam',
      },
      headers: {
        auth: 'some auth token',
      },
    });
  });
});
