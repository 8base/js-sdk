import { Auth0DecodedHash, AuthorizeOptions, LogoutOptions } from 'auth0-js';

export { AuthorizeOptions, LogoutOptions };

export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const enum AuthStrategy {
  // CustomAuth = 'CUSTOM_AUTH',
  Auth0Auth = 'AUTH0_AUTH',
}

export enum AuthEvent {
  Authorized = 'authorized',
  AuthorizeFailed = 'authorizeFailed',
  Refreshed = 'refreshed',
  RefreshFailed = 'refreshFailed',
  SignedOut = 'signedOut',
}

export interface IAuth0AuthSettings {
  clientId: string;
  domain: string;
  redirectUri: string;
  logoutRedirectUri: string;
}

export interface IAuth0AuthOptions {
  strategy: AuthStrategy;
  settings: IAuth0AuthSettings;
  onAuthorized?: (data: Auth0DecodedHash) => void;
  onAuthorizeFailed?: (error: Error) => void;
  onRefreshed?: (data: Auth0DecodedHash) => void;
  onRefreshFailed?: (error: Error) => void;
  onSignedOut?: () => void;
}

export type AuthOptions = IAuth0AuthOptions;

export type AuthCallback = (a: any) => void;

export interface IAuth {
  authorize(provider?: string, options?: {}): void;
  getAuthorizedData(): Promise<Auth0DecodedHash | null>;
  refreshToken(): Promise<Auth0DecodedHash | null>;
  forgotPassword(email: string): Promise<string>;
  signOut(options?: {}): void;
  on(event: AuthEvent, callback: AuthCallback): void;
}

export interface IAuthStorageState {
  idToken: string;
  email: string;
  accessToken: string;
  expiresIn: number;
  emailVerified: string;
  idTokenPayload: Auth0DecodedHash['idTokenPayload'];
}
