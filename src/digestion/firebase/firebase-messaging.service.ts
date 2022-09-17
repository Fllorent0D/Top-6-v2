import {FirebaseService} from "./firebase.service";
import {LoggingService} from "../../common";
import {ConfigurationService} from "../../configuration/configuration.service";
import {Service} from "typedi";
import {DigestingServiceContract} from "../digesting-service-contract";

@Service()
export class FirebaseMessagingService implements DigestingServiceContract {

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly configuration: ConfigurationService,
    private readonly loggingService: LoggingService
  ) {
  }


  async digest(): Promise<void> {
    this.loggingService.info('Sending push notifications...', 1);
    const message = await this.firebaseService.messaging.send({
      topic: 'all',
      notification: {
        body: 'Semaine n°' + this.configuration.runtimeConfiguration.weekName,
        title: 'Top 6 mis à jour!'
      }
    });
    this.loggingService.info('Sent - ' + message, 2);

  }

}
