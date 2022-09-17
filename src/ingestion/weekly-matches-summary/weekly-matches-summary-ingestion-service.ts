import {IngestionServiceContract} from "../ingestion-service-contract";
import {WeeklyMatchesSummaryIngestionModel} from "./weekly-matches-summary-ingestion-model";
import {Inject, Service} from "typedi";
import {LoggingService, MatchesApi, TeamMatchesEntry} from "../../common";
import {ConfigurationService} from "../../configuration/configuration.service";
import {format, sub} from "date-fns";
import {uniqBy} from "lodash";

@Service()
export class WeeklyMatchesSummaryIngestionService implements IngestionServiceContract<WeeklyMatchesSummaryIngestionModel> {
  private _model: WeeklyMatchesSummaryIngestionModel;

  constructor(
    private readonly config: ConfigurationService,
    private readonly logging: LoggingService,
    @Inject('matches.api') private readonly matchesApi: MatchesApi,
    @Inject('randomip') private readonly randomIp: () => string
  ) {
  }

  async ingest(): Promise<void> {
    this._model = {
      from: sub(new Date('2022-01-15'), {weeks: 1}),
      to: new Date('2022-01-30'),
      matches: {}
    };
    this.logging.info(`Fetching matches for all divisions for weekly summary (${format(this._model.from, 'dd/MM')} - ${format(this._model.to, 'dd/MM')})`, 1);

    const regions = this.config.allRegions;
    let total = 0;
    for (const region of regions) {
      this.logging.info(`Fetching for ${region}`, 2);
      const clubs = this.config.getAllClubsForRegion(region);
      for (const club of clubs) {
        const {data: matches} = await this.matchesApi.findAllMatches({
          club,
          withDetails: true,
          yearDateFrom: format(this._model.from, 'yyyy-MM-dd'),
          yearDateTo: format(this._model.to, 'yyyy-MM-dd'),
          showDivisionName: 'yes'
        }, {
          headers: {
            'x-forwarded-for': this.randomIp()
          }
        });
        if(matches.length){
          const nonByeMatches = matches.filter((match: TeamMatchesEntry) => !(match.HomeTeam.includes('Bye') || match.AwayTeam.includes('Bye')));
          this._model.matches[region] = uniqBy([
            ...(this._model.matches[region] ?? []),
            ...nonByeMatches
          ], 'MatchId');
          total += nonByeMatches.length;
        }
        this.logging.trace(`${matches.length > 0 ? '✅ ' : '⛔️'} ${club} - ${matches.length} matches`, 3);
      }
    }
    this.logging.trace(`---`, 2);
    this.logging.trace(`Ingested ${total} matches`, 2);
  }

  get model(): WeeklyMatchesSummaryIngestionModel {
    return this._model;
  }

}
