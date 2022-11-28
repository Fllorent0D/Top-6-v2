import {Service} from "typedi";
import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {ProcessingServiceContract} from "../../processing-service-contract";
import {PlayerPoint, PlayerPoints} from "../1-players-points/players-points-processing-model";
import {groupBy} from "lodash";
import {TOP_LEVEL, topLevelOrder} from "../../../configuration/configuration.model";
import {PlayersLevelAttribution} from "./level-attribution-model";

@Service()
export class LevelAttributionService implements ProcessingServiceContract<PlayersLevelAttribution> {

  private _model: PlayersLevelAttribution;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService
  ) {
  }

  get model(): PlayersLevelAttribution {
    return this._model;
  }

  async process(): Promise<void> {
    this.loggingService.info(`Attributing levels...`);

    this._model = {}
    for (const [uniqueIndex, points] of Object.entries(this.playersPointsProcessingService.model)) {
      const mainLevel: TOP_LEVEL =
        Object.entries(groupBy((points as PlayerPoints).points, 'level'))
          .sort(([levelA, pointsA]: [TOP_LEVEL, PlayerPoint[]], [levelB, pointsB]: [TOP_LEVEL, PlayerPoint[]]) =>
            ((pointsB.length - pointsA.length) * 10) + (topLevelOrder.indexOf(levelB) - topLevelOrder.indexOf(levelA))
          )[0][0] as TOP_LEVEL;
      this._model[uniqueIndex] = mainLevel;
    }
  }


}
