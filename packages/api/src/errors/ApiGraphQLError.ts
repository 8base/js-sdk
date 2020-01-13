import { IGraphQLRequest, IGraphQLResponse } from '../types';

export class ApiGraphQLError extends Error {
  public static hasError(response: IGraphQLResponse) {
    return Array.isArray(response.errors) && response.errors.length > 0;
  }

  public request: IGraphQLRequest;
  public response: IGraphQLResponse;

  constructor(request: IGraphQLRequest, response: IGraphQLResponse) {
    let message = 'GraphQL Error.';

    if (response.errors[0].code) {
      message = `${message} Code: ${response.errors[0]}.`;
    }

    if (response.errors[0].message) {
      message = `${message} Message: ${response.errors[0].message}.`;
    }

    super(message);

    Object.setPrototypeOf(this, ApiGraphQLError.prototype);

    this.request = request;
    this.response = response;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ApiGraphQLError);
    }
  }
}
