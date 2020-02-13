import {
  AuthCallback,
  AuthEvent,
  AuthOptions,
  IAuth,
  IAuthStorageState,
  IStorage,
} from './types';
import { Auth0Strategy } from './Auth0Strategy';
import EventEmitter from 'eventemitter3';
import { Auth0DecodedHash, AuthorizeOptions, LogoutOptions } from 'auth0-js';
import { StorageFacade } from './StorageFacade';

const DEFAULT_STORAGE_KEY = 'auth_storage';

export class Auth implements IAuth {
  private readonly authStrategy: Auth0Strategy;
  private readonly emitter: EventEmitter;
  private readonly storage: StorageFacade<IAuthStorageState>;

  constructor(
    options: AuthOptions,
    storage: IStorage = window.localStorage,
    storageKey: string = DEFAULT_STORAGE_KEY,
  ) {
    const { settings } = options;

    this.authStrategy = new Auth0Strategy(settings);
    this.emitter = new EventEmitter();
    this.storage = new StorageFacade<IAuthStorageState>(storage, storageKey);

    this.subscribeOnEvents(options);
  }

  public on(event: AuthEvent, callback: AuthCallback): void {
    this.emitter.on(event, callback);
  }

  public authorize(provider?: string, options?: AuthorizeOptions) {
    this.authStrategy.authorize(provider, options);
  }

  public async getAuthorizedData(): Promise<Auth0DecodedHash | null> {
    let auth0Data = null;

    try {
      auth0Data = await this.authStrategy?.getAuthorizedData();
    } catch (e) {
      this.emitter.emit(AuthEvent.AuthorizeFailed, e);
    }

    if (auth0Data) {
      const authState = this.authStrategy.convertAuthDataToState(auth0Data);

      this.storage.setState(authState);
      this.emitter.emit(AuthEvent.Authorized, auth0Data);

      return auth0Data;
    }

    return null;
  }

  public async refreshToken(): Promise<Auth0DecodedHash | null> {
    let auth0Data = null;

    try {
      auth0Data = await this.authStrategy.refresh();
    } catch (e) {
      this.emitter.emit(AuthEvent.RefreshFailed, e);
    }

    if (auth0Data) {
      const authState = this.authStrategy.convertAuthDataToState(auth0Data);

      this.storage.setState(authState);
      this.emitter.emit(AuthEvent.Refreshed, auth0Data);

      return auth0Data;
    }

    return null;
  }

  public async forgotPassword(email: string): Promise<string> {
    return this.authStrategy.forgotPassword(email);
  }

  public signOut(options?: LogoutOptions) {
    this.storage.purgeState();
    this.emitter.emit(AuthEvent.SignedOut);
    this.authStrategy?.signOut(options);
  }

  public currentUser(): IAuthStorageState {
    return this.storage.getState();
  }

  private subscribeOnEvents(options: AuthOptions): void {
    const {
      onAuthorized,
      onAuthorizeFailed,
      onRefreshed,
      onRefreshFailed,
      onSignedOut,
    } = options;

    if (typeof onAuthorized === 'function') {
      this.emitter.on(AuthEvent.Authorized, onAuthorized);
    }

    if (typeof onAuthorizeFailed === 'function') {
      this.emitter.on(AuthEvent.AuthorizeFailed, onAuthorizeFailed);
    }

    if (typeof onRefreshed === 'function') {
      this.emitter.on(AuthEvent.Refreshed, onRefreshed);
    }

    if (typeof onRefreshFailed === 'function') {
      this.emitter.on(AuthEvent.RefreshFailed, onRefreshFailed);
    }

    if (typeof onSignedOut === 'function') {
      this.emitter.on(AuthEvent.SignedOut, onSignedOut);
    }
  }
}
