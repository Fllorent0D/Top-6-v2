import {createMock} from "ts-auto-mock";
import {LoggingService} from "../../../common";
import {LevelAttributionService} from "./level-attribution-service";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {PlayersPointsProcessingModel} from "../1-players-points/players-points-processing-model";
import {TOP_LEVEL} from "../../../configuration/configuration.model";

describe('LevelAttributionService', () => {
  describe('process', () => {
    it('should compute the most player top level and set in model', async () => {
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
                  level: TOP_LEVEL.NAT_WB,
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P1,
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P1,
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P2,
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                }
              ]

            }
          }
        }
      });

      const service = new LevelAttributionService(loggerMock, playersPointsProcessingServiceMock);
      await service.process();

      const result = service.model;
      expect(result[142453]).toBe(TOP_LEVEL.P1);

    })
    it('should compute lowest level if same number of participation', async () => {
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
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P1,
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P2,
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                },
                {
                  divisionId: 12,
                  weekName: 1,
                  level: TOP_LEVEL.P2,
                  victoryCount: 4,
                  forfeit: 0,
                  pointsWon: 5,
                  matchId: '123',
                  matchUniqueId: 1234,
                }
              ]

            }
          }
        }
      });

      const service = new LevelAttributionService(loggerMock, playersPointsProcessingServiceMock);
      await service.process();

      const result = service.model;
      expect(result[142453]).toBe(TOP_LEVEL.P2);

    })
  });
})
