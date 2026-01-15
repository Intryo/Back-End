import jwt from "jsonwebtoken";

const userauth = async (req, res, next) => {
  const token = req.cookies?.token;
  const refreshToken = req.cookies?.refreshToken;
  if (!token) {
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No tokens provided"
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "15m" });

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
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
