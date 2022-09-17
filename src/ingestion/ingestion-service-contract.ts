export interface IngestionServiceContract<T> {
  ingest(): Promise<void>;

  get model(): T;
}
