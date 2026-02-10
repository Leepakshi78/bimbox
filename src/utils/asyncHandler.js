export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
//here fn is a variable holding any controller function u want to pass in 


// We need asyncHandler because Express cannot catch errors thrown inside async functions by default.

// Without it → your server may crash or errors won’t reach your global error middleware.

// With it → every async error automatically goes to your error.js.
