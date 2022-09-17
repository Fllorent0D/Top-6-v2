import {TeamMatchesEntry} from "../../../common";
import {WoHelpers} from "./wo-helpers";
import {PartialDeep} from "ts-auto-mock/partial/partial";

describe('WoHelpers', () => {
  describe('checkIfAllIndividualMatchesAreWO', () => {
    it('should return false for a complete results', () => {
      const allIndividualMatchesWO = {
        "MatchDetails": {
          "IndividualMatchResults": [
            {
              "Position": 1,
              "IsAwayForfeited": false,
              "IsHomeForfeited": false,
              "HomeSetCount": 3,
              "AwaySetCount": 1,
              "Scores": ""
            },
            {
              "Position": 2,
              "IsAwayForfeited": false,
              "IsHomeForfeited": false,
              "HomeSetCount": 3,
              "AwaySetCount": 1,
              "Scores": ""
            },
            {
              "Position": 3,
              "IsAwayForfeited": false,
              "IsHomeForfeited": false,
              "HomeSetCount": 3,
              "AwaySetCount": 1,
              "Scores": ""
            },
          ],
          "MatchSystem": 0,
          "HomeScore": 0,
          "AwayScore": 0,
          "CommentCount": 0,
        },
        "DivisionId": 0,
        "IsAwayForfeited": false,
        "IsHomeForfeited": false,
        "IsHomeWithdrawn": false,
        "IsAwayWithdrawn": false,
        "IsValidated": true,
        "IsLocked": true
      };
      const result = WoHelpers.checkIfAllIndividualMatchesAreWO(allIndividualMatchesWO as TeamMatchesEntry);
      expect(result).toEqual(false);
    })
    it('should return true if both teams are not marked as forfetia dn all individual matches are missing some match properties', () => {
      // TODO Find example of this
      const allIndividualMatchesWO = {
        "MatchDetails": {
          "IndividualMatchResults": [
            {
              "Position": 1,
              "Scores": "",
            },
            {
              "Position": 2,
              "Scores": ""
            },
            {
              "Position": 3,
              "Scores": ""
            },
          ],
          "MatchSystem": 0,
          "HomeScore": 0,
          "AwayScore": 0,
          "CommentCount": 0,
        },
        "DivisionId": 0,
        "IsAwayForfeited": false,
        "IsHomeForfeited": false,
        "IsHomeWithdrawn": false,
        "IsAwayWithdrawn": false,
        "IsValidated": true,
        "IsLocked": true
      };
      const result = WoHelpers.checkIfAllIndividualMatchesAreWO(allIndividualMatchesWO as TeamMatchesEntry);
      expect(result).toEqual(true);
    })
  });
  describe('checkIfAllPlayersAreWO', () => {
    it('should return true if all players are WO', () => {
      const allPlayersWO: PartialDeep<TeamMatchesEntry> = {
        "MatchDetails": {
          "HomePlayers":{
            "Players": [{
              "Position": 0,
              "UniqueIndex": 0,
              "FirstName": "",
              "LastName": "",
              "Ranking": "",
              "VictoryCount": 0,
              "IsForfeited": true
            },{
              "Position": 1,
              "UniqueIndex": 1,
              "FirstName": "",
              "LastName": "",
              "Ranking": "",
              "VictoryCount": 0,
              "IsForfeited": true
            }]
          }
        },
        "DivisionId": 0,
        "IsAwayForfeited": false,
        "IsHomeForfeited": false,
        "IsHomeWithdrawn": false,
        "IsAwayWithdrawn": false,
        "IsValidated": true,
        "IsLocked": true
      };
      const result = WoHelpers.checkIfAllPlayersAreWO(allPlayersWO as TeamMatchesEntry, 'Home');
      expect(result).toEqual(false);
    })
  })
})
