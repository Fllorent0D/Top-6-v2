import {createMock} from "ts-auto-mock";
import {LoggingService} from "../common";
import {ClubsIngestionService} from "./clubs/clubs-ingestion-service";
import {DivisionsIngestionService} from "./divisions/divisions-ingestion-service";
import {DivisionsMatchesIngestionService} from "./divisions-matches/divisions-matches-ingestion-service";
import {WeeklyMatchesSummaryIngestionService} from "./weekly-matches-summary/weekly-matches-summary-ingestion-service";
import {ConfigurationService} from "../configuration/configuration.service";
import {IngestionService} from "./ingestion-service";

describe('IngestionService', () => {
  let clubsIngestionMock, divisionsIngestionServiceMock, divisionsMatchesIngestionServiceMock,
    weeklyMatchesSummaryIngestionServiceMock, configurationServiceMock, loggerMock, service;

  beforeEach(() => {
    clubsIngestionMock = createMock<ClubsIngestionService>()
    divisionsIngestionServiceMock = createMock<DivisionsIngestionService>()
    divisionsMatchesIngestionServiceMock = createMock<DivisionsMatchesIngestionService>()
    weeklyMatchesSummaryIngestionServiceMock = createMock<WeeklyMatchesSummaryIngestionService>()
    configurationServiceMock = createMock<ConfigurationService>({
      get runtimeConfiguration() {
        return {weeklySummary: true};
      }
    })
    loggerMock = createMock<LoggingService>();

    service = new IngestionService(
      clubsIngestionMock,
      divisionsIngestionServiceMock,
      divisionsMatchesIngestionServiceMock,
      weeklyMatchesSummaryIngestionServiceMock,
      configurationServiceMock,
      loggerMock
    );
  })

  it('should call all the necessary services for ingestion', async () => {
    await service.ingest();

    expect(clubsIngestionMock.ingest).toHaveBeenCalledTimes(1)
    expect(divisionsMatchesIngestionServiceMock.ingest).toHaveBeenCalledTimes(1)
    expect(divisionsIngestionServiceMock.ingest).toHaveBeenCalledTimes(1)
    expect(weeklyMatchesSummaryIngestionServiceMock.ingest).toHaveBeenCalledTimes(1)
  });

  it('should not ingestion weekly matches is not required', async () => {
    configurationServiceMock.runtimeConfiguration = {weeklySummary: false};

    await service.ingest();

    expect(weeklyMatchesSummaryIngestionServiceMock.ingest).toHaveBeenCalledTimes(0);
  })
})
