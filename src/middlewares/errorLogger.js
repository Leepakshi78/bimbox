//logs every error (message + stack + route info). This helps you debug without relying only on the client response.

import logger from "../utils/logger.js";

export const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,  // send only during dev mode
    method: req.method,
    url: req.originalUrl,
  });
  next(err); // IMPORTANT: pass error to errorHandler
};



// Stack trace can expose:

// File names

// Folder structure

// Logic flow

// Tech stack