//logger.js: creates one common logger (Pino). This is the main character that prints structured logs to terminal.

import pino from "pino";

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true }
  }
});


export default logger;
