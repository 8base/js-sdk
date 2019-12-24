import { IGraphQLRequest, IGraphQLResponse } from './types';

export class GraphQLError<T> extends Error {
  public request: IGraphQLRequest;
  public response: IGraphQLResponse<T>;

  constructor(request: IGraphQLRequest, response: IGraphQLResponse<T>) {
    let message = 'GraphQL Error.';

    if (response.errors[0].code) {
      message = `${message} Code: ${response.errors[0]}.`;
    }

    if (response.errors[0].message) {
      message = `${message} Message: ${response.errors[0].message}.`;
    }

    super(message);

    this.request = request;
    this.response = response;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, GraphQLError);
    }
  }
}
