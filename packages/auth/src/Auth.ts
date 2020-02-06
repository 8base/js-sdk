import {
  AuthStrategy,
  AuthOptions,
  IStorage,
  IAuth0AuthSettings,
  IAuthState,
  IAuth,
} from './types';
import { StorageFacade } from './StorageFacade';
import { Auth0Strategy } from './Auth0Strategy';

const DEFAULT_STORAGE_KEY = 'auth_storage';

export class Auth implements IAuth {
  public readonly storage: StorageFacade<IAuthState>;
  private readonly authStrategy?: Auth0Strategy;

  constructor(
    options: AuthOptions,
    storage: IStorage = window.localStorage,
    storageKey: string = DEFAULT_STORAGE_KEY,
  ) {
    const { strategy, settings } = options;

    this.storage = new StorageFacade<IAuthState>(storage, storageKey);

    if (strategy === AuthStrategy.Auth0Auth) {
      this.authStrategy = new Auth0Strategy(settings as IAuth0AuthSettings);
    }
  }

  public authorize(provider?: string, options?: {}) {
    if (!this.authStrategy) {
      throw new Error("Current strategy doesn't support authorize method");
    }

    this.authStrategy.authorize(provider, options);
  }

  public async getAuthorizedData(): Promise<any> {
    if (!this.authStrategy) {
      throw new Error("Current strategy doesn't support parseHash method");
    }

    const auth0Data = await this.authStrategy?.getAuthorizedData();

    if (auth0Data) {
      const auth0State = this.authStrategy.convertAuthDataToState(auth0Data);

      this.storage.setState(auth0State);

      return auth0Data;
    }

    return null;
  }

  public async refreshToken(): Promise<any> {
    if (!this.authStrategy) {
      throw new Error("Current strategy doesn't support refresh method");
    }

    const auth0Data = await this.authStrategy.refresh();

    if (auth0Data) {
      const auth0State = this.authStrategy.convertAuthDataToState(auth0Data);

      this.storage.setState(auth0State);

      return auth0Data;
    }

    return null;
  }

  public async forgotPassword(email: string): Promise<string> {
    if (!this.authStrategy) {
      throw new Error("Current strategy doesn't support forgotPassword method");
    }

    return this.authStrategy.forgotPassword(email);
  }

  public signOut(options?: {}) {
    this.storage.purgeState();

    this.authStrategy?.signOut(options);
  }

  public currentUser() {
    return this.storage.getState();
  }
}
