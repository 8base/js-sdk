import 'cross-fetch/polyfill';

import { API_ENDPOINT } from './constants';
import { HTTPError } from './httpError';
import { IApiOptions, IFetchOptions, IGraphQLRequest, IGraphQLResponse, IGraphQLVariables } from './types';

export class Api {
  private readonly url: string;
  private readonly headers: IApiOptions['headers'];

  constructor(options: IApiOptions) {
    const { workspaceId, headers } = options;

    this.url = `${API_ENDPOINT}/${workspaceId}`;
    this.headers = headers;
  }

  public async request<T>(
    query: string,
    variables?: IGraphQLVariables,
    options: IFetchOptions = { headers: {} },
  ): Promise<IGraphQLResponse<T>> {
    const request: IGraphQLRequest = {
      query,
      variables,
    };

    const body = JSON.stringify(request);
    const headers = this.composeHeaders(options.headers);

    const httpResponse = await fetch(this.url, {
      ...options,
      method: 'POST',
      body,
      headers,
    });

    if (!httpResponse.ok) {
      throw new HTTPError(request, httpResponse);
    }

    const response: IGraphQLResponse<T> = await httpResponse.json();

    return response;
  }

  private composeHeaders(headers: RequestInit['headers'] = {}): RequestInit['headers'] {
    return {
      ...(typeof this.headers === 'function' ? this.headers() : this.headers),
      ...headers,
      'content-type': 'application/json',
    };
  }
}
