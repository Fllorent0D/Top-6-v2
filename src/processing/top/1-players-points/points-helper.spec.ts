import {IndividualMatchResult, Player} from "../../../common";
import {PointsHelper} from "./points-helper";

describe('PointsHelper', () => {
  let oppositePlayers: Player[], individualMatchResult: IndividualMatchResult[], playerUniqueIndex: number;
  beforeEach(() => {
    playerUniqueIndex = 1;

    oppositePlayers = [
      {
        "Position": 1,
        "UniqueIndex": 2,
        "FirstName": "",
        "LastName": "",
        "Ranking": "",
        "VictoryCount": 0,
        "IsForfeited": false
      },
      {
        "Position": 2,
        "UniqueIndex": 3,
        "FirstName": "",
        "LastName": "",
        "Ranking": "",
        "VictoryCount": 0,
        "IsForfeited": false
      },
      {
        "Position": 3,
        "UniqueIndex": 4,
        "FirstName": "",
        "LastName": "",
        "Ranking": "",
        "VictoryCount": 0,
        "IsForfeited": false
      },
      {
        "Position": 4,
        "UniqueIndex": 5,
        "FirstName": "",
        "LastName": "",
        "Ranking": "",
        "VictoryCount": 0,
        "IsForfeited": true
      }
    ];
    individualMatchResult = [
      {
        "Position": 0,
        "HomePlayerMatchIndex": [
          1
        ],
        "HomePlayerUniqueIndex": [
          1
        ],
        "AwayPlayerMatchIndex": [
          1
        ],
        "AwayPlayerUniqueIndex": [
          2
        ],
        "HomeSetCount": 0,
        "AwaySetCount": 0,
        "IsHomeForfeited": false,
        "IsAwayForfeited": false,
        "Scores": ""
      },
      {
        "Position": 0,
        "HomePlayerMatchIndex": [
          1
        ],
        "HomePlayerUniqueIndex": [
          1
        ],
        "AwayPlayerMatchIndex": [
          2
        ],
        "AwayPlayerUniqueIndex": [
          3
        ],
        "HomeSetCount": 0,
        "AwaySetCount": 0,
        "IsHomeForfeited": false,
        "IsAwayForfeited": false,
        "Scores": ""
      },
      {
        "Position": 0,
        "HomePlayerMatchIndex": [
          1
        ],
        "HomePlayerUniqueIndex": [
          1
        ],
        "AwayPlayerMatchIndex": [
          3
        ],
        "AwayPlayerUniqueIndex": [
          4
        ],
        "HomeSetCount": 0,
        "AwaySetCount": 0,
        "IsHomeForfeited": false,
        "IsAwayForfeited": false,
        "Scores": ""
      },
      {
        "Position": 0,
        "HomePlayerMatchIndex": [
          1
        ],
        "HomePlayerUniqueIndex": [
          1
        ],
        "AwayPlayerMatchIndex": [
          4
        ],
        "AwayPlayerUniqueIndex": [
          5
        ],
        "HomeSetCount": 0,
        "AwaySetCount": 0,
        "IsHomeForfeited": false,
        "IsAwayForfeited": true,
        "Scores": ""
      }
    ]
  })

  describe('countForfeitForPlayer', () => {

    it('should return the number of forfeit. More all forfeit in the Players object', () => {
      const result = PointsHelper.countForfeitForPlayer(playerUniqueIndex, individualMatchResult, oppositePlayers, 'Home');
      expect(result).toEqual(1);
    })

    it('should return the number of forfeit. More all forfeit in the IndividualMatchResult object', () => {
      oppositePlayers[3].IsForfeited = false;
      const result = PointsHelper.countForfeitForPlayer(playerUniqueIndex, individualMatchResult, oppositePlayers, 'Home');
      expect(result).toEqual(1);
    })

    // TODO: Find reason of this
    it('should not count forfeit if both players are marked as Forfeit', () => {
      oppositePlayers[3].IsForfeited = false;
      individualMatchResult[3].IsHomeForfeited = true
      const result = PointsHelper.countForfeitForPlayer(playerUniqueIndex, individualMatchResult, oppositePlayers, 'Home');
      expect(result).toEqual(0);
    })

    it('should work with opposite position', () => {
      playerUniqueIndex = 2
      individualMatchResult[0].IsHomeForfeited = true
      const result = PointsHelper.countForfeitForPlayer(playerUniqueIndex, individualMatchResult, oppositePlayers, 'Away');
      expect(result).toEqual(1);
    })
  })
  describe('countVictoriesForPlayer', () => {
    it('should count for a HomePlayer', () => {
      individualMatchResult[0].HomeSetCount = 3;
      individualMatchResult[1].HomeSetCount = 3;
      const result = PointsHelper.countVictoriesForPlayer(playerUniqueIndex, individualMatchResult, 'Home');
      expect(result).toEqual(2);
    })
    it('should count for a AwayPlayer', () => {
      // setting first match to another home player and away player wins
      individualMatchResult[0].AwaySetCount = 3;
      individualMatchResult[0].HomePlayerMatchIndex = [3];
      individualMatchResult[0].HomePlayerUniqueIndex = [10];
      // setting the same away players as first match and make it win
      individualMatchResult[1].AwayPlayerMatchIndex = individualMatchResult[0].AwayPlayerMatchIndex;
      individualMatchResult[1].AwayPlayerUniqueIndex = individualMatchResult[0].AwayPlayerUniqueIndex;
      individualMatchResult[1].AwaySetCount = 3;
      playerUniqueIndex = 2;

      const result = PointsHelper.countVictoriesForPlayer(playerUniqueIndex, individualMatchResult, 'Away');
      expect(result).toEqual(2);
    })
  })
})
