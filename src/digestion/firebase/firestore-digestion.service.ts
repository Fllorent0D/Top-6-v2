import {Service} from "typedi";
import {DigestingServiceContract} from "../digesting-service-contract";
import {FirebaseService} from "./firebase.service";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {firestore} from "firebase-admin";
import {PlayersPointsProcessingService} from "../../processing/top/1-players-points/players-points-processing-service";
import {LevelAttributionService} from "../../processing/top/2-level-attribution/level-attribution-service";
import CollectionReference = firestore.CollectionReference;
import {PlayerPosition} from "../../processing/top/4-consolidate-tops/consolidate-top-model";

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
    this.loggingService.info('Saving to firebase...', 1);
    await this.updateTops();
    await this.updateDetails();
  }

  private async updateTops() {
    const topsCollection: CollectionReference = this.firebaseService.firestore.collection('/tops');
    for (const region of this.configurationService.allRegions) {
      this.loggingService.info(region, 2);
      const regionDoc = topsCollection.doc(region);
      await regionDoc.set({
        clubs: this.configurationService.getAllClubsForRegion(region)
      })
      for (const level of this.configurationService.allLevels) {
        const levelCollection = regionDoc.collection(level);
        const docs = await levelCollection.listDocuments();
        const results = this.consolidateTopService.getTopForRegionAndLevel(region, level, 25)
        await Promise.allSettled(docs.map((doc) => doc.delete()));
        await Promise.allSettled(results.map((playerPos: PlayerPosition, index: number) => levelCollection.add({...playerPos, position: index})));
        this.uniqueIndexesInTops.push(...results.map(pos => pos.uniqueIndex));
        this.loggingService.info(level + ' ✅', 3);
      }
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
