import 'reflect-metadata';

import * as dotenv from 'dotenv';
import randomIP from 'random-ipv4';

import {Container} from "typedi";
import {IngestionService} from "./ingestion/ingestion-service";
import {ConfigurationService} from "./configuration/configuration.service";
import {ProcessingService} from "./processing/processing-service";
import {DigestingService} from "./digestion/digesting-service";
import {ClubsApi, DivisionsApi, MatchesApi} from "./common";
import {TabtClientConfigFactory} from "./common/tabt-client-config-factory";

dotenv.config();

const run = async () => {
  Container.set([
    {id: 'clubs.api', factory: () => new ClubsApi(TabtClientConfigFactory.createConfiguration())},
    {id: 'matches.api', factory: () => new MatchesApi(TabtClientConfigFactory.createConfiguration())},
    {id: 'divisions.api', factory: () => new DivisionsApi(TabtClientConfigFactory.createConfiguration())},
    {id: 'randomip', value: randomIP}
  ])


  await Container.get(ConfigurationService).init();
  await Container.get(IngestionService).ingest();
  await Container.get(ProcessingService).process();
  await Container.get(DigestingService).digest();
}
run();



