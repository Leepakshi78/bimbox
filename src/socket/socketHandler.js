// socket/socketHandler.js

import { setSocketMapping, removeSocketMapping, Presence } from "../services/presenceService.js";
import { bumpOfflineTimer, clearOfflineTimer } from "../services/presenceTimer.js";

const userKey = (userId) => `presence:user:${userId}`;

export default function registerSocketHandlers(io, redis) {
  io.on("connection", async (socket) => {
    console.log("Socket connected:", socket.id);

    // user is already authenticated by socketAuth middleware
    const userId = socket.user?.id;

    if (!userId) {
      console.log("No userId found. Disconnecting...");
      socket.disconnect(true);
      return;
    }

    
    // SAVE SOCKET MAPPING
    
    await setSocketMapping(redis, socket.id, userId);

    
    // MARK USER ONLINE
    
    await redis.hSet(userKey(userId), {
      status: Presence.ONLINE,
      lastSeen: Date.now(),
    });

    
    // IDLE TIMER
    
    const scheduleIdle = () =>
      bumpOfflineTimer(
        userId,
        async (uid) => {
          console.log("Marking IDLE due to inactivity:", uid);

          await redis.hSet(userKey(uid), {
            status: Presence.IDLE,
            lastSeen: Date.now(),
          });
        },
        5 * 60 * 1000
      );

    scheduleIdle();

    
    // HEARTBEAT
    
    socket.on("presence:heartbeat", async () => {
      await redis.hSet(userKey(userId), {
        status: Presence.ONLINE,
        lastSeen: Date.now(),
      });

      scheduleIdle();
    });

    
    // ADMIN FORCE LOGOUT
    
    socket.on("admin_force_disconnect", async ({ targetUserId }) => {
      console.log("Admin requested force logout for:", targetUserId);
      console.log("Socket user:", socket.user);

      // Only admin allowed
      if (socket.user?.role?.toLowerCase() !== "admin") {
        console.log("Not admin, ignoring request");
        return;
      }

      // Prevent admin from kicking themselves
      if (socket.user.id === targetUserId) {
        console.log("Admin cannot logout themselves");
        return;
      }

      try {
        // Get all sockets of the target user
        const targetSockets = await redis.sMembers(`user:sockets:${targetUserId}`);

        console.log("Target sockets:", targetSockets);

        if (!targetSockets.length) {
          console.log("User has no active sockets");
          return;
        }

        for (const sid of targetSockets) {
          const s = io.sockets.sockets.get(sid);

          if (s) {
            io.to(sid).emit("forceLogout", { reason: "Disconnected by admin" });
            s.disconnect(true);
          }
        }
      } catch (err) {
        console.error("Force logout error:", err);
      }
    });

    
    // DISCONNECT HANDLER
    
    socket.on("disconnect", async (reason) => {
      console.log("Disconnected:", socket.id, reason);

      try {
        // clear idle timer
        clearOfflineTimer(userId);

        // remove socket mapping
        await removeSocketMapping(redis, socket.id);
      } catch (err) {
        console.error("Disconnect cleanup error:", err);
      }
    });
  });
}