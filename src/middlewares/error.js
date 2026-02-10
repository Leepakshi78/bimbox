import logger from "../utils/logger.js";

//Global Error Handler 
const errorHandler = (err, req, res, next) => {
  logger.error("errr occurred")
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
};

export default errorHandler;




//here are the work of 4 error handlers 
// 1.err (Error): The error object containing details about the exception.
// 2.req (Request): The HTTP request object.
// 3.res (Response): The HTTP response object used to send the error response.
// 4.next (Next Function): The function to pass control to the next middleware. 


//global error handling middleware functions are defined with three to 4 parameters
//It allows to catch and handles the errors throughout the process.


//jobs@talensiyaconsulting.com
//preethi.g@amplelogic.com
//sahil.rathod@eternityllp.com

//aspora
//zfunds
