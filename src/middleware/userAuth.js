import jwt from "jsonwebtoken";

const userauth = async (req, res, next) => {
  const token = req.cookies?.token;
  const refreshToken = req.cookies?.refreshToken;

  // If no access token, check if we have a refresh token
  if (!token) {
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No tokens provided"
      });
    }

    // Try to use refresh token to generate new access token
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "15m" });

      // Set the new access token cookie
      res.cookie("token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
      });

      req.user = { id: decoded.id };
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }
  }

  // If access token exists, verify it
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    // Access token is invalid/expired, try refresh token
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "15m" });

      // Set the new access token cookie
      res.cookie("token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
      });

      req.user = { id: decoded.id };
      next();
    } catch (refreshError) {
      return res.status(401).json({
        success: false,
        message: "Session expired - Please login again"
      });
    }
  }
};

export default userauth;
