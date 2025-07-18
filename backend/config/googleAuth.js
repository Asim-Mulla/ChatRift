import { google } from "googleapis";
import "dotenv/config";

const oauth2client = new google.auth.OAuth2(
  `${process.env.GOOGLE_CLIENT_ID}`,
  `${process.env.GOOGLE_CLIENT_SECRET}`,
  "postmessage"
);

export default oauth2client;
