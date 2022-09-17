import chalk from 'chalk';
import {Service} from 'typedi';

enum LogLevel {
  TRACE,
  DEBUG,
  INFO,
  WARN,
  ERROR
}

@Service()
export class LoggingService {

  trace(msg: string, indentation = 0, ...args: any[]): void {
    this.log(LogLevel.TRACE, msg, indentation, args);
  }

  debug(msg: string, indentation = 0, ...args: any[]): void {
    this.log(LogLevel.DEBUG, msg, indentation, args);
  }

  info(msg: string, indentation = 0, ...args: any[]): void {
    this.log(LogLevel.INFO, msg, indentation, args);
  }

  warn(msg: string, indentation = 0, ...args: any[]): void {
    this.log(LogLevel.WARN, msg, indentation, args);
  }

  error(msg: string, indentation = 0, ...args: any[]): void {
    this.log(LogLevel.ERROR, msg, indentation, args);
  }

  private log(loglevel: LogLevel, msg: string, indentation: number, ...args: any[]) {
    const indentedMessage = this.getIndentedMessage(msg, indentation);
    switch (loglevel) {
      case LogLevel.TRACE:
        console.log(chalk.grey(indentedMessage, args));
        break;
      case LogLevel.DEBUG:
        console.log(chalk.whiteBright(indentedMessage, args));
        break;
      case LogLevel.INFO:
        console.log(chalk.blueBright(indentedMessage, args));
        break;
      case LogLevel.WARN:
        console.log(chalk.yellowBright(indentedMessage, args));
        break;
      case LogLevel.ERROR:
      default:
        console.log(chalk.redBright(indentedMessage, args));
        break;
    }
  }

  private getIndentation(indentation: number, indentChar = '\t'): string {
    return indentChar.repeat(indentation);
  }

  private getIndentedMessage(msg: string, indentation: number): string {
    return `${this.getIndentation(indentation)}${msg}`;
  }

  getSeparatorLine(char = '-', count = 50): string {
    return char.repeat(count);
  }

  getLayerInfo(layerName: string): string {
    const line = this.getSeparatorLine('=');
    return `\n${line}\n${layerName}\n${line}`;
  }

}
