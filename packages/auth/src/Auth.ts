import {
  AuthStrategy,
  IAuth0AuthSettings,
  IAuthOptions,
  IStorage,
} from './types';
import { StorageFacade } from './StorageFacade';
import { Auth0Strategy } from './Auth0Strategy';

const DEFAULT_STORAGE_KEY = 'auth_storage';

export class Auth<T extends AuthStrategy> {
  private readonly storage: StorageFacade<{}>;
  // private readonly authProfileId: string;
  private readonly authStrategy?: Auth0Strategy;

  constructor(
    options: IAuthOptions<T>,
    storage: IStorage = window.localStorage,
    storageKey: string = DEFAULT_STORAGE_KEY,
  ) {
    const { strategy, settings } = options;
    // const { authProfileId } = settings;

    // this.authProfileId = authProfileId;
    this.storage = new StorageFacade<{}>(storage, storageKey);

    if (strategy === AuthStrategy.Auth0Auth) {
      this.authStrategy = new Auth0Strategy(settings as IAuth0AuthSettings);
    }
  }

  public authorize(provider?: string, options?: any): void {
    if (!this.authStrategy) {
      throw new Error("Current strategy doesn't support authorize method");
    }

    this.authStrategy.authorize(provider, options);
  }

  public async getAuthorizedData(): Promise<any | null> {
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

  public async refresh(): Promise<any | null> {
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

  public signOut(options: any): void {
    this.storage.purgeState();

    this.authStrategy?.signOut(options);
  }

  public currentUser() {
    return this.storage.getState();
  }
}
