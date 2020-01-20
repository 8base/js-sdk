import { ChainHandler } from '../src/ChainHandler';

describe('ChainHandler', () => {
  it('creates chain of handlers', async () => {
    const handler1 = new ChainHandler<any>((next, data) => {
      return next({
        ...data,
        handler1Prop: true,
      });
    });

    const handler2 = new ChainHandler<any>((_, data) => {
      expect(data).toHaveProperty('handler1Prop');

      return {
        ...data,
        handler2Prop: true,
      };
    });

    handler1.setNext(handler2);

    const result = await handler1.handle({});

    expect(result).toEqual({
      handler1Prop: true,
      handler2Prop: true,
    });
  });

  it("adds empty terminating handler if isn't specified", async () => {
    const handler1 = new ChainHandler<any>((next, data) => {
      return next({
        ...data,
        handler1Prop: true,
      });
    });

    const handler2 = new ChainHandler<any>((next, data) => {
      expect(next).toBeInstanceOf(Function);

      return next({
        ...data,
        handler2Prop: true,
      });
    });

    handler1.setNext(handler2);

    const result = await handler1.handle({});

    expect(result).toEqual({
      handler1Prop: true,
      handler2Prop: true,
    });
  });

  it('allows to control chain flow', async () => {
    const handler1 = new ChainHandler<any>((_, data) => {
      return {
        ...data,
        handler1Prop: true,
      };
    });

    const handler2 = new ChainHandler<any>((next, data) => {
      return next({
        ...data,
        handler2Prop: true,
      });
    });

    handler1.setNext(handler2);

    const result = await handler1.handle({});

    expect(result).toEqual({
      handler1Prop: true,
    });
  });

  it('creates chain from array of functions', async () => {
    const handler = ChainHandler.fromArray<any>([
      (next, data) => {
        expect(data).toEqual({});

        return next({
          ...data,
          handler1Prop: true,
        });
      },
      (next, data) => {
        expect(data).toEqual({
          handler1Prop: true,
        });

        return next({
          ...data,
          handler2Prop: true,
        });
      },
      (next, data) => {
        expect(data).toEqual({
          handler1Prop: true,
          handler2Prop: true,
        });

        return next({
          ...data,
          handler3Prop: true,
        });
      },
    ]);

    const result = await handler.handle({});

    expect(result).toEqual({
      handler1Prop: true,
      handler2Prop: true,
      handler3Prop: true,
    });
  });

  it('creates an empty handler from an empty array', async () => {
    const handler = ChainHandler.fromArray<any>([]);

    const result = await handler.handle({});

    expect(result).toEqual({});
  });

  it('creates a handler from an array with one function', async () => {
    const handler = ChainHandler.fromArray<any>([
      (next, data) => {
        return next({
          ...data,
          handler1Prop: true,
        });
      },
    ]);

    const result = await handler.handle({});

    expect(result).toEqual({
      handler1Prop: true,
    });
  });
});
