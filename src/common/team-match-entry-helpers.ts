import {Service} from "typedi";
import {TeamMatchesEntry} from "./tabt-client";

@Service()
export class TeamMatchEntryHelpers {
  isBye(match: TeamMatchesEntry): boolean {
    return (match.HomeClub === '-' && match.HomeTeam.indexOf('Bye') > -1) || (match.AwayClub === '-' && match.AwayTeam.indexOf('Bye') > -1);
  };
}
