import {LoggingService, MatchesApi} from "../../common";

import {createMock} from "ts-auto-mock";
import {method, On} from "ts-auto-mock/extension";
import {ConfigurationService} from "../../configuration/configuration.service";
import {TOP_REGIONS} from "../../configuration/configuration.model";
import {WeeklyMatchesSummaryIngestionService} from "./weekly-matches-summary-ingestion-service";


describe('WeeklyMatchesSummaryIngestionService', () => {
  describe('ingest', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2022-01-08').getTime());
    })
    it('should ingest all matches for the weekly summary', async () => {
      const configMock = createMock<ConfigurationService>({
        get allRegions(): TOP_REGIONS[] {
          return [TOP_REGIONS.LIEGE]
        },
        getAllClubsForRegion() {
          return ["club a", "club b"]
        }
      })

      const matchesApiMock = createMock<MatchesApi>();
      const findAllMatchesMock = On(matchesApiMock).get(method(m => m.findAllMatches)) as jest.Mock;
      findAllMatchesMock
        .mockResolvedValueOnce({
          data: [{
            "MatchId": "12345",
            "WeekName": "01",
            "HomeTeam": "Some team",
            "AwayTeam": "Some team",
            "MatchUniqueId": 1,
            "DivisionId": 11,
            "DivisionCategory": 1,
          }]
        })
        .mockResolvedValueOnce({
          data: [{
            "MatchId": "123456",
            "WeekName": "02",
            "HomeTeam": "Some team",
            "AwayTeam": "Some team",
            "MatchUniqueId": 476973,
            "DivisionId": 22,
            "DivisionCategory": 1,
          }]
        })
      const loggerMock = createMock<LoggingService>();
      const randomIpMock = jest.fn().mockReturnValue('randomIp');

      const weeklyMatchesSummaryIngestionService = new WeeklyMatchesSummaryIngestionService(
        configMock,
        loggerMock,
        matchesApiMock,
        randomIpMock
      )

      await weeklyMatchesSummaryIngestionService.ingest();
      expect(weeklyMatchesSummaryIngestionService).toBeDefined();
      expect(findAllMatchesMock).toHaveBeenCalledTimes(2);
      expect(findAllMatchesMock).toHaveBeenNthCalledWith(1, {
        club: "club a",
        withDetails: true,
        yearDateFrom: "2022-01-08",
        yearDateTo: "2022-01-30",
        showDivisionName: 'yes'
      }, {
        headers: {
          'x-forwarded-for': 'randomIp'
        }
      });
      // expect anything might have to change
      expect(findAllMatchesMock).toHaveBeenNthCalledWith(2, {
        club: "club b",
        withDetails: true,
        yearDateFrom: "2022-01-08",
        yearDateTo: "2022-01-30",
        showDivisionName: 'yes'
      }, {
        headers: {
          'x-forwarded-for': 'randomIp'
        }
      });
      expect(weeklyMatchesSummaryIngestionService.model.matches[TOP_REGIONS.LIEGE].length).toEqual(2);

    })
    it('should no crash if no matches recevied', async () => {
      const configMock = createMock<ConfigurationService>({
        get allRegions(): TOP_REGIONS[] {
          return [TOP_REGIONS.LIEGE]
        },
        getAllClubsForRegion() {
          return ["club a", "club b"]
        }
      })

      const matchesApiMock = createMock<MatchesApi>();
      const findAllMatchesMock = On(matchesApiMock).get(method(m => m.findAllMatches)) as jest.Mock;
      findAllMatchesMock
        .mockResolvedValueOnce({
          data: []
        })
        .mockResolvedValueOnce({
          data: []
        })
      const randomIpMock = jest.fn().mockReturnValue('randomIp');
      const loggerMock = createMock<LoggingService>();
      const weeklyMatchesSummaryIngestionService = new WeeklyMatchesSummaryIngestionService(
        configMock,
        loggerMock,
        matchesApiMock,
        randomIpMock
      )

      await weeklyMatchesSummaryIngestionService.ingest();
      expect(Object.keys(weeklyMatchesSummaryIngestionService.model.matches).length).toEqual(0);

    })
  });
})
