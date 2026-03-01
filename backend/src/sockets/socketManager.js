let ioInstance = null;
const onlineUsers = new Map();

function setSocket(io) { ioInstance = io; }
function getIO() { 
  if (!ioInstance) throw new Error("Socket.IO not initialized"); 
  return ioInstance; 
}

function addOnlineUser(userId, socketId) 
{
    console.log("Adding online user:", userId, "with socket ID:", socketId);
    onlineUsers.set(userId, socketId);
    console.log("Current online users:", Array.from(onlineUsers.entries()));}
function removeOnlineUser(socketId) {
  for (const [userId, id] of onlineUsers.entries()) {
    if (id === socketId) onlineUsers.delete(userId);
  }
}
function getSocketId(userId) { return onlineUsers.get(userId); }

function emitToUser(userId, event, payload) {
  const socketId = getSocketId(userId);
  if (socketId) getIO().to(socketId).emit(event, payload);
}

function emitToRoom(room, event, payload) {
  console.log("Emitting to room:", room, "event:", event, "payload:", payload);
  getIO().to(room).emit(event, payload);
}

module.exports = {
  setSocket, getIO, addOnlineUser, removeOnlineUser,
  getSocketId, emitToUser, emitToRoom
};
