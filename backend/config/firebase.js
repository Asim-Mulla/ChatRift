import admin from "firebase-admin";
import fs from "fs";

// Read and parse the service account JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync("./config/firebase-service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
