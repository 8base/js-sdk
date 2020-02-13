import auth0, {
  Auth0DecodedHash,
  AuthorizeOptions,
  LogoutOptions,
} from 'auth0-js';
import { IAuth0AuthSettings } from './types';

export class Auth0Strategy {
  private readonly logoutRedirectUri: string;
  private readonly auth0Client: auth0.WebAuth;

  constructor(settings: IAuth0AuthSettings) {
    const { clientId, domain, redirectUri, logoutRedirectUri } = settings;

    this.logoutRedirectUri = logoutRedirectUri;
    this.auth0Client = new auth0.WebAuth({
      clientID: clientId,
      domain,
      redirectUri,
      responseType: 'token id_token',
      scope: 'openid email profile',
    });
  }

  public authorize(provider?: string, options: AuthorizeOptions = {}): void {
    if (provider) {
      options = {
        ...options,
        connection: provider,
      };
    }

    this.auth0Client.authorize(options);
  }

  public async getAuthorizedData(): Promise<Auth0DecodedHash | null> {
    const auth0Data = await new Promise<Auth0DecodedHash | null>(
      (resolve, reject) => {
        this.auth0Client.parseHash((error, auth0Data) => {
          if (error) {
            reject(error);
          } else {
            resolve(auth0Data);
          }
        });
      },
    );

    return auth0Data;
  }

  public async refresh(): Promise<Auth0DecodedHash | null> {
    const auth0Data = await new Promise<Auth0DecodedHash>((resolve, reject) => {
      this.auth0Client.checkSession(
        { usePostMessage: true },
        (error, result: Auth0DecodedHash) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
    });

    return auth0Data;
  }

  public signOut(options: LogoutOptions = {}): void {
    this.auth0Client.logout({
      ...options,
      returnTo: this.logoutRedirectUri,
    });
  }

  public async forgotPassword(email: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.auth0Client.changePassword(
        {
          connection: 'Username-Password-Authentication',
          email,
        },
        error => {
          if (error) {
            reject(error);
          } else {
            resolve(email);
          }
        },
      );
    });
  }
}
