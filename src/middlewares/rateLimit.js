import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.config.js";

const createStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });

const common = {
  standardHeaders: true,
  legacyHeaders: false,
};
// standardHeaders: true → sends rate-limit info using modern standard HTTP headers
// legacyHeaders: false → disables old/deprecated rate-limit headers
// This keeps  API clean and future-proof
// Browsers/tools can properly read limit info

export const otpEmailLimiter = () =>
  rateLimit({
    ...common,
    store: createStore("otp-email:"),
    windowMs: 10 * 60 * 1000,
    max: 3,
    keyGenerator: (req) =>
      (req.body?.email || "").toLowerCase().trim() || ipKeyGenerator(req),
    message: "OTP limit reached. Try again later.",
  });

export const otpIpLimiter = () =>
  rateLimit({
    ...common,
    store: createStore("otp-ip:"),
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => ipKeyGenerator(req),
    message: "Too many OTP requests from this IP.",
  });

export const loginLimiter = () =>
  rateLimit({
    ...common,
    store: createStore("login:"),
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => ipKeyGenerator(req),
    message: "Too many login attempts. Try later.",
  });
