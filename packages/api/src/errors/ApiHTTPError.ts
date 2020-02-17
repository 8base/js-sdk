import { IApiRequest } from '../types';

export class ApiHTTPError extends Error {
  public static hasError(httpResponse: Response) {
    return !httpResponse.ok;
  }

  public request: IApiRequest;
  public httpResponse: Response;

  constructor(request: IApiRequest, httpResponse: Response) {
    let message = 'HTTP Error.';

    if (httpResponse.status) {
      message = `${message} Code: ${httpResponse.status}.`;
    }

    if (httpResponse.statusText) {
      message = `${message} Message: ${httpResponse.statusText}.`;
    }

    super(message);

    Object.setPrototypeOf(this, ApiHTTPError.prototype);

    this.request = request;
    this.httpResponse = httpResponse;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ApiHTTPError);
    }
  }
}
