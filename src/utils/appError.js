class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export default AppError;


// It creates custom structured errors 
//without it every error end up looking like 500 server error 
