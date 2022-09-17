import {TOP_LEVEL, TOP_REGIONS} from "../../../configuration/configuration.model";
import {PlayerTotalPoints} from "../3-sum-points/sum-points-model";

export type ConsolidateTopModel = {
  [index in TOP_REGIONS]?: {
    [index in TOP_LEVEL]?: PlayerPosition[]
  };
};

export interface PlayerPosition {
  uniqueIndex: string;
  clubIndex: string;
  clubName: string;
  name: string;
  points: PlayerTotalPoints;

}
