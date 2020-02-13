import 'cross-fetch/polyfill';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import WebSocket from 'isomorphic-ws';
import qs from 'qs';

import { API_ENDPOINT, WS_ENDPOINT } from './constants';
import { ApiHTTPError } from './errors/ApiHTTPError';
import { ApiGraphQLError } from './errors/ApiGraphQLError';
import {
  IApiHeaders,
  IApiOptions,
  IApiSubscriptionOptions,
  IFetchOptions,
  IApiRequest,
  IGraphQLVariables,
  IWebhookRequest,
} from './types';
import { ChainHandler } from './ChainHandler';
import { ExecutionResult } from 'graphql';
import { GraphQLController } from './GraphQLController';
import { ErrorHandler } from './ErrorHandler';

interface ITransformResponseData {
  request: IApiRequest;
  response: ExecutionResult;
}

export class Api {
  public static async composeHeaders(
    ...headersArr: IApiHeaders[]
  ): Promise<RequestInit['headers']> {
    const headersObjects: Array<RequestInit['headers']> = [];
    const headersPromises: Array<Promise<RequestInit['headers']>> = [];

    headersArr.filter(Boolean).forEach(headers => {
      if (typeof headers === 'function') {
        const headersResult = headers();

        if (headersResult instanceof Promise) {
          headersPromises.push(headersResult);
        } else {
          headersObjects.push(headersResult);
        }
      } else {
        headersObjects.push(headers);
      }
    });

    const headersObjectsFromPromises = await Promise.all(headersPromises);

    const composedHeaders = headersObjects
      .concat(headersObjectsFromPromises)
      .reduce((acc, headers) => {
        return {
          ...acc,
          ...headers,
        };
      }, {});

    return composedHeaders;
  }

  public readonly subscriptionClient: SubscriptionClient;
  private readonly url: string;
  private readonly headers: IApiOptions['headers'];
  private readonly errorHandler: ErrorHandler;
  private readonly requestHandler: ChainHandler<IApiRequest>;
  private readonly responseHandler: ChainHandler<ITransformResponseData>;

  constructor(options: IApiOptions) {
    const {
      workspaceId,
      headers,
      catchErrors,
      transformRequest = [],
      subscription,
    } = options;
    let { transformResponse = [] } = options;

    if (catchErrors) {
      transformResponse = [
        async (next, data) => {
          return this.catchApiGraphQLError(next, data);
        },
        ...transformResponse,
      ];
    }

    this.url = `${API_ENDPOINT}/${workspaceId}`;
    this.headers = headers;
    this.errorHandler = new ErrorHandler(catchErrors);
    this.requestHandler = ChainHandler.fromArray(transformRequest);
    this.responseHandler = ChainHandler.fromArray(transformResponse);
    this.subscriptionClient = this.prepareSubscriptionClient(
      workspaceId,
      subscription,
    );
  }

  public async request(
    query: string,
    variables?: IGraphQLVariables,
    fetchOptions: IFetchOptions = { headers: {} },
  ): Promise<ExecutionResult> {
    const queryDocument = GraphQLController.getQueryDocument(query);
    const operationDefinition = GraphQLController.getOperationDefinition(
      queryDocument,
    );
    const isValidOperation =
      GraphQLController.isOperation('mutation', operationDefinition) ||
      GraphQLController.isOperation('query', operationDefinition);

    if (!isValidOperation) {
      throw new Error('Expected GraphQL query or mutation.');
    }

    const transformedApiRequest = await this.requestHandler.handle({
      query,
      variables,
      fetchOptions,
    });

    const body = JSON.stringify({
      query: transformedApiRequest.query,
      variables: transformedApiRequest.variables,
    });
    const headers = await Api.composeHeaders(
      this.headers,
      transformedApiRequest.fetchOptions?.headers || {},
      {
        'content-type': 'application/json',
      },
    );

    const httpResponse = await fetch(this.url, {
      ...transformedApiRequest.fetchOptions,
      method: 'POST',
      body,
      headers,
    });

    if (ApiHTTPError.hasError(httpResponse)) {
      const httpError = new ApiHTTPError(transformedApiRequest, httpResponse);

      throw httpError;
    }

    const { response } = await this.responseHandler.handle({
      request: transformedApiRequest,
      response: await httpResponse.json(),
    });

    return response;
  }

  /**
   * Runs only graphQL queries in the following formats:
   * "{ someQuery { field1 field2 }}"
   * "query { someQuery { field1 field2 }}"
   * "query QueryName { someQuery { field1 field2 }}"
   */
  public async query(
    query: string,
    variables?: IGraphQLVariables,
    options?: IFetchOptions,
  ): Promise<ExecutionResult> {
    const queryDocument = GraphQLController.getQueryDocument(query);
    const operationDefinition = GraphQLController.getOperationDefinition(
      queryDocument,
    );

    if (!GraphQLController.isOperation('query', operationDefinition)) {
      throw new Error('Expected GraphQL query.');
    }

    return this.request(query, variables, options);
  }

