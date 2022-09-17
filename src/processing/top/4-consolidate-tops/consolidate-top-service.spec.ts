import {createMock} from "ts-auto-mock";
import {ClubEntry, LoggingService} from "../../../common";
import {ConfigurationService} from "../../../configuration/configuration.service";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {PlayersPointsProcessingModel} from "../1-players-points/players-points-processing-model";
import {TOP_LEVEL} from "../../../configuration/configuration.model";
import {SumPointsService} from "../3-sum-points/sum-points-service";
import {PlayersTotalPoints} from "../3-sum-points/sum-points-model";
import {LevelAttributionService} from "../2-level-attribution/level-attribution-service";
import {PlayersLevelAttribution} from "../2-level-attribution/level-attribution-model";
import {ClubsIngestionService} from "../../../ingestion/clubs/clubs-ingestion-service";
import {ConsolidateTopService} from "./consolidate-top-service";

describe('ConsolidateTopService', () => {
  describe('process',  () => {
    it('should process top correctly and ouput a ranking per division and region', async () => {
      const loggerMock = createMock<LoggingService>();
      const configMock = createMock<ConfigurationService>({
        getAllClubsForRegion: jest.fn()
          .mockReturnValueOnce(["club a", "club b"])
          .mockReturnValueOnce(["club c", "club d"])
          .mockReturnValueOnce(["club e", "club f"])
      })
      const clubIngestionMock = createMock<ClubsIngestionService>({
        getClubWithUniqueIndex: (uniqueIndex: string) => {
          switch (uniqueIndex) {
            case 'club a':
              return {
                LongName: 'Club A'
              } as ClubEntry
            case 'club b':
              return {
                LongName: 'Club B'
              } as ClubEntry
            case 'club C':
              return {
                LongName: 'Club C'
              } as ClubEntry
            case 'club D':
              return {
                LongName: 'Club D'
              } as ClubEntry
          }
          return {
            LongName: 'sth else'
          } as ClubEntry
        }
      })
      const playersPointsProcessingServiceMock = createMock<PlayersPointsProcessingService>({
        get model(): PlayersPointsProcessingModel {
          return {
            "111": {
              "name": "Florent",
              "club": "club a",
              "points": [
                {
                  "divisionId": 5354,
                  "weekName": 1,
                  "victoryCount": 4,
                  "forfeit": 0,
                  "matchId": "RM01/043",
                  "matchUniqueId": 475440,
                  "level": TOP_LEVEL.NAT_WB,
                  "pointsWon": 5
                },
                {
                  "divisionId": 5354,
                  "weekName": 2,
                  "victoryCount": 1,
                  "forfeit": 0,
                  "matchId": "RM02/045",
                  "matchUniqueId": 478547,
                  "level": TOP_LEVEL.NAT_WB,
                  "pointsWon": 1
                },
              ]
            },
            "222": {
              "name": "Pauline",
              "club": "club b",
              "points": [
                {
                  "divisionId": 5354,
                  "weekName": 1,
                  "victoryCount": 0,
                  "forfeit": 2,
                  "matchId": "RM01/043",
                  "matchUniqueId": 475440,
                  "level": TOP_LEVEL.NAT_WB,
                  "pointsWon": 2
                },
                {
                  "divisionId": 5354,
                  "weekName": 2,
                  "victoryCount": 1,
                  "forfeit": 0,
                  "matchId": "RM02/045",
                  "matchUniqueId": 478547,
                  "level": TOP_LEVEL.NAT_WB,
                  "pointsWon": 1
                },
              ]
            },
            "333": {
              "name": "Shana",
              "club": "club c",
              "points": [
                {
                  "divisionId": 5354,
                  "weekName": 1,
                  "victoryCount": 3,
                  "forfeit": 0,
                  "matchId": "RM01/043",
                  "matchUniqueId": 475440,
                  "level": TOP_LEVEL.P2,
                  "pointsWon": 3
                },
                {
                  "divisionId": 5354,
                  "weekName": 2,
                  "victoryCount": 0,
                  "forfeit": 0,
                  "matchId": "RM02/045",
                  "matchUniqueId": 478547,
                  "level": TOP_LEVEL.P2,
                  "pointsWon": 0
                },
              ]
            },
            "444": {
              "name": "Eric",
              "club": "club d",
              "points": [
                {
                  "divisionId": 5354,
                  "weekName": 1,
                  "victoryCount": 3,
                  "forfeit": 1,
                  "matchId": "RM01/043",
                  "matchUniqueId": 475440,
                  "level": TOP_LEVEL.P2,
                  "pointsWon": 5
                },
                {
                  "divisionId": 5354,
                  "weekName": 2,
                  "victoryCount": 1,
                  "forfeit": 2,
                  "matchId": "RM02/045",
                  "matchUniqueId": 478547,
                  "level": TOP_LEVEL.P2,
                  "pointsWon": 3
                },
              ]
            },
          }
        }
      })
      const sumPointsServiceMock = createMock<SumPointsService>({
        get model(): PlayersTotalPoints {
          return {
            '111': {
              "total": 6,
              "count1Pts": 1,
              "count2Pts": 0,
              "count3Pts": 0,
              "count5Pts": 1,
              "count0Pts": 0
            },
            '222': {
              "total": 3,
              "count1Pts": 1,
              "count2Pts": 1,
              "count3Pts": 0,
              "count5Pts": 0,
              "count0Pts": 0
            },
            '333': {
              "total": 3,
              "count1Pts": 0,
              "count2Pts": 0,
              "count3Pts": 1,
              "count5Pts": 0,
              "count0Pts": 1
            },
            '444': {
              "total": 8,
              "count1Pts": 0,
              "count2Pts": 0,
              "count3Pts": 1,
              "count5Pts": 1,
              "count0Pts": 0
            },
          }
        }
      });
      const levelAttributionServiceMock = createMock<LevelAttributionService>({
        get model(): PlayersLevelAttribution {
          return {
            '111': TOP_LEVEL.NAT_WB,
            '222': TOP_LEVEL.NAT_WB,
            '333': TOP_LEVEL.P2,
            '444': TOP_LEVEL.P2
          }
        }


      })

      const service = new ConsolidateTopService(
        loggerMock,
        configMock,
        playersPointsProcessingServiceMock,
        sumPointsServiceMock,
        levelAttributionServiceMock,
        clubIngestionMock
      )
      await service.process()
      const result = service.model;
      console.log(result)
      expect(result.HUY_WAREMME.NAT_WB.length).toEqual(2);
      expect(result.HUY_WAREMME.NAT_WB[0].uniqueIndex).toEqual("111");
      expect(result.HUY_WAREMME.NAT_WB[0].clubName).toEqual("Club A");
      expect(result.HUY_WAREMME.NAT_WB[0].name).toEqual("Florent");
      expect(result.HUY_WAREMME.NAT_WB[1].uniqueIndex).toEqual("222");
      expect(result.HUY_WAREMME.NAT_WB[1].clubName).toEqual("Club B");
      expect(result.HUY_WAREMME.NAT_WB[1].name).toEqual("Pauline");

      expect(result.HUY_WAREMME["Provincial 2"].length).toEqual(0);
      expect(result.LIEGE["Provincial 2"].length).toEqual(2);
      expect(result.LIEGE.NAT_WB.length).toEqual(0);


    });
  });

})
