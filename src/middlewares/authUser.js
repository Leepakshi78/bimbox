import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  const token = req.headers.token;
  //req.headers: the headers sent along with the HTTP request.

  
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, login" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid/Expired token" });
  }
};

export default authUser;
