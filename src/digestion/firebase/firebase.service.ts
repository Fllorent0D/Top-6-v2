import {ConfigurationService} from "../../configuration/configuration.service";
import admin, {firestore, messaging} from 'firebase-admin';
import {Service} from "typedi";
import Firestore = firestore.Firestore;

@Service()
export class FirebaseService {
  private _firebaseAdmin: admin.app.App;

  constructor(
    private readonly configuration: ConfigurationService
  ) {
    if (this.configuration.firebaseConfig) {
      this._firebaseAdmin = admin.initializeApp({credential: admin.credential.cert(this.configuration.firebaseConfig)});
    }
  }

  get firestore(): Firestore {
    if (!this._firebaseAdmin) {
      throw new Error('Firebase not initialized');
    }
    return this._firebaseAdmin.firestore();
  }

  get messaging(): messaging.Messaging {
    if (!this._firebaseAdmin) {
      throw new Error('Firebase not initialized');
    }
    return this._firebaseAdmin.messaging();
  }

}
