import ErrorCodes from '@8base/error-codes';

import { ApiGraphQLError } from './errors/ApiGraphQLError';
import { IErrorCallback, IErrorMap, IRerunFunction } from './types';
import { DEFAULT_ERROR_MAP_KEY } from './constants';
import { ExecutionResult } from 'graphql';

export class ErrorHandler {
  private readonly errorCallback?: IErrorCallback;
  private readonly errorMap?: IErrorMap;

  constructor(callback?: IErrorCallback | IErrorMap) {
    if (typeof callback === 'function') {
      this.errorCallback = callback;
    } else if (callback) {
      this.errorMap = callback;
    }
  }

  public handle(
    error: ApiGraphQLError,
    rerun: IRerunFunction,
  ): void | Promise<ExecutionResult> {
    if (this.errorCallback) {
      return this.handleWithCallback(error, rerun);
    }

    if (this.errorMap) {
      return this.handleWithErrorMap(error, rerun);
    }
  }

  private handleWithCallback(error: ApiGraphQLError, rerun: IRerunFunction) {
    if (!this.errorCallback) {
      return;
    }

    return this.errorCallback(error, rerun);
  }

  private handleWithErrorMap(error: ApiGraphQLError, rerun: IRerunFunction) {
    if (!this.errorMap) {
      return;
    }

    // @ts-ignore
    const code: keyof typeof ErrorCodes = error.response.errors[0].code;

    if (code && typeof this.errorMap[code] === 'function') {
      // @ts-ignore
      return this.errorMap[code](error, rerun);
    } else if (typeof this.errorMap[DEFAULT_ERROR_MAP_KEY] === 'function') {
      // @ts-ignore
      return this.errorMap[DEFAULT_ERROR_MAP_KEY](error, rerun);
    }
  }
}
