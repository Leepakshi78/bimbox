//this file creates email queue whenever admin will change the status of any user a job will pushed into this queue
import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";


//Email queue:this queue stores email jobs worker will process this job later
export const emailQueue=new Queue("emailQueue",{
    connection:redisConnection,
});

