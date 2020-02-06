import { Auth } from '@8base/auth';
import { Api, ApiGraphQLError } from '@8base/api';
import ErrorCodes from '@8base/error-codes';

import { ExtendedAuth } from './ExtendedAuth';
import { IEightBaseOptions } from './types';

export class EightBase {
  public readonly auth: ExtendedAuth;
  public readonly api: Api;

  constructor(options: IEightBaseOptions) {
    const {
      workspaceId,
      authProfileId,
      auth: authOptions,
      api: apiOptions,
      autoTokenRefresh = false,
    } = options;

    let apiHeaders = apiOptions.headers;
    let apiCatchErrors = apiOptions.catchErrors;

    if (autoTokenRefresh) {
      apiHeaders = () => {
        const { idToken } = this.auth.currentUser();

        return Api.composeHeaders(apiOptions.headers, {
          auth: `Bearer ${idToken}`,
        });
      };

      apiCatchErrors = {
        [ErrorCodes.TokenExpiredErrorCode]: async (error: ApiGraphQLError) => {
          await this.auth.refreshToken();

          return this.api.request(error.request.query, error.request.variables);
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

    const auth = new Auth(authOptions);
    const api = new Api({
      ...apiOptions,
      headers: apiHeaders,
      catchErrors: apiCatchErrors,
      workspaceId,
    });
    const extendedAuth = new ExtendedAuth({
      api,
      auth,
      authProfileId,
    });

    this.api = api;
    this.auth = extendedAuth;
  }
}
