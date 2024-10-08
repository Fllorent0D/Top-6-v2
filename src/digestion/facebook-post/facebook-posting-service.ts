import {DigestingServiceContract} from "../digesting-service-contract";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {Inject, Service} from "typedi";
import {toTitleCase} from "../../common/text-helper";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {AxiosInstance} from 'axios';

@Service()
export class FacebookPostingService implements DigestingServiceContract {
  constructor(
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService,
    @Inject('axios') private readonly axios: AxiosInstance,
  ) {
  }

  async digest(): Promise<void> {
    this.loggingService.info('Posting on facebook...');
    try {
      const payload = {
        content: this.generateText(),
      }

      const response = await this.axios.post('https://hook.eu2.make.com/n8urup72oejw7uljo0iuo919etdfca9e', payload)
      this.loggingService.trace('Response from make: ', response.data);
    } catch (e) {
      this.loggingService.error(e.message);
    }
  }

  getNextThursday(): Date {
    const today = new Date();
    const resultDate = new Date();
    resultDate.setDate(today.getDate() + (7 + 4 - today.getDay() - 1) % 7 + 1);
    resultDate.setHours(8, 0, 0);
    return resultDate;
  }

  generateText(): string {
    const tops = this.consolidateTopService.model[this.configurationService.runtimeConfiguration.weekName].VERVIERS;
    let text = 'Classement de la journée n°' + this.configurationService.runtimeConfiguration.weekName;
    for (const [level, playerPositions] of Object.entries(tops)) {
      text += '\n\n## Catégorie ' + level;
      for (const [index, playerPostition] of playerPositions.slice(0, 12).entries()) {
        text += `\n${index + 1}. ${toTitleCase(playerPostition.name)} - ${playerPostition.clubName} - ${playerPostition.points.total} points`
      }
      text += '\n'
    }
    return text;
  }

}
