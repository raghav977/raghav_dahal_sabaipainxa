
import { io } from "socket.io-client";
import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "./token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log("This is base url",BASE_URL);
let socket = null;

export const connectSocketConnection = () => {
  const token = getTokenFromLocalStorage("token");
  const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
console.log(!socket)

console.log("this is token and refreshtoken",token);
console.log("this is refershtoken",refreshToken);


  if (!socket) {
    socket = io(BASE_URL, {
      auth: { token, refreshToken },
      transports: ["websocket"], 
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    console.log("this is socket",socket);




    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });
  }

  return socket;
};


export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
