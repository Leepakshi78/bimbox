// Import Redis client
import IORedis from "ioredis";
//creating redis connection as bullmq uses redis to store jobs
export const redisConnection=new IORedis({
    host:"127.0.0.1",
    port:6379,
    // BullMQ requires this option
  maxRetriesPerRequest: null,
});