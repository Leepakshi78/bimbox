
import { Presence, upsertPresence } from "../services/presenceService.js";

/*
  Marks user Idle if no heartbeat for X minutes.
 Uses Redis set: presence:active_users
 */
export const startIdleWatcher = ({ redis, io, idleMinutes = 5 }) => {
  const idleMs = idleMinutes * 60 * 1000;

  setInterval(async () => {
    try {
      const activeUsers = await redis.sMembers("presence:active_users");
      const now = Date.now();

      for (const userId of activeUsers) {
        const raw = await redis.get(`presence:user:${userId}`);
        if (!raw) continue;

        const p = JSON.parse(raw);

        // Only flip Online -> Idle if lastSeen too old
        if (p.status === Presence.ONLINE && p.lastSeen && now - p.lastSeen > idleMs) {
          const updated = await upsertPresence(redis, userId, { status: Presence.IDLE });
          io.emit("presence_update", { userId, presence: updated });
        }
      }
    } catch (e) {
      // don't crash watcher
      console.error("IdleWatcher error:", e.message);
    }
  }, 30_000); // every 30 sec
};