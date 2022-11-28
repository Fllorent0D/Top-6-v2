import {Service} from "typedi";
import {DigestingServiceContract} from "../digesting-service-contract";
import {FirebaseService} from "./firebase.service";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {firestore} from "firebase-admin";
import {PlayersPointsProcessingService} from "../../processing/top/1-players-points/players-points-processing-service";
import {LevelAttributionService} from "../../processing/top/2-level-attribution/level-attribution-service";
import {PlayerPosition} from "../../processing/top/4-consolidate-tops/consolidate-top-model";
import {TOP_LEVEL} from "../../configuration/configuration.model";
import CollectionReference = firestore.CollectionReference;

@Service()
export class FirestoreDigestionService implements DigestingServiceContract {

  uniqueIndexesInTops = [];

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttributionService: LevelAttributionService,
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService
  ) {
  }

  async digest(): Promise<void> {
    this.loggingService.info('Saving to firebase...');
    await this.updateTops();
    await this.updateDetails();
  }

  private async updateTops() {
    const topsCollection: CollectionReference = this.firebaseService.firestore.collection('/tops');
    for (const region of this.configurationService.allRegions) {
      const regionDoc = topsCollection.doc(region);

      const levels: {[index: string]: PlayerPosition[]} = this.configurationService.allLevels.reduce((acc, level: TOP_LEVEL) => {
        const results: PlayerPosition[] = this.consolidateTopService
          .getTopForRegionAndLevel(region, level, 13)
          .map((playerPosition: PlayerPosition, index: number) => ({...playerPosition, position: index}));
        return {...acc, [level]: results};
      }, {});
      const clubs = this.configurationService.getAllClubsForRegion(region);

      await regionDoc.set({clubs, levels});
      this.loggingService.info('✅ ' + region);
    }
  }

  private async updateDetails() {
    for (const uniqueIndex of this.uniqueIndexesInTops) {
      const playerPoints = this.playersPointsProcessingService.model[uniqueIndex]
      playerPoints.points.sort((a, b) => b.weekName - a.weekName);
      const level = this.levelAttributionService.model[uniqueIndex];
      const playerPointsCollection = this.firebaseService.firestore.collection('/players-points-details');
      await playerPointsCollection.doc(uniqueIndex).set({
        ...playerPoints,
        levelAttributed: level
      })
    }
  }
}
