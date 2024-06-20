const jwt = require('jsonwebtoken');
const User = require('./models/user.model'); // Adjust the path as necessary

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error("No token provided");
    return res.status(401).json({ error: true, message: "No token provided" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      console.error("Token verification failed:", err);
      return res.status(403).json({ error: true, message: "Token verification failed" });
    }

    try {
      const foundUser = await User.findById(user._id);
      if (!foundUser) {
        console.error("User not found");
        return res.status(401).json({ error: true, message: "User not found" });
      }

      req.user = foundUser;
      next();
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: true, message: "Database error" });
    }
  });
}

module.exports = {
  authenticateToken,
};
