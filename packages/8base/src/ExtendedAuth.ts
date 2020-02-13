import { Api, ApiGraphQLError } from '@8base/api';
import {
  Auth,
  IAuth,
  AuthEvent,
  AuthCallback,
  AuthorizeOptions,
  LogoutOptions,
} from '@8base/auth';

import { IExtendedAuthOptions, IGraphQLAuth, IUser, UserCreate } from './types';
import {
  USER_LOGIN_MUTATION,
  USER_SIGN_UP_MUTATION,
  USER_SIGN_UP_WITH_TOKEN_MUTATION,
} from './graphql';

export class ExtendedAuth implements IAuth, IGraphQLAuth {
  private readonly api: Api;
  private readonly auth: Auth;
  private readonly authProfileId: string;

  constructor(options: IExtendedAuthOptions) {
    const { api, auth, authProfileId } = options;

    this.api = api;
    this.auth = auth;
    this.authProfileId = authProfileId;
  }

  public authorize(provider?: string, options?: AuthorizeOptions) {
    return this.auth.authorize(provider, options);
  }

  public getAuthorizedData() {
    return this.auth.getAuthorizedData();
  }

  public refreshToken() {
    return this.auth.refreshToken();
  }

  public forgotPassword(email: string) {
    return this.auth.forgotPassword(email);
  }

  public signOut(options?: LogoutOptions) {
    return this.auth.signOut(options);
  }

  public currentUser() {
    return this.auth.currentUser();
  }

  public on(event: AuthEvent, callback: AuthCallback) {
    return this.auth.on(event, callback);
  }

  public async signIn(
    email: string,
    password: string,
  ): Promise<{ idToken: string; refreshToken: string } | null> {
    const variables = {
      data: {
        email,
        password,
        authProfileId: this.authProfileId,
      },
    };

    const result = await this.api.request(USER_LOGIN_MUTATION, variables);

    if (ApiGraphQLError.hasError(result)) {
      throw new ApiGraphQLError(
        {
          query: USER_LOGIN_MUTATION,
          variables,
        },
        result,
      );
    }

    if (result?.data?.userLogin?.auth) {
      return result.data.userLogin.auth;
    }

    return null;
  }

  public async signUp(
    user: UserCreate,
    password: string,
  ): Promise<IUser | null> {
    const variables = {
      authProfileId: this.authProfileId,
      user,
      password,
    };

    const result = await this.api.request(USER_SIGN_UP_MUTATION, variables);

    if (ApiGraphQLError.hasError(result)) {
      throw new ApiGraphQLError(
        {
          query: USER_SIGN_UP_MUTATION,
          variables,
        },
        result,
      );
    }

    if (result?.data?.userSignUpWithPassword) {
      return result.data.userSignUpWithPassword;
    }

    return null;
  }

  public async signUpWithToken(
    user: UserCreate,
    token: string,
  ): Promise<IUser | null> {
    const variables = {
      user,
    };

    const fetchOptions = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const result = await this.api.request(
      USER_SIGN_UP_WITH_TOKEN_MUTATION,
      variables,
      fetchOptions,
    );

    if (ApiGraphQLError.hasError(result)) {
      throw new ApiGraphQLError(
        {
          query: USER_SIGN_UP_WITH_TOKEN_MUTATION,
          variables,
        },
        result,
      );
    }

    if (result?.data?.userSignUpWithToken) {
      return result.data.userSignUpWithToken;
    }

    return null;
  }
}
