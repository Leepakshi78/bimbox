import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";

const run = async () => {
  try {
    // connect DB
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
    }

    console.log("Checking admin:", adminEmail);

    // check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      existingUser.role = "admin";
      existingUser.isVerified = true;
      existingUser.mustChangePassword = true;

      await existingUser.save();

      console.log(" Existing user promoted to ADMIN");
      process.exit(0);
    }

    // create new admin if not exists
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      mustChangePassword: true,
    });

    console.log(" Admin account created successfully");
    process.exit(0);
  } catch (error) {
    console.error(" Seeder failed:", error.message);
    process.exit(1);
  }
};

run();
