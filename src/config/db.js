import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.config.js";

const connectDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is missing. Check .env loading and env.config.js");
    }

    // Force DNS resolvers (helps SRV issues in some networks)
  //   dns.setServers(["1.1.1.1", "8.8.8.8"]);
  //  console.log("DNS servers:", dns.getServers());

    console.log("Connecting to MongoDB...");
    //console.log("Actual URI:", env.MONGO_URI);

    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });

    // console.log("Db connected:", mongoose.connection.host);
   console.log("DB Connected");

    mongoose.connection.on("error", (err) => {
      console.log("Mongo runtime error:", err.message);
    });
  } catch (err) {
    console.log("failed to connect db:", err.message);
    process.exit(1);
  }
};

export default connectDB;