import { Api } from '../src';

describe('Api', () => {
  it('works', () => {
    const api: Api = new Api();

    expect(api).toBeInstanceOf(Api);
  });
});
