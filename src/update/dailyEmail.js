import cron from "node-cron";
import logger from "../utils/logger.js";
import { dailyEmail } from "../middlewares/services.js";


export const startDailyEmail=()=>{
    cron.schedule(
        "0 11 * * *",
        async()=>{
            logger.info("CRON is running");
            logger.info("Daily 11am email service started.");
            await dailyEmail();
            logger.info("Daily 11am email service is finished");

        }, 
        {
            timezone: "Asia/Kolkata"

        }
    
    );


};