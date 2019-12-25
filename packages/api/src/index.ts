import 'cross-fetch/polyfill';
import { DocumentNode, Kind, OperationDefinitionNode, OperationTypeNode, parse } from 'graphql/language';

import { API_ENDPOINT } from './constants';
import { ApiHTTPError } from './errors/ApiHTTPError';
import { IApiOptions, IFetchOptions, IGraphQLRequest, IGraphQLResponse, IGraphQLVariables } from './types';

const GRAPHQL_FULL_QUERY_PATTERN = /^\s*query/im;

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
    const queryDocument = this.getQueryDocument(query);
    const operationDefinition = this.getOperationDefinition(queryDocument);
    const isValidOperation =
      this.isOperation('mutation', operationDefinition) || this.isOperation('query', operationDefinition);

    if (!isValidOperation) {
      throw new Error('Expected GraphQL query or mutation.');
    }

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
      throw new ApiHTTPError(request, httpResponse);
    }

    const response: IGraphQLResponse<T> = await httpResponse.json();

    return response;
  }

  /**
   * Runs only graphQL queries in the following formats:
   * "{ someQuery { field1 field2 }}"
   * "query { someQuery { field1 field2 }}"
   * "query QueryName { someQuery { field1 field2 }}"
   */
  public async query<T>(
    query: string,
    variables?: IGraphQLVariables,
    options?: IFetchOptions,
  ): Promise<IGraphQLResponse<T>> {
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
  public async mutation<T>(
    query: string,
    variables?: IGraphQLVariables,
    options?: IFetchOptions,
  ): Promise<IGraphQLResponse<T>> {
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

  private getQueryDocument(query: string): DocumentNode {
    return parse(query);
  }

  private getOperationDefinition(root: DocumentNode): OperationDefinitionNode {
    return root.definitions.find(
      definition => definition.kind === Kind.OPERATION_DEFINITION,
    ) as OperationDefinitionNode;
  }

  private isOperation(operationType: OperationTypeNode, operationDefinition: OperationDefinitionNode): boolean {
    return operationDefinition.operation === operationType;
  }

  private composeHeaders(headers: RequestInit['headers'] = {}): RequestInit['headers'] {
    return {
      ...(typeof this.headers === 'function' ? this.headers() : this.headers),
      ...headers,
      'content-type': 'application/json',
    };
  }
}
