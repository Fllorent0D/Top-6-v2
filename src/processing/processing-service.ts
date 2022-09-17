import {Service} from "typedi";
import {LoggingService} from "../common";
import {ErrorProcessingService} from "./error-processing-service/error-processing-service";
import {PlayersPointsProcessingService} from "./top/1-players-points/players-points-processing-service";
import {LevelAttributionService} from "./top/2-level-attribution/level-attribution-service";
import {SumPointsService} from "./top/3-sum-points/sum-points-service";
import {ConsolidateTopService} from "./top/4-consolidate-tops/consolidate-top-service";
import {
  WeeklyMatchesSummaryProcessingService
} from "./weekly-matches-summary/weekly-matches-summary-processing-service";
import {ConfigurationService} from "../configuration/configuration.service";

@Service()
export class ProcessingService {

  constructor(
    private readonly logging: LoggingService,
    private readonly weeklyMatchesSummaryProcessingService: WeeklyMatchesSummaryProcessingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttribution: LevelAttributionService,
    private readonly sumPointsService: SumPointsService,
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly errorProcessingService: ErrorProcessingService,
    private readonly configurationService: ConfigurationService
  ) {
  }

  async process(): Promise<void> {
    this.logging.info(this.logging.getLayerInfo('🧮 PROCESSING'));

    await this.errorProcessingService.process(); // more init, but respecting contract
    await this.playersPointsProcessingService.process();
    await this.levelAttribution.process();
    await this.sumPointsService.process();
    await this.consolidateTopService.process();

    if (this.configurationService.runtimeConfiguration.weeklySummary) {
      await this.weeklyMatchesSummaryProcessingService.process();
    }
  }
}
