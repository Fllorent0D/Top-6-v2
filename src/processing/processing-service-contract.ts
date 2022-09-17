export interface ProcessingServiceContract<T> {
  process(): Promise<void>;

  get model(): T;
}
