import { ApiGraphQLError } from './errors/ApiGraphQLError';
import { ApiHTTPError } from './errors/ApiHTTPError';

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

export type ApiHeaders =
  | RequestInit['headers']
  | (() => RequestInit['headers']);

export interface IApiOptions {
  workspaceId: string;
  headers?: ApiHeaders;
  catchErrors?: (error: ApiGraphQLError | ApiHTTPError) => void;
  transformRequest?: Array<IHandlerFunction<IGraphQLRequest>>;
  transformResponse?: Array<
    IHandlerFunction<{
      request: IGraphQLRequest;
      response: IGraphQLResponse;
    }>
  >;
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

export interface IGraphQLResponse {
  data?: any;
  errors?: IGraphQLErrorDescription[];
}

export type IHandlerFunction<T> = (
  next: (data: T) => Promise<T>,
  data: T,
) => Promise<T>;
