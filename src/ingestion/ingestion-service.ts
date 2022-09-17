import {Service} from "typedi";
import {ClubsIngestionService} from "./clubs/clubs-ingestion-service";
import {LoggingService} from "../common";
import {DivisionsMatchesIngestionService} from "./divisions-matches/divisions-matches-ingestion-service";
import {DivisionsIngestionService} from "./divisions/divisions-ingestion-service";
import {WeeklyMatchesSummaryIngestionService} from "./weekly-matches-summary/weekly-matches-summary-ingestion-service";
import {ConfigurationService} from "../configuration/configuration.service";

@Service()
export class IngestionService {

  constructor(
    private readonly clubsIngestionService: ClubsIngestionService,
    private readonly divisionsIngestionService: DivisionsIngestionService,
    private readonly clubsMatchesIngestionService: DivisionsMatchesIngestionService,
    private readonly weeklyMatchesSummaryIngestionService: WeeklyMatchesSummaryIngestionService,
    private readonly configurationService: ConfigurationService,
    private readonly logging: LoggingService
  ) {
  }

  async ingest(): Promise<void> {
    this.logging.info(this.logging.getLayerInfo('🍔 INGESTION'));

    await this.clubsIngestionService.ingest();
    await this.clubsMatchesIngestionService.ingest();
    await this.divisionsIngestionService.ingest();
    if (this.configurationService.runtimeConfiguration.weeklySummary) {
      await this.weeklyMatchesSummaryIngestionService.ingest();
    }
  }
}
