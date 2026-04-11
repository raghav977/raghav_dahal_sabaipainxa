#!/bin/sh

echo "🚀 Starting backend server..."
echo "⏳ Waiting for database to be fully ready..."
sleep 5

echo "🔄 Running database migration/sync..."
node src/dataseed/seed.js

echo "✅ Database migration completed!"
echo "🌐 Starting Express server..."
node index.js