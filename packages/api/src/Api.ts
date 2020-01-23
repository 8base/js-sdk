import 'cross-fetch/polyfill';
import {
  DocumentNode,
  Kind,
  OperationDefinitionNode,
  OperationTypeNode,
  parse,
} from 'graphql/language';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import WebSocket from 'isomorphic-ws';
import qs from 'qs';

import { API_ENDPOINT, WS_ENDPOINT } from './constants';
import { ApiHTTPError } from './errors/ApiHTTPError';
import { ApiGraphQLError } from './errors/ApiGraphQLError';
import {
  IApiOptions,
  IApiSubscriptionOptions,
  IFetchOptions,
  IGraphQLRequest,
  IGraphQLVariables,
  IWebhookRequest,
} from './types';
import { ChainHandler } from './ChainHandler';
import { ExecutionResult } from 'graphql';

const GRAPHQL_FULL_QUERY_PATTERN = /^\s*query/im;

export class Api {
  public readonly subscriptionClient: SubscriptionClient;
  private readonly url: string;
  private readonly headers: IApiOptions['headers'];
  private readonly catchErrors: IApiOptions['catchErrors'];
  private readonly requestHandler: ChainHandler<IGraphQLRequest>;
  private readonly responseHandler: ChainHandler<{
    request: IGraphQLRequest;
    response: ExecutionResult;
  }>;

  constructor(options: IApiOptions) {
    const {
      workspaceId,
      headers,
      catchErrors,
      transformRequest = [],
      subscription,
    } = options;
    let { transformResponse = [] } = options;

    if (typeof catchErrors === 'function') {
      transformResponse = [
        async (next, data) => {
          const transformedData = await next(data);

          if (
            transformedData.response &&
            ApiGraphQLError.hasError(transformedData.response) &&
            typeof this.catchErrors === 'function'
          ) {
            this.catchErrors(
              new ApiGraphQLError(
                transformedData.request,
                transformedData.response,
              ),
            );
          }

          return transformedData;
        },
        ...transformResponse,
      ];
    }

    this.url = `${API_ENDPOINT}/${workspaceId}`;
    this.headers = headers;
    this.catchErrors = catchErrors;
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
    options: IFetchOptions = { headers: {} },
  ): Promise<ExecutionResult> {
    const queryDocument = this.getQueryDocument(query);
    const operationDefinition = this.getOperationDefinition(queryDocument);
    const isValidOperation =
      this.isOperation('mutation', operationDefinition) ||
      this.isOperation('query', operationDefinition);

    if (!isValidOperation) {
      throw new Error('Expected GraphQL query or mutation.');
    }

    const request: IGraphQLRequest = await this.requestHandler.handle({
      query,
      variables,
    });

    const body = JSON.stringify(request);
    const headers = this.composeHeaders(options.headers);

    const httpResponse = await fetch(this.url, {
      ...options,
      method: 'POST',
      body,
      headers,
    });

    if (ApiHTTPError.hasError(httpResponse)) {
      const httpError = new ApiHTTPError(request, httpResponse);

      if (typeof this.catchErrors === 'function') {
        this.catchErrors(httpError);
      }

      throw httpError;
    }

    const { response } = await this.responseHandler.handle({
      request,
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
    const queryDocument = this.getQueryDocument(query);
    const operationDefinition = this.getOperationDefinition(queryDocument);

    if (!this.isOperation('query', operationDefinition)) {
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
    if (GRAPHQL_FULL_QUERY_PATTERN.test(query)) {
      throw new Error('Expected GraphQL mutation.');
    }

    const queryDocument = this.getQueryDocument(query);
    const operationDefinition = this.getOperationDefinition(queryDocument);

    if (this.isOperation('subscription', operationDefinition)) {
      throw new Error('Expected GraphQL mutation.');
    }

    // By default operation without manual query/mutation keyword
    // (i.e. "{ someResolver { field1 field2 }}") parsed as a query.
    // The method changes it to mutation manually.
    if (this.isOperation('query', operationDefinition)) {
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

  private getQueryDocument(query: string): DocumentNode {
    return parse(query);
  }

  private getOperationDefinition(root: DocumentNode): OperationDefinitionNode {
    return root.definitions.find(
      definition => definition.kind === Kind.OPERATION_DEFINITION,
    ) as OperationDefinitionNode;
  }

  private isOperation(
    operationType: OperationTypeNode,
    operationDefinition: OperationDefinitionNode,
  ): boolean {
    return operationDefinition.operation === operationType;
  }

  private composeHeaders(
    headers: RequestInit['headers'] = {},
  ): RequestInit['headers'] {
    return {
      ...(typeof this.headers === 'function' ? this.headers() : this.headers),
      ...headers,
      'content-type': 'application/json',
    };
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
