import {Configuration} from "./tabt-client";
import {configuration} from "../configuration/configuration";

export class TabtClientConfigFactory {
  static createConfiguration(): Configuration {
    return new Configuration({
      basePath: configuration.tabtBaseApi
    });
  }
}
