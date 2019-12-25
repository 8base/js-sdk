import { IGraphQLRequest } from '../types';

export class ApiHTTPError extends Error {
  public request: IGraphQLRequest;
  public httpResponse: Response;

  constructor(request: IGraphQLRequest, httpResponse: Response) {
    let message = 'HTTP Error.';

    if (httpResponse.status) {
      message = `${message} Code: ${httpResponse.status}.`;
    }

    if (httpResponse.statusText) {
      message = `${message} Message: ${httpResponse.statusText}.`;
    }

    super(message);

    this.request = request;
    this.httpResponse = httpResponse;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ApiHTTPError);
    }
  }
}
