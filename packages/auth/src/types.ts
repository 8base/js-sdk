import { Auth0DecodedHash } from 'auth0-js';

export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const enum AuthStrategy {
  CustomAuth = 'CUSTOM_AUTH',
  Auth0Auth = 'AUTH0_AUTH',
}

export interface ICommonAuthSettings {} // tslint:disable-line

export interface IAuth0AuthSettings extends ICommonAuthSettings {
  clientId: string;
  domain: string;
  redirectUri: string;
  logoutRedirectUri: string;
}

export interface ICustomAuthOptions {
  strategy: AuthStrategy.CustomAuth;
  settings: ICommonAuthSettings;
}

export interface IAuth0AuthOptions {
  strategy: AuthStrategy.Auth0Auth;
  settings: IAuth0AuthSettings;
}

export type AuthOptions = ICustomAuthOptions | IAuth0AuthOptions;

export interface IAuthState {
  idToken: string;
  email: string;
}

export interface IAuth0State extends IAuthState {
  accessToken: string;
  expiresIn: number;
  emailVerified: string;
  idTokenPayload: Auth0DecodedHash['idTokenPayload'];
}

export interface IAuth {
  authorize(provider?: string, options?: {}): void;
  getAuthorizedData(): Promise<any>;
  refreshToken(): Promise<any>;
  forgotPassword(email: string): Promise<string>;
  signOut(options?: {}): void;
  currentUser(): any;
}
