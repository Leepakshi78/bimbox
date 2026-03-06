import redisClient from "../config/redis.config.js";
import AppError from "./appError.js";

const FAIL_WINDOW_SEC = 15 * 60; // count failures within 15 minutes
const LOCK_SEC = 15 * 60;        // lock duration 15 minutes
const MAX_FAILS = 5;

const keyFail = (userId) => `login:fail:${userId}`;
const keyLock = (userId) => `login:lock:${userId}`;

export const ensureNotLocked = async (userId) => {
  const locked = await redisClient.exists(keyLock(userId));
  if (locked) {
    const ttl = await redisClient.ttl(keyLock(userId));
    throw new AppError(
      `Account temporarily locked. Try again in ${ttl > 0 ? ttl : LOCK_SEC} seconds.`,
      423
    );
  }
};

export const recordFailedLogin = async (userId) => {
  const fails = await redisClient.incr(keyFail(userId));

  // set window TTL only on first failure
  if (fails === 1) {
    await redisClient.expire(keyFail(userId), FAIL_WINDOW_SEC);
  }

  if (fails >= MAX_FAILS) {
    // lock user
    await redisClient.set(keyLock(userId), "1", { EX: LOCK_SEC });
    // reset fail counter
    await redisClient.del(keyFail(userId));

    throw new AppError("Too many failed login attempts. Account locked for 15 minutes.", 423);
  }
};

export const clearLoginFailures = async (userId) => {
  await redisClient.del(keyFail(userId));
  
};
