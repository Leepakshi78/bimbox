import jwt from "jsonwebtoken";

const optionalAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return next();

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Do not fetch user from DB here, keep it lightweight
    // Only used to detect admin role for maintenance bypass
    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (err) {
    next();
  }
};

export default optionalAuth;