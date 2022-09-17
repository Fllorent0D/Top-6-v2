import {ConfigurationService} from "../../configuration/configuration.service";
import admin, {firestore, messaging} from 'firebase-admin';
import Firestore = firestore.Firestore;
import {Service} from "typedi";

@Service()
export class FirebaseService {
  private _firebaseAdmin: admin.app.App;

  constructor(
    private readonly configuration: ConfigurationService
  ) {
    this._firebaseAdmin = admin.initializeApp({credential: admin.credential.cert(this.configuration.firebaseConfig)});
  }

  get firestore(): Firestore {
    return this._firebaseAdmin.firestore();
  }

  get messaging(): messaging.Messaging{
    return this._firebaseAdmin.messaging();
  }

}
