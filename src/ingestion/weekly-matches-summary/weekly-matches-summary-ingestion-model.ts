import {TeamMatchesEntry} from "../../common";
import {TOP_REGIONS} from "../../configuration/configuration.model";

export interface WeeklyMatchesSummaryIngestionModel {
  matches: {
    [x in TOP_REGIONS]?: TeamMatchesEntry[]
  }
  from: Date;
  to: Date;
}
