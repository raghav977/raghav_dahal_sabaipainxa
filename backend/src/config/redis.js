const redis = require("redis");

// Create a Redis client
const client = redis.createClient({
  socket: {
    host: "127.0.0.1", // localhost
    port: 6379
  }
});

// Handle errors
client.on("error", (err) => console.error("Redis Client Error", err));

// Connect inside an async function
async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    // console.log("✅ Connected to Redis");
  }
}

connectRedis();

module.exports = client;
