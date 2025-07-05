import mongoose from "mongoose";
import { DB_NAME } from "../utils/constant.js";
import app from "../app.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}${DB_NAME}`
    );

    console.log(`MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`);

    app.on("error",(error) => {
      console.error("MONGODB connection error: ", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("MONGODB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
