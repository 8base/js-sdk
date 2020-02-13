import { Auth } from '@8base/auth';
import { Api, ApiGraphQLError } from '@8base/api';
import ErrorCodes from '@8base/error-codes';

import { ExtendedAuth } from './ExtendedAuth';
import { IEightBaseOptions } from './types';
import { IRerunFunction } from '@8base/api/lib';

export class EightBase {
  public readonly auth: ExtendedAuth;
  public readonly api: Api;

  constructor(options: IEightBaseOptions) {
    const {
      workspaceId,
      auth: authOptions,
      api: apiOptions,
      storage,
      storageKey,
      autoTokenRefresh = true,
    } = options;

    let apiHeaders = apiOptions.headers;
    let apiCatchErrors = apiOptions.catchErrors;

    if (autoTokenRefresh) {
      apiHeaders = () => {
        const { idToken } = this.auth.currentUser();

        if (idToken) {
          return Api.composeHeaders(apiOptions.headers, {
            auth: `Bearer ${idToken}`,
          });
        }

        return Api.composeHeaders(apiOptions.headers);
      };

      apiCatchErrors = {
        [ErrorCodes.TokenExpiredErrorCode]: async (
          _error: ApiGraphQLError,
          rerun: IRerunFunction,
        ) => {
          await this.auth.refreshToken();

          return rerun();
        },
      };

      if (typeof apiOptions.catchErrors === 'function') {
        apiCatchErrors.default = apiOptions.catchErrors;
      } else if (apiOptions.catchErrors) {
        apiCatchErrors = {
          ...apiOptions.catchErrors,
          ...apiCatchErrors,
        };
      }
    }

    const auth = new Auth(authOptions, storage, storageKey);
    const api = new Api({
      ...apiOptions,
      headers: apiHeaders,
      catchErrors: apiCatchErrors,
      workspaceId,
    });
    const extendedAuth = new ExtendedAuth({
      api,
      auth,
      authProfileId: authOptions.settings.authProfileId,
    });

    this.api = api;
    this.auth = extendedAuth;
  }
}
