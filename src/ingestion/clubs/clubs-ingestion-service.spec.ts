import {ConfigurationService} from "../../configuration/configuration.service";
import {ClubsApi, LoggingService} from "../../common";
import {ClubsIngestionService} from "./clubs-ingestion-service";

import {createMock} from "ts-auto-mock";
import {method, On} from "ts-auto-mock/extension";

describe('ClubsIngestionService', () => {
  describe('ingest', () => {
    it('should ingest all clubs from config', async () => {
      const configMock = createMock<ConfigurationService>({
        get allClubsUniqueIndex(): string[] {
          return ["club a", "club b", "club c"]
        }
      })
      const clubsRepoMock = createMock<ClubsApi>();
      const findAllClubsSpy = On(clubsRepoMock).get(method(m => m.findAllClubs)) as jest.Mock;
      findAllClubsSpy.mockResolvedValue({
        data: [
          {UniqueIndex: 'club a'},
          {UniqueIndex: 'club b'},
          {UniqueIndex: 'club c'},
          {UniqueIndex: 'club d'}
        ]
      })
      const loggerMock = createMock<LoggingService>();
      const clubsIngestionService = new ClubsIngestionService(
        configMock,
        loggerMock,
        clubsRepoMock
      )

      await clubsIngestionService.ingest();

      expect(clubsIngestionService).toBeDefined();
      expect(clubsIngestionService.model.clubs.length).toEqual(3);
      expect(clubsRepoMock.findAllClubs).toHaveBeenCalledTimes(1);
    })
  });
})
