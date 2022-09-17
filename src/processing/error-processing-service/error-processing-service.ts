import {Service} from "typedi";
import {LoggingService} from "../../common";
import {ErrorProcessingModel} from "./error-processing-model";
import {ProcessingServiceContract} from "../processing-service-contract";

@Service()
export class ErrorProcessingService implements ProcessingServiceContract<ErrorProcessingModel> {

  _model: ErrorProcessingModel;

  constructor(
    private readonly loggingService: LoggingService
  ) {
  }

  async process(): Promise<void> {
    this._model = {
      errors: [],
      warnings: []
    }
  }

  error(error: string, indent = 1) {
    this.loggingService.error(error, indent);
    this._model.errors.push(error);
  }

  warn(warn: string, indent = 1) {
    this.loggingService.warn(warn, indent);
    this._model.warnings.push(warn);
  }

  get model(): ErrorProcessingModel {
    return this._model;
  }

  get allErrorsAndWarning(): string[] {
    return [...this.model.errors, ...this.model.warnings];
  }


}
