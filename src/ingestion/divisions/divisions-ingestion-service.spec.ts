import {DivisionsApi, LoggingService} from "../../common";

import {createMock} from "ts-auto-mock";
import {method, On} from "ts-auto-mock/extension";
import {DivisionsIngestionService} from "./divisions-ingestion-service";

describe('DivisionsIngestionService', () => {
  describe('ingest', () => {
    it('should ingest all divisions from config', async () => {
      const divisionsApiMock = createMock<DivisionsApi>();
      const findallDivisionsSpy = On(divisionsApiMock).get(method(m => m.findAllDivisions)) as jest.Mock;
      findallDivisionsSpy.mockResolvedValue({
        data: [
          {
            "DivisionId": 1,
            "DivisionName": "SUPER HEREN",
            "DivisionCategory": "MEN",
            "Level": "SUPER_DIVISION",
            "MatchType": 8
          },
          {
            "DivisionId": 2,
            "DivisionName": "SUPER WOMAN",
            "DivisionCategory": "MEN",
            "Level": "SUPER_DIVISION",
            "MatchType": 8
          },
          {
            "DivisionId": 3,
            "DivisionName": "SUPER Young",
            "DivisionCategory": "MEN",
            "Level": "SUPER_DIVISION",
            "MatchType": 8
          },

        ]
      })
      const loggerMock = createMock<LoggingService>();
      const divisionsIngestionService = new DivisionsIngestionService(
        loggerMock,
        divisionsApiMock
      )

      await divisionsIngestionService.ingest();

      expect(divisionsIngestionService).toBeDefined();
      expect(divisionsIngestionService.model.divisions.length).toEqual(3);
      expect(findallDivisionsSpy).toHaveBeenCalledTimes(1);
    })
  });
})
