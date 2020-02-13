import { Auth } from '@8base/auth';
import { Api } from '@8base/api';

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
    } = options;

    const auth = new Auth(authOptions);
    const api = new Api({
      ...apiOptions,
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
