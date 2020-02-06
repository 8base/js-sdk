import { ExecutionResult } from 'graphql';
import { ConnectionParams } from 'subscriptions-transport-ws';
import ErrorCodes from '@8base/error-codes';

import { ApiGraphQLError } from './errors/ApiGraphQLError';

export type IRerunFunction = (
  newRequest?: Partial<IApiRequest>,
) => Promise<ExecutionResult>;

export type IErrorCallback = (
  error: ApiGraphQLError,
  rerun: IRerunFunction,
) => void | Promise<ExecutionResult>;

export type IErrorMap = {
  [key in keyof typeof ErrorCodes | 'default']?: IErrorCallback;
};

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

export type IApiHeaders =
  | RequestInit['headers']
  | (() => RequestInit['headers'])
  | (() => Promise<RequestInit['headers']>);

export interface IApiOptions {
  workspaceId: string;
  headers?: IApiHeaders;
  catchErrors?: IErrorCallback | IErrorMap;
  transformRequest?: Array<IHandlerFunction<IApiRequest>>;
  transformResponse?: Array<
    IHandlerFunction<{
      request: IApiRequest;
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

export interface IApiRequest {
  query: string;
  variables?: IGraphQLVariables;
  fetchOptions: IFetchOptions;
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
