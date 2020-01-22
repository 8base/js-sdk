import { IHandlerFunction } from './types';

export class ChainHandler<T> {
  public static fromArray<T>(
    handlerFunctions: Array<IHandlerFunction<T>> = [],
  ): ChainHandler<T> {
    if (handlerFunctions.length === 0) {
      return new ChainHandler((next, data) => next(data));
    }

    const handlers = handlerFunctions.map<ChainHandler<T>>(
      handlerFunction => new ChainHandler(handlerFunction),
    );

    return handlers.reduceRight((nextHandler, handler) => {
      handler.setNext(nextHandler);

      return handler;
    });
  }

  private readonly handlerFunction: IHandlerFunction<T>;
  private next?: ChainHandler<T>;

  constructor(handlerFunction: IHandlerFunction<T>) {
    this.handlerFunction = handlerFunction;
  }

  public async handle(data: any): Promise<T> {
    return this.handlerFunction(data => {
      if (this.next) {
        return this.next.handle(data);
      }

      return Promise.resolve(data);
    }, data);
  }

  public setNext(handler: ChainHandler<T> | IHandlerFunction<T>) {
    if (typeof handler === 'function') {
      handler = new ChainHandler<T>(handler);
    }

    this.next = handler;
  }
}
