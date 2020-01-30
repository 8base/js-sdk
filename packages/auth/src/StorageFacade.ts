import { IStorage } from './types';

export class StorageFacade<T extends {}> {
  private readonly storage: IStorage;
  private readonly storageKey: string;

  constructor(storage: IStorage, storageKey: string, initialState?: T) {
    this.storage = storage;
    this.storageKey = storageKey;

    if (!!initialState) {
      this.setState(initialState);
    }
  }

  public getState(): T | {} {
    const stateJSON = this.storage.getItem(this.storageKey);

    return JSON.parse(stateJSON || '{}') || {};
  }

  public setState(newState: T): void {
    const currentState = this.getState();
    const mergedState = {
      ...currentState,
      ...newState,
    };

    this.storage.setItem(this.storageKey, JSON.stringify(mergedState));
  }

  public purgeState(): void {
    this.storage.removeItem(this.storageKey);
  }
}
