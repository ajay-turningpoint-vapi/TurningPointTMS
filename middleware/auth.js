const jwt = require("jsonwebtoken");
require("dotenv").config();
module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  // Check if Authorization header is present
  if (!authHeader) {
    return res.status(401).send("Access Denied. No Token Provided.");
  }

  // Check if the Authorization header is in the correct format
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send("Access Denied. No Token Provided.");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Handle token expiration
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token has expired" });
    }
    // Handle invalid token
    res.status(401).json({ msg: "Token is not valid" });
  }
};
