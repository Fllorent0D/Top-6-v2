import * as path from "path";
import {Service} from "typedi";
import {FileSystemHelper, LoggingService} from "../common";
import {configurationConst} from "./configuration.const";
import {Configuration, DivisionsPerCategory, Email, TOP_LEVEL, TOP_REGIONS} from "./configuration.model";
import {formatISO9075} from "date-fns";
import {CommandConfigurationService} from "./command-configuration.service";
import {ServiceAccount} from "firebase-admin";
import * as fs from "fs";

@Service()
export class ConfigurationService {

  private readonly _configuration: Configuration;
  readonly dateStart = new Date();

  constructor(
    private readonly _loggingService: LoggingService,
    private readonly _fileSystemHelper: FileSystemHelper,
    private readonly commandConfiguration: CommandConfigurationService,
    config: Configuration | undefined) {
    this._configuration = config ?? configurationConst;
  }

  async init(): Promise<void> {
    this._loggingService.info(this._loggingService.getLayerInfo('CONFIGURATION'));

    this.commandConfiguration.init();
    if (this.runtimeConfiguration.postToFacebook) {
      await this.loadFacebookAPIKey();
    }
    if (this.runtimeConfiguration.uploadToFirebase) {
      await this.loadGoogleServiceAccountCredentials();
    }
    await this.logConfigAsync();
    await this.initFileSystemAsync();
  }

  private async logConfigAsync(): Promise<void> {
    this._loggingService.debug(`GLOBAL CONFIGURATION`);
    this._loggingService.trace(`TabT API: ${this._configuration.tabtBaseApi}`);
    this._loggingService.debug(`RUNTIME CONFIGURATION`);
    this._loggingService.trace(`weekName: ${this.commandConfiguration.weekName}`);
    this._loggingService.trace(`weeklySummary: ${this.commandConfiguration.weeklySummary}`);
    this._loggingService.trace(`postToFacebook: ${this.commandConfiguration.postToFacebook}`);
    this._loggingService.trace(`sendViaEmail: ${this.commandConfiguration.sendViaEmail}`);
    this._loggingService.trace(`emails: ${this.emailsRecipients}`);
    this._loggingService.trace(`uploadToFirebase: ${this.commandConfiguration.uploadToFirebase}`);

    this._loggingService.debug(`TOP 6 CONFIGURATION`);

    this._loggingService.debug(`CLUBS`);
    for (const region of Object.values(TOP_REGIONS)) {
      this._loggingService.trace(`- ${region}: ${this.getAllClubsForRegion(region).join(', ')}`);
    }

    this._loggingService.debug(`DIVISIONS`);
    for (const [category, divisions] of Object.entries(this.divisionsPerCategory)) {
      this._loggingService.trace(`- ${category}: ${divisions.join(', ')}`);
    }

  }

  private async initFileSystemAsync(): Promise<void> {
    this._loggingService.info(this._loggingService.getLayerInfo('🏗 FILE SYSTEM INITIALIZATION'));

    this._fileSystemHelper.createFolderIfNotExist(this.absolutePathOutput);
    this._fileSystemHelper.createFolderIfNotExist(this.absolutePathOutputToday);
  }

  getAllClubsForRegion(top: TOP_REGIONS): string[] {
    return this._configuration.top6.clubsPerTop[top];
  }

  get allClubsUniqueIndex(): string[] {
    return Object.values(TOP_REGIONS)
      .map((t) => this.getAllClubsForRegion(t))
      .flat(1);
  }

  clubIsInConfig(clubIndex: string): boolean {
    return this.allClubsUniqueIndex.includes(clubIndex);
  }

  get allRegions(): TOP_REGIONS[] {
    return Object.values(TOP_REGIONS);
  }

  get allLevels(): TOP_LEVEL[] {
    return Object.values(TOP_LEVEL);
  }

  get divisionsPerCategory(): DivisionsPerCategory {
    return this._configuration.top6.divisionsByLevel
  }

  get allDivisions(): number[] {
    return Object.values(this._configuration.top6.divisionsByLevel).flat();
  }

