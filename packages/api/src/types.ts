export interface IFetchOptions {
  mode?: RequestInit['mode'];
  credentials?: RequestInit['credentials'];
  cache?: RequestInit['cache'];
  redirect?: RequestInit['redirect'];
  referrer?: RequestInit['referrer'];
  referrerPolicy?: RequestInit['referrerPolicy'];
  integrity?: RequestInit['integrity'];
  keepalive?: RequestInit['keepalive'];
  headers?: RequestInit['headers'];
}

export type ApiHeaders = RequestInit['headers'] | (() => RequestInit['headers']);

export interface IApiOptions {
  headers?: ApiHeaders;
  workspaceId: string;
}

export interface IGraphQLErrorDescription {
  message?: string;
  code?: string;
  path?: string | number | Array<string | number>;
  locations?: Array<{ line: number; column: number }>;
  details?: any;
}

export interface IGraphQLVariables {
  [key: string]: any;
}

export interface IGraphQLRequest {
  query: string;
  variables?: IGraphQLVariables;
}

export interface IGraphQLResponse<T> {
  data: T;
  errors: IGraphQLErrorDescription[];
}
