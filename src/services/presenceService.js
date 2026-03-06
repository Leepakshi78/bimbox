// src/services/presenceService.js

export const Presence = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  IDLE: "Idle",
  BUSY: "Busy",
  SUSPENDED: "Suspended",
  DEACTIVATED: "Deactivated",
};

const userKey = (userId) => `presence:user:${userId}`;
const socketKey = (socketId) => `presence:socket:${socketId}`;
const userSocketsKey = (userId) => `presence:user_sockets:${userId}`;

/**
 * Save socketId -> userId and also userId -> socketIds set
 */
export const setSocketMapping = async (redis, socketId, userId) => {
  await redis.set(socketKey(socketId), userId);
  await redis.sAdd(userSocketsKey(userId), socketId);
};

/**
 * Remove socketId mapping and also remove from user's socket set
 */
export const removeSocketMapping = async (redis, socketId) => {
  const userId = await redis.get(socketKey(socketId));
  if (userId) {
    await redis.sRem(userSocketsKey(userId), socketId);
  }
  await redis.del(socketKey(socketId));
  return userId;
};

/**
 * Get all socketIds for a user (multi-tab support)
 */
export const getUserSockets = async (redis, userId) => {
  return redis.sMembers(userSocketsKey(userId));
};

/**
 * Upsert presence JSON for a user in Redis
 */
export const upsertPresence = async (redis, userId, patch) => {
  const now = Date.now();
  const raw = await redis.get(userKey(userId));
  const current = raw ? JSON.parse(raw) : { status: Presence.OFFLINE, lastSeen: now };

  const updated = {
    ...current,
    ...patch,
    lastSeen: patch.lastSeen ?? now,
  };

  await redis.set(userKey(userId), JSON.stringify(updated));
  return updated;
};

/**
 * Mark online and update lastSeen
 */
export const markOnline = async (redis, userId) => {
  return upsertPresence(redis, userId, {
    status: Presence.ONLINE,
    lastSeen: Date.now(),
  });
};

/**
 * Mark offline ONLY if the user has no sockets left
 */
export const markOfflineIfNoSockets = async (redis, userId) => {
  const count = await redis.sCard(userSocketsKey(userId));
  if (count === 0) {
    return upsertPresence(redis, userId, {
      status: Presence.OFFLINE,
      lastSeen: Date.now(),
    });
  }
  return null;
};

/**
 * Get presence of a user
 */
export const getPresence = async (redis, userId) => {
  const raw = await redis.get(userKey(userId));
  return raw ? JSON.parse(raw) : { status: Presence.OFFLINE, lastSeen: null };
};