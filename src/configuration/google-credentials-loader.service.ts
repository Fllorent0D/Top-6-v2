import {CommandConfigurationService} from './command-configuration.service';
import fs from 'fs';
import {LoggingService} from '../common';
import {ServiceAccount} from 'firebase-admin';
import {Service} from 'typedi';

@Service()
export class GoogleCredentialsLoaderService {
  get googleCredentials(): ServiceAccount {
    return this._googleCredentials;
  }
  private _googleCredentials: ServiceAccount;

  constructor(
    private readonly commandConfigurationService: CommandConfigurationService,
    private readonly _loggingService: LoggingService,
  ) {
  }

  async init(): Promise<void> {
    this._loggingService.debug('GOOGLE SERVICE ACCOUNT')
    const pathToFile = this.commandConfigurationService.googleCredentialsJSONPath;
    if (!pathToFile) {
      this._loggingService.error('Google service account information not found!');
      process.exit(1);
    }
    this._loggingService.trace('Loading from ' + pathToFile);
    try {
      const apiKeys = fs.readFileSync(pathToFile, 'utf8');
      this._googleCredentials = JSON.parse(apiKeys);
    } catch (e) {
      this._loggingService.error('Error when loading Google Service Account!');
      process.exit(1);
    }
  }
}
