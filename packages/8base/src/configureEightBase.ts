import Auth, { IAuth } from '@8base-js-sdk/auth';
import Api, { ApiGraphQLError, IRerunFunction } from '@8base-js-sdk/api';
import ErrorCodes from '@8base/error-codes';

import { ExtendedAuth } from './ExtendedAuth';
import { IEightBaseOptions, IGraphQLAuth } from './types';

export default function configureEightBase(
  options: IEightBaseOptions,
): {
  api: Api;
  auth: IAuth & IGraphQLAuth;
} {
  const {
    workspaceId,
    Auth: authOptions,
    Api: apiOptions,
    storageKey,
    autoTokenRefresh = false,
  } = options;
  let { storage } = options;
  let apiHeaders = apiOptions.headers;
  let apiCatchErrors = apiOptions.catchErrors;

  if (autoTokenRefresh && !storage && window && window.localStorage) {
    storage = window.localStorage;
  }

  const auth = new Auth(authOptions, storage, storageKey);

  if (autoTokenRefresh) {
    apiHeaders = () => {
      const authState = auth.storage?.getState();

      if (authState?.idToken) {
        return Api.composeHeaders(apiOptions.headers, {
          auth: `Bearer ${authState?.idToken}`,
        });
      }

      return Api.composeHeaders(apiOptions.headers);
    };

    apiCatchErrors = {
      [ErrorCodes.TokenExpiredErrorCode]: async (
        _error: ApiGraphQLError,
        rerun: IRerunFunction,
      ) => {
        await auth.refreshToken();
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

  return {
    api,
    auth: extendedAuth,
  };
}
