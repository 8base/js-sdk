import { Auth } from '../src';

describe('Auth', () => {
  it('works', () => {
    const auth: Auth = new Auth();

    expect(auth).toBeInstanceOf(Auth);
  });
});
