import {createMock} from "ts-auto-mock";
import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {PlayersPointsProcessingModel} from "../1-players-points/players-points-processing-model";
import {TOP_LEVEL} from "../../../configuration/configuration.model";
import {LevelAttributionService} from "../2-level-attribution/level-attribution-service";
import {PlayersLevelAttribution} from "../2-level-attribution/level-attribution-model";
import {SumPointsService} from "./sum-points-service";

describe('SumPointsService', () => {
  describe('process', () => {
    it('should count points for the attributed level', async () => {
      const loggerMock = createMock<LoggingService>();
      const playersPointsProcessingServiceMock = createMock<PlayersPointsProcessingService>({
        get model(): PlayersPointsProcessingModel {
          return {
            142453: {
              name: 'Florent',
              club: 'Some club',
              points: [
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P1,
                  victoryCount: 1,
                  forfeit: 1,
                  pointsWon: 2,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P1,
                  victoryCount: 1,
                  forfeit: 0,
                  pointsWon: 1,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P2,
                  victoryCount: 0,
                  forfeit: 0,
                  pointsWon: 0,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P2,
                  victoryCount: 2,
                  forfeit: 2,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P5,
                  victoryCount: 1,
                  forfeit: 2,
                  pointsWon: 3,
                  matchId: '123',
                  matchUniqueId: 1234,
                }
              ]

            }
          }
        }
      });
      const levelAttributionMock = createMock<LevelAttributionService>({
        get model(): PlayersLevelAttribution {
          return {
            142453: TOP_LEVEL.P2
          }
        }
      });
      const service = new SumPointsService(loggerMock, playersPointsProcessingServiceMock, levelAttributionMock)
      await service.process();
      const result = service.model;

      expect(result).toStrictEqual({
        142453: {
          total: 8,
          count1Pts: 1,
          count2Pts: 1,
          count3Pts: 0,
          count5Pts: 1,
          count0Pts: 1
        }
      })
      expect(result[142453]).toEqual(service.getPlayerPoints("142453"))
    })
  })
})
