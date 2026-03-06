// services/presenceTimer.js

const timers = new Map(); 
// userId -> timeout

/**
 * Start or reset offline timer
 */
export const bumpOfflineTimer = (userId, markOfflineFn, ms = 5 * 60 * 1000) => {
  if (timers.has(userId)) {
    clearTimeout(timers.get(userId));
  }

  const timeout = setTimeout(() => {
    markOfflineFn(userId);
    timers.delete(userId);
  }, ms);

  timers.set(userId, timeout);
};

/**
 * Clear timer when user fully disconnects
 */
export const clearOfflineTimer = (userId) => {
  if (timers.has(userId)) {
    clearTimeout(timers.get(userId));
    timers.delete(userId);
  }
};