  /**
   * Runs only graphQL mutations in the following formats:
   * "{ someMutation(data) { field1 field2 }}"
   * "mutation { someMutation(data) { field1 field2 }}"
   * "mutation MutationName { someMutation(data) { field1 field2 }}"
   */
  public async mutation(
    query: string,
    variables?: IGraphQLVariables,
    options?: IFetchOptions,
  ): Promise<ExecutionResult> {
    // It's not possible to differentiate "query { someQuery }"
    // from "{ someQuery }" form by ast parser means
    // so it checks for "query { someQuery }" form by plain regular expression
    if (GraphQLController.doesStartWithQuery(query)) {
      throw new Error('Expected GraphQL mutation.');
    }

    const queryDocument = GraphQLController.getQueryDocument(query);
    const operationDefinition = GraphQLController.getOperationDefinition(
      queryDocument,
    );

    if (GraphQLController.isOperation('subscription', operationDefinition)) {
      throw new Error('Expected GraphQL mutation.');
    }

    // By default operation without manual query/mutation keyword
    // (i.e. "{ someResolver { field1 field2 }}") parsed as a query.
    // The method changes it to mutation manually.
    if (GraphQLController.isOperation('query', operationDefinition)) {
      query = `mutation ${query}`;
    }

    return this.request(query, variables, options);
  }

  public subscription(
    query: string,
    options: IApiSubscriptionOptions = {},
  ): () => void {
    const { variables, data, error } = options;

    const result = this.subscriptionClient.request({
      query,
      variables,
    });

    const { unsubscribe } = result.subscribe({
      next(result) {
        if (typeof data === 'function') {
          data(result);
        }
      },
      error(e) {
        if (typeof error === 'function') {
          error(e);
        }
      },
    });

    return unsubscribe;
  }

  public closeSubscriptionConnection() {
    this.subscriptionClient.close();
  }

  public invoke(
    functionName: string,
    request: IWebhookRequest,
    options?: IFetchOptions,
  ) {
    let webhookUrl = `${this.url}/webhook/${functionName}`;

    if (request.path) {
      webhookUrl = `${this.url}/webhook/${request.path}`;
    }

    if (request.data) {
      webhookUrl = `${webhookUrl}${qs.stringify(request.data, {
        addQueryPrefix: true,
      })}`;
    }

    const fetchOptions = {
      ...(options || {}),
      method: request.method,
    };

    return fetch(webhookUrl, fetchOptions);
  }

  private async catchApiGraphQLError(
    next: (data: ITransformResponseData) => Promise<ITransformResponseData>,
    data: ITransformResponseData,
  ): Promise<ITransformResponseData> {
    if (data.response && ApiGraphQLError.hasError(data.response)) {
      const result = this.errorHandler.handle(
        new ApiGraphQLError(data.request, data.response),
        newRequest =>
          this.request(
            newRequest?.query || data.request.query,
            newRequest?.variables || data.request.variables,
            newRequest?.fetchOptions || data.request.fetchOptions,
          ),
      );

      if (result && result instanceof Promise) {
        const newResponse = await result;

        return next({
          request: data.request,
          response: newResponse,
        });
      }
    }

    return next(data);
  }

  private prepareSubscriptionClient(
    workspaceId: string,
    subscriptionOptions: IApiOptions['subscription'] = {},
  ): SubscriptionClient {
    const {
      connecting,
      connected,
      reconnecting,
      reconnected,
      disconnected,
      error,
      connectionParams,
    } = subscriptionOptions;

    const subscriptionClient = new SubscriptionClient(
      WS_ENDPOINT,
      {
        lazy: true,
        reconnect: true,
        connectionParams: () => ({
          ...(typeof connectionParams === 'function'
            ? connectionParams()
            : connectionParams),
          workspaceId,
        }),
      },
      WebSocket,
      [],
    );

    if (typeof connecting === 'function') {
      subscriptionClient.onConnecting(connecting);
    }

    if (typeof connected === 'function') {
      subscriptionClient.onConnected(connected);
    }

    if (typeof reconnecting === 'function') {
      subscriptionClient.onReconnecting(reconnecting);
    }

    if (typeof reconnected === 'function') {
      subscriptionClient.onReconnected(reconnected);
    }

    if (typeof disconnected === 'function') {
      subscriptionClient.onDisconnected(disconnected);
    }

    if (typeof error === 'function') {
      subscriptionClient.onError(error);
    }

    return subscriptionClient;
  }
}
