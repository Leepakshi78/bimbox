// src/index.js

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: "./.env" });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("MONGO_URI:", process.env.MONGO_URI ? "loaded" : "missing");

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.config.js";

import httpLogger from "./middlewares/httpLogger.js";
import { errorLogger } from "./middlewares/errorLogger.js";
import errorHandler from "./middlewares/error.js";

import { startDailyEmail } from "./update/dailyEmail.js";

// routes
import adminRoute from "./routes/adminRoute.js";
import systemRoute from "./routes/systemRoute.js";

// maintenance mode middlewares
import optionalAuth from "./middlewares/optionalAuth.js";
import { maintenanceGuard } from "./middlewares/maintenanceGuard.js";
//to know about Redis presence store.
import http from "http";
import redisClient from "./config/redis.config.js";
import { initSocket } from "./socket/index.js";

const app = express();
const port = process.env.PORT || 6001;

const server = http.createServer(app);
//creating http server
// important for correct req.ip behind proxy
app.set("trust proxy", 1);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis(); // Redis connects before routes are imported

    app.set("redis", redisClient);

    const io = initSocket({
      httpServer: server,
      redis: redisClient,
      app,
    });

    app.set("io", io);

    // importing routes ONLY after Redis is ready
    const { default: userRoute } = await import("./routes/userRoute.js");

    // common middleware
    app.use(
      cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
      })
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.get("/", (req, res) => {
      res.status(200).send("The site is working finely");
    });

    // request logger (log all requests)
    app.use(httpLogger);

    // -----------------------------
    // PUBLIC ROUTES FIRST
    // Login/OTP/Register must be reachable even during maintenance
    // (login controller will block non-admin during maintenance)
    // -----------------------------
    app.use("/api/user", userRoute);

    // -----------------------------
    // MAINTENANCE MODE (for everything else)
    // optionalAuth reads Bearer token if present so admin can bypass maintenance
    // -----------------------------
    app.use(optionalAuth);
    app.use(maintenanceGuard);

    // -----------------------------
    // PROTECTED/ADMIN/SYSTEM ROUTES
    // -----------------------------
    app.use("/api/admin", adminRoute);
    app.use("/api/system", systemRoute);

    startDailyEmail();

    // error logging and handler
    app.use(errorLogger);
    app.use(errorHandler);

    server.listen(port, () => console.log(`Listening on ${port}`));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

startServer();

// Socket.IO needs the raw HTTP server, not Express directly.
// express() → creates app

// http.createServer(app) → creates HTTP server

// socket.io attaches to HTTP server

// server.listen() starts everything