import { Auth0DecodedHash } from 'auth0-js';

export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export enum AuthStrategy {
  CustomAuth = 'CUSTOM_AUTH',
  Auth0Auth = 'AUTH0_AUTH',
}

export interface ICommonAuthSettings {
  authProfileId: string;
}

export interface IAuth0AuthSettings extends ICommonAuthSettings {
  clientId: string;
  domain: string;
  redirectUri: string;
  logoutRedirectUri: string;
}

export interface IAuthOptions<T extends AuthStrategy> {
  strategy: T;
  settings: T extends AuthStrategy.Auth0Auth
    ? IAuth0AuthSettings
    : ICommonAuthSettings;
}

export interface IAuth0State {
  idToken: string;
  accessToken: string;
  expiresIn: number;
  email: string;
  emailVerified: string;
  idTokenPayload: Auth0DecodedHash['idTokenPayload'];
}
