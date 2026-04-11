#!/usr/bin/env node
/**
 * Database Migration Script
 * Run this to sync/migrate your database schema
 * 
 * Usage:
 *   npm run migrate          # Normal sync (create if not exists)
 *   npm run migrate:force    # Force recreate all tables (DEV ONLY)
 *   npm run migrate:seed     # Sync + seed base data
 */

require("dotenv").config();
const sequelize = require("./src/config/db");

// Import all models and associations
require("./src/database/relation");

const args = process.argv.slice(2);
const mode = args[0] || "normal";

const migrateDatabase = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection OK");

    let syncOptions = { alter: true, force: false };

    if (mode === "force") {
      console.log("⚠️  WARNING: Force mode will DROP all tables!");
      syncOptions = { force: true };
    } else if (mode === "normal" || mode === "seed") {
      console.log("📊 Syncing database (create if not exists)...");
    }

    await sequelize.sync(syncOptions);
    console.log("✅ Database schema synced successfully!");

    if (mode === "seed") {
      console.log("🌱 Seeding base data...");
      const seedDatabase = require("./src/dataseed/seed");
      
      // Import seed function
      const { seedDatabase: seed } = require("./src/dataseed/seed");
      // Actually just run the full seed
      const result = await new Promise((resolve) => {
        const seedScript = require("./src/dataseed/seed");
      });
      console.log("✅ Database seeded with base data!");
    }

    console.log("✨ Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
};

migrateDatabase();