  get absolutePathOutput(): string {
    return path.join(process.cwd(), this._configuration.output);
  }

  get absolutePathOutputToday(): string {
    return path.join(this.absolutePathOutput, formatISO9075(this.dateStart, {format: 'basic'}))
  }

  getAbsolutePathTechniqueTxtFileName(region: TOP_REGIONS): string {
    return `${this.absolutePathOutputToday}/technique_${region.toLowerCase()}.txt`;
  }

  get absolutePathTechniqueDebugFileName(): string {
    return `${this.absolutePathOutputToday}/technique_debug.json`;
  }

  get absolutePathPlayerPointsFileName(): string {
    return `${this.absolutePathOutputToday}/points_debug.json`;
  }

  get absolutePathLevelAttributionFileName(): string {
    return `${this.absolutePathOutputToday}/level_attribution_debug.json`;
  }

  get absolutePathPointsToCountFileName(): string {
    return `${this.absolutePathOutputToday}/points_to_count_debug.json`;
  }

  get absolutePathConsolidateTopDebugFileName(): string {
    return `${this.absolutePathOutputToday}/tops_debug.json`;
  }

  get absolutePathDivisionsMatchesDebugFileName(): string {
    return `${this.absolutePathOutputToday}/divisions_matches.json`;
  }

  absolutePathConsolidatedTopExcelFileName(region: TOP_REGIONS): string {
    return `${this.absolutePathOutputToday}/tops_${region}.xlsx`;
  }

  absolutePathConsolidatedTopCompleteExcelFileName(region: TOP_REGIONS): string {
    return `${this.absolutePathOutputToday}/tops_complete_${region}.xlsx`;
  }

  getLevelForDivision(divisionId: number): TOP_LEVEL {
    const category = Object.entries(this._configuration.top6.divisionsByLevel)
      .find(([, divisions]: [TOP_LEVEL, number[]]) => divisions.includes(divisionId));
    return category?.[0] as TOP_LEVEL;
  }

  get runtimeConfiguration() {
    return this.commandConfiguration
  }

  get emailConfig(): Email {
    return this._configuration.email;
  }

  get facebookConfig() {
    return this._configuration.facebook;
  }

  get firebaseConfig(): ServiceAccount {
    // TODO: move to env?
    return this._configuration.firebase;
  }

  get emailsRecipients(): string[] {
    return this.runtimeConfiguration.emails.length > 0 ?
      this.runtimeConfiguration.emails :
      this.emailConfig.recipients
  }

  private async loadGoogleServiceAccountCredentials() {
    this._loggingService.debug('GOOGLE SERVICE ACCOUNT')
    const pathToFile = this.runtimeConfiguration.googleCredentialsJSONPath;
    if (!pathToFile) {
      this._loggingService.error('Google service account information not found!');
      this._loggingService.trace('Disabling upload to firebase');
      this.runtimeConfiguration.uploadToFirebase = false;
      return;
    }
    this._loggingService.trace('Loading from ' + pathToFile);
    try {
      const apiKeys = fs.readFileSync(pathToFile, 'utf8');
      this._configuration.firebase = JSON.parse(apiKeys);
    } catch (e) {
      this._loggingService.error('Error when loading Google Service Account!');
      this.runtimeConfiguration.uploadToFirebase = false;
    }
  }

  private async loadFacebookAPIKey() {
    this._loggingService.debug('FACEBOOK CREDENTIALS')
    if (!this.runtimeConfiguration.facebookPageId || !this.runtimeConfiguration.facebookPageAccessToken) {
        this._loggingService.error('Facebook credentials not found!');
        this._loggingService.trace('Disabling facebook posting');
        this.runtimeConfiguration.postToFacebook = false;
        return;
    }
    this._configuration.facebook = {
      pageId: this.runtimeConfiguration.facebookPageId,
      apiKey: this.runtimeConfiguration.facebookPageAccessToken
    }
    this._loggingService.trace('Facebook API key loaded from cmd line');

  }
}
