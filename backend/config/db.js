import mongoose from "mongoose";
import "dotenv/config";

const dbUrl = process.env.ATLAS_DB_URL;

export const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl).then(() => {
      console.log("DB Connected");
    });
  } catch (error) {
    console.log("Error while connecting DB");
    console.log(error);
  }
};
