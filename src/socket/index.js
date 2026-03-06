
import { Server } from "socket.io";
import { socketAuth } from "./authSocket.js";
import { startIdleWatcher } from "./idleWatcher.js";

import {
  setSocketMapping,
  removeSocketMapping,
  markOnline,
  markOfflineIfNoSockets,
  upsertPresence,
  getUserSockets,
  Presence,
} from "../services/presenceService.js";

/**
 * Attach socket.io to the HTTP server
 * @param {http.Server} httpServer
 * @param {object} deps - { redis, app }
 */
export const initSocket = ({ httpServer, redis, app }) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // handshake auth
  io.use(socketAuth);
//user open website -->socket connects 
  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    // Store mapping (socketId -> userId, userId -> sockets) this stores mapping in redis
    await setSocketMapping(redis, socket.id, userId);

    // Track "active users" for idleWatcher
    await redis.sAdd("presence:active_users", userId);

    // rooms here each user joins a private room So server can send events only to that user.
    socket.join(`user:${userId}`);
    //admin joins a special room admins 
    if (socket.user.role === "Admin") socket.join("admins");

    // mark Online
    const p = await markOnline(redis, userId);
    io.emit("presence_update", { userId, presence: p });

    // Heartbeat
    socket.on("heartbeat", async () => {
      const updated = await upsertPresence(redis, userId, {
        status: Presence.ONLINE,
        lastSeen: Date.now(),
      });
      io.emit("presence_update", { userId, presence: updated });
    });

    // Busy / In-call toggle from client
    socket.on("set_busy", async ({ busy }) => {
      const status = busy ? Presence.BUSY : Presence.ONLINE;
      const updated = await upsertPresence(redis, userId, { status });
      io.emit("presence_update", { userId, presence: updated });
    });

    // Admin force disconnect
  socket.on("admin_force_disconnect", async ({ targetUserId }) => {
  console.log("Admin requested force logout for:", targetUserId);
  console.log("Socket user:", socket.user);

  if (socket.user.role !== "admin") {
    console.log("Not admin, ignoring request");
    return;
  }

  const targetSockets = await getUserSockets(redis, targetUserId);

  console.log("Target sockets:", targetSockets);

  for (const sid of targetSockets) {
    io.to(sid).emit("forceLogout", { reason: "Disconnected by admin" });

    const s = io.sockets.sockets.get(sid);
    if (s) s.disconnect(true);
  }
  });
    socket.on("disconnect", async () => {
      const uid = await removeSocketMapping(redis, socket.id);
      if (!uid) return;

      const maybeOffline = await markOfflineIfNoSockets(redis, uid);
      if (maybeOffline) {
        io.emit("presence_update", { userId: uid, presence: maybeOffline });
        await redis.sRem("presence:active_users", uid);
      }
    });
  });

  // allow controller to access socket server 
  if (app) app.set("io", io);

  // start idle watcher
  startIdleWatcher({ redis, io, idleMinutes: 5 });

  return io;
};