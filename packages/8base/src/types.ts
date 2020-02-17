import { AuthOptions, Auth, IStorage } from '@8base-js-sdk/auth';
import { IApiOptions, Api } from '@8base-js-sdk/api';

export interface IEightBaseOptions {
  workspaceId: string;
  auth: AuthOptions & {
    settings: AuthOptions['settings'] & { authProfileId: string };
  };
  api: Omit<IApiOptions, 'workspaceId'>;
  autoTokenRefresh?: boolean;
  storage?: IStorage;
  storageKey?: string;
}

export interface IExtendedAuthOptions {
  authProfileId: string;
  auth: Auth;
  api: Api;
}

export interface IUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  status?: string;
}

export type UserCreate = Omit<IUser, 'id'>;

export interface IGraphQLAuth {
  signIn(
    email: string,
    password: string,
  ): Promise<{ idToken: string; refreshToken: string } | null>;
  signUp(user: UserCreate, password: string): Promise<IUser | null>;
  signUpWithToken(
    user: UserCreate,
    password: string,
    token: string,
  ): Promise<IUser | null>;
}
