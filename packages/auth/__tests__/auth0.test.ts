const {
  AUTH_PROFILE_ID,
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH_EMAIL,
  AUTH_PASSWORD,
  TEST_SERVER_URL,
} = process.env as { [key: string]: string };

jest.setTimeout(60000);

declare var Auth: any;
declare var auth: any;

const createGlobalAuth = (
  authProfileId: string,
  domain: string,
  clientId: string,
  serverUrl: string,
) => {
  const auth = new Auth({
    strategy: 'AUTH0_AUTH',
    settings: {
      authProfileId,
      clientId,
      domain,
      redirectUri: serverUrl,
      logoutRedirectUri: serverUrl,
    },
  });

  window.auth = auth;
};

describe('Auth0 Strategy', () => {
  beforeEach(async () => {
    await page.goto(TEST_SERVER_URL);

    await page.evaluate(
      createGlobalAuth,
      AUTH_PROFILE_ID,
      AUTH0_DOMAIN,
      AUTH0_CLIENT_ID,
      TEST_SERVER_URL,
    );
  });

  it('authorizes', async () => {
    await page.evaluate(() => {
      auth.authorize();
    });

    await page.waitForNavigation({
      waitUntil: 'networkidle2',
    });

    expect(page.url()).toMatch('https://secure.8base.com/login');

    await page.waitForSelector('.auth0-lock-cred-pane-internal-wrapper');

    await page.waitFor(2000);

    const emailInput = await page.waitForSelector(
      '.auth0-lock-input-email input',
    );
    const passwordInput = await page.waitForSelector(
      '.auth0-lock-input-password input',
    );

    await emailInput.focus();
    await emailInput.type(AUTH_EMAIL);
    await passwordInput.focus();
    await passwordInput.type(AUTH_PASSWORD);

    await page.click('button.auth0-lock-submit');

    await page.waitForNavigation({
      waitUntil: 'networkidle2',
    });

    expect(page.url()).toMatch(TEST_SERVER_URL);

    await page.evaluate(
      createGlobalAuth,
      AUTH_PROFILE_ID,
      AUTH0_DOMAIN,
      AUTH0_CLIENT_ID,
      TEST_SERVER_URL,
    );

    const authorizedData = await page.evaluate(() => {
      return auth.getAuthorizedData();
    });

    expect(authorizedData).toMatchObject({
      accessToken: expect.any(String),
      idToken: expect.any(String),
      expiresIn: expect.any(Number),
      idTokenPayload: {
        email: expect.any(String),
        email_verified: expect.any(Boolean),
      },
    });
  });

  it('returns current info about authorized user', async () => {
    const currentUserData = await page.evaluate(() => {
      return auth.currentUser();
    });

    expect(currentUserData).toMatchObject({
      idToken: expect.any(String),
      email: expect.any(String),
      emailVerified: expect.any(Boolean),
      accessToken: expect.any(String),
      expiresIn: expect.any(Number),
      idTokenPayload: expect.any(Object),
    });
  });

  it('refreshes idToken', async () => {
    const refreshedAuthorizedData = await page.evaluate(() => {
      return auth.refresh();
    });

    expect(refreshedAuthorizedData).toMatchObject({
      accessToken: expect.any(String),
      idToken: expect.any(String),
      expiresIn: expect.any(Number),
      idTokenPayload: {
        email: expect.any(String),
        email_verified: expect.any(Boolean),
      },
    });

    const currentUserData = await page.evaluate(() => {
      return auth.currentUser();
    });

    expect(currentUserData).toMatchObject({
      idToken: refreshedAuthorizedData.idToken,
      email: refreshedAuthorizedData.idTokenPayload.email,
      emailVerified: refreshedAuthorizedData.idTokenPayload.email_verified,
      accessToken: refreshedAuthorizedData.accessToken,
      expiresIn: refreshedAuthorizedData.expiresIn,
      idTokenPayload: refreshedAuthorizedData.idTokenPayload,
    });
  });

  it('signs out', async () => {
    await page.evaluate(() => {
      auth.signOut();
    });

    await page.waitForNavigation();

    expect(page.url()).toMatch(TEST_SERVER_URL);

    await page.evaluate(
      createGlobalAuth,
      AUTH_PROFILE_ID,
      AUTH0_DOMAIN,
      AUTH0_CLIENT_ID,
      TEST_SERVER_URL,
    );

    const currentUserData = await page.evaluate(() => {
      return auth.currentUser();
    });

    expect(currentUserData).toEqual({});
  });
});
