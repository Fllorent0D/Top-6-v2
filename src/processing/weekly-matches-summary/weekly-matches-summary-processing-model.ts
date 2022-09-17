import {TOP_REGIONS} from "../../configuration/configuration.model";
import {DivisionEntryLevelTabt, TeamMatchesEntryDivisionCategoryTabt} from "../../common";

export enum PlayerCategory {
  MEN = 1,
  WOMEN = 2,
  VETERANS = 3,
  VETERANS_WOMEN = 4,
  YOUTH = 5,
}

export interface WeeklyMatchSummary {
  homeTeam: string;
  homeClub: string;
  awayTeam: string;
  awayClub: string;
  score: string;
  homePlayers: {
    name: string,
    individualScore: number
  }[];
  awayPlayers: {
    name: string,
    individualScore: number
  }[];
}

export interface WeeklyMatchesSummaryProcessingModel {
  matches: {
    [x in TOP_REGIONS]?: {
      [x in DivisionEntryLevelTabt]?: {
        [x in string]: {                                                        // Division name
          [x in TeamMatchesEntryDivisionCategoryTabt]?: WeeklyMatchSummary[]
        }
      }
    }
  }
  from: Date;
  to: Date;
}
