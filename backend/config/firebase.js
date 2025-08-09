import admin from "firebase-admin";
import "dotenv/config";

// Read and parse the service account JSON file
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
