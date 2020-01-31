import { ExecutionResult } from 'graphql';
import { ConnectionParams } from 'subscriptions-transport-ws';

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
      response: ExecutionResult;
    }>
  >;
  subscription?: {
    connecting?: () => void;
    connected?: () => void;
    reconnecting?: () => void;
    reconnected?: () => void;
    disconnected?: () => void;
    error?: (error: Error) => void;
    connectionParams?: ConnectionParams | (() => ConnectionParams);
  };
}

export interface IApiSubscriptionOptions {
  variables?: IGraphQLVariables;
  data?: (data: ExecutionResult) => void;
  error?: (error: Error) => void;
}

export interface IGraphQLVariables {
  [key: string]: any;
}

export interface IGraphQLRequest {
  query: string;
  variables?: IGraphQLVariables;
}

export interface IWebhookRequest {
  method: string;
  path?: string;
  data?: {
    [key: string]: string;
  };
}

export type IHandlerFunction<T> = (
  next: (data: T) => Promise<T>,
  data: T,
) => Promise<T>;
