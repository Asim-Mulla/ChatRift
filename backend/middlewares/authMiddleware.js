import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).send("Please login");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.userId;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send("Session expired. Please login again.");
    } else {
      return res.status(403).send("Invalid or expired token");
    }
  }
};
