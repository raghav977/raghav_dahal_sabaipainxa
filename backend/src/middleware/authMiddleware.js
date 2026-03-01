const responses = require("../http/response");
const tokenService = require("../services/tokenService");
const userServices = require("../services/userServices");

const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  console.log("this is requst url",req.url)
  console.log("🔐 authMiddleware invoked");

  try {
    console.log("this is request headers",req.headers)
    const accessToken = req.headers["authorization"]?.split(" ")?.[1] || null;
    const refreshToken = req.headers["x-refresh-token"] || null;


    if (!accessToken) {
      return responses.unauthorized(res, "No access token provided. Please log in.");
    }

    let decoded;

    try {

      decoded = await tokenService.verifyToken(accessToken);
    } catch (err) {

      if (err.name === "TokenExpiredError") {
        console.log("⚠️ Access token expired.");

            if (refreshToken) {
          try {
            const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await userServices.getUserById(refreshDecoded.id);
            if (!user) {
              return responses.notFound(res, "User not found.");
            }

            if (user.refresh_token && user.refresh_token !== refreshToken) {
              res.clearCookie("token");
              res.clearCookie("refreshToken");
              return responses.unauthorized(res, "Invalid refresh token.");
            }

            
            const newAccessToken = await tokenService.generateToken(user);
            // Expose refreshed token to the client via response header. Client should store it in localStorage.
            res.setHeader("x-access-token", newAccessToken);

            req.user = user;
            req.roles = refreshDecoded.roles || [];
            console.log("✅ Access token refreshed automatically!");
            return next();
          } catch (refreshErr) {
            console.error("❌ Refresh token invalid or expired:", refreshErr.message);
            return responses.unauthorized(res, "Session expired. Please log in again.");
          }
        } else {
          return responses.unauthorized(res, "Token expired. Please log in again.");
        }
      }


      console.error("❌ Invalid token:", err.message);
      return responses.unauthorized(res, "Invalid token. Please log in again.");
    }

    // valid access token
    const user = await userServices.getUserById(decoded.id);
    if (!user) {
      return responses.notFound(res, "User not found. Please register.");
    }

    req.user = user;
    req.roles = decoded.roles || [];
    return next();
  } catch (error) {
    console.error("💥 Error in authMiddleware:", error);
    return responses.serverError(res, {}, "Error verifying authentication.");
  }
};
module.exports = { authMiddleware };
