const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const {verifyToken } = require("./src/services/tokenService"); 
const {initBidSocket} = require("./src/sockets/bidSocket");
const { setSocketInstance } = require("./src/controllers/booking.controller");
const { setSocket } = require("./src/sockets/socketManager");



require("./src/config/db");
require("./src/database/relation");


dotenv.config();
const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});


io.use(async (socket, next) => {
  try {
    // Accept token from multiple possible handshake locations for backward compatibility:
    // 1. socket.handshake.auth (preferred)
    // 2. socket.handshake.query (legacy)
    // 3. cookies
    console.log("socket connection triggered")
    const authToken = socket.handshake?.auth?.token;
    const authRefresh = socket.handshake?.auth?.refreshToken;

    const queryToken = socket.handshake?.query?.token;
    const queryRefresh = socket.handshake?.query?.refreshToken;

    console.log("socket handshake auth token:", authToken);
    console.log("socket handshake query token:", queryToken);

    if (!authToken && !queryToken) {
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {});
        socket.handshake.query.token = cookies["token"];
        socket.handshake.query.refreshToken = cookies["refreshToken"];
      }
    }

    const finalToken = authToken || queryToken || socket.handshake.query.token;
    const finalRefreshToken = authRefresh || queryRefresh || socket.handshake.query.refreshToken;

    if (!finalToken) {
      return next(new Error("Authentication error: No token provided"));
    }

    const { verifyToken } = require("./src/services/tokenService");
    const jwt = require("jsonwebtoken");
    const userServices = require("./src/services/userServices");

    // ✅ Verify access token
    try {
      const user = await verifyToken(finalToken);
      socket.user = user;
      console.log("is this user",user)
      return next();
    } catch (err) {
      if (err.name === "TokenExpiredError" && finalRefreshToken) {
        try {
          const decoded = jwt.verify(finalRefreshToken, process.env.JWT_REFRESH_SECRET);
          const user = await userServices.getUserById(decoded.id);
          if (!user) return next(new Error("User not found"));

          const { generateToken } = require("./src/services/tokenService");
          const newAccessToken = await generateToken(user);

          // Optionally send new token back via socket event
          socket.emit("token-refreshed", { token: newAccessToken });

          socket.user = user;
          console.log("🔄 Refreshed token for socket connection");
          return next();
        } catch (refreshErr) {
          console.error("Refresh failed:", refreshErr.message);
          return next(new Error("Authentication error: Refresh failed"));
        }
      }

      console.error("Invalid or expired token:", err.message);
      return next(new Error("Authentication error: Invalid token"));
    }
  } catch (e) {
    console.error("💥 Socket auth error:", e);
    next(new Error("Authentication middleware failed"));
  }
});









initBidSocket(io);

setSocket(io);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
