import logger from "../utils/logger.js";


//logs every request automatically (method, URL, status code). So you can track which API was hit and what response status it gave.

const httpLogger = (req, res, next) => {
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
    });
  });
  next();
};

export default httpLogger;
