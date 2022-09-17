export interface DigestingServiceContract {
  digest(): Promise<void>;
}
