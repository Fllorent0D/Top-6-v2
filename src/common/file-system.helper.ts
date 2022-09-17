import { Service } from "typedi";
import { LoggingService } from "./logging-service";
import * as fs from 'fs';
import * as path from 'path';

@Service()
export class FileSystemHelper {

    constructor(private readonly _loggingService: LoggingService) {
    }

    createFolderIfNotExist(fullPath: string, indent = 1): boolean {
        if (!fs.existsSync(fullPath)) {
            this._loggingService.trace(`- Creating folder '${fullPath}' ...`, indent);
            fs.mkdirSync(fullPath);
            return true;
        }
        return false;
    }

    writeToFile(data: any, stringify: boolean, fileName: string, relativeOutFolderPath: string, indent = 1): void {
        const fullPath = path.join(__dirname, `${relativeOutFolderPath}/${fileName}`);
        this._loggingService.trace(`Write to file '${fullPath}' ...`, indent);
        fs.writeFileSync(fullPath, stringify ? JSON.stringify(data, null, 2) : data);
    }

    writeToFileA(data: any, stringify: boolean, absoluteFolderPathName: string, indent = 1): void {
        this._loggingService.trace(`Write to file '${absoluteFolderPathName}' ...`, indent);
        fs.writeFileSync(absoluteFolderPathName, stringify ? JSON.stringify(data, null, 2) : data);
    }
}
