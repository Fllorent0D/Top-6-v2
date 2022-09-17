import typeFlag from "type-flag";
import {Service} from "typedi";

@Service()
export class CommandConfigurationService {

  private parsed;

  init() {
    this.parsed = typeFlag({
      weeklySummary: {
        type: Boolean,
        default: false
      },
      emails: {
        type: [String],
        default: () => []
      },
      weekName: {
        type: Number,
        default: 22
      },
      sendViaEmail: {
        type: Boolean,
        default: false
      },
      uploadToFirebase: {
        type: Boolean,
        default: false
      },
      postToFacebook: {
        type: Boolean,
        default: false
      }
    });
  }

  get weeklySummary(): boolean {
    return this.parsed.flags.weeklySummary;
  }

  get weekName(): number {
    return this.parsed.flags.weekName;
  }

  get sendViaEmail(): boolean {
    return this.parsed.flags.sendViaEmail;
  }

  get uploadToFirebase(): boolean {
    return this.parsed.flags.uploadToFirebase;
  }

  get emails(): string[] {
    return this.parsed.flags.emails;
  }

  get postToFacebook(): boolean {
    return this.parsed.flags.postToFacebook;
  }

}
