// Test script to add sample worker profile data
require("dotenv").config();
const sequelize = require("./src/config/db");
const User = require("./src/models/User");
const WorkerProfile = require("./src/models/WorkerProfile");

const seedWorkerData = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Create test users if they don't exist
    const user1 = await User.findOrCreate({
      where: { email: "plumber1@test.com" },
      defaults: {
        username: "ram_plumber",
        name: "Ram Plumber",
        email: "plumber1@test.com",
        phone_number: "9841234567",
        password: "$2a$10$1234567890abcdef", // dummy hash
        is_active: true
      }
    });

    const user2 = await User.findOrCreate({
      where: { email: "carpenter1@test.com" },
      defaults: {
        username: "shyam_carpenter",
        name: "Shyam Carpenter",
        email: "carpenter1@test.com",
        phone_number: "9842345678",
        password: "$2a$10$1234567890abcdef",
        is_active: true
      }
    });

    const user3 = await User.findOrCreate({
      where: { email: "electrician1@test.com" },
      defaults: {
        username: "hari_electrician",
        name: "Hari Electrician",
        email: "electrician1@test.com",
        phone_number: "9843456789",
        password: "$2a$10$1234567890abcdef",
        is_active: true
      }
    });

    // Create worker profiles with locations around Kathmandu
    const profile1 = await WorkerProfile.findOrCreate({
      where: { user_id: user1[0].id },
      defaults: {
        user_id: user1[0].id,
        title: "Professional Plumber",
        bio: "10+ years of experience in residential and commercial plumbing",
        phone: "9841234567",
        hourly_rate: 500,
        latitude: 27.7172,
        longitude: 85.3240,
        location_name: "Kathmandu, Nepal",
        skills: [
          { id: 1, name: "Pipe Installation" },
          { id: 2, name: "Leak Repair" },
          { id: 3, name: "Bathroom Fixtures" }
        ],
        is_available: true,
        is_verified: true,
        average_rating: 4.5
      }
    });

    const profile2 = await WorkerProfile.findOrCreate({
      where: { user_id: user2[0].id },
      defaults: {
        user_id: user2[0].id,
        title: "Skilled Carpenter",
        bio: "Specializing in custom furniture and home renovations",
        phone: "9842345678",
        hourly_rate: 600,
        latitude: 27.7245,
        longitude: 85.3355,
        location_name: "Thamel, Kathmandu, Nepal",
        skills: [
          { id: 1, name: "Furniture Making" },
          { id: 2, name: "Wood Finishing" },
          { id: 3, name: "Home Renovation" }
        ],
        is_available: true,
        is_verified: true,
        average_rating: 4.8
      }
    });

    const profile3 = await WorkerProfile.findOrCreate({
      where: { user_id: user3[0].id },
      defaults: {
        user_id: user3[0].id,
        title: "Licensed Electrician",
        bio: "Certified electrician with experience in wiring and repairs",
        phone: "9843456789",
        hourly_rate: 550,
        latitude: 27.7133,
        longitude: 85.3095,
        location_name: "Patan, Kathmandu, Nepal",
        skills: [
          { id: 1, name: "Electrical Wiring" },
          { id: 2, name: "Circuit Repair" },
          { id: 3, name: "Safety Inspection" }
        ],
        is_available: true,
        is_verified: false,
        average_rating: 4.2
      }
    });

    console.log("✅ Worker profiles created/found:");
    console.log(`  - ${profile1[0].title} at ${profile1[0].location_name}`);
    console.log(`  - ${profile2[0].title} at ${profile2[0].location_name}`);
    console.log(`  - ${profile3[0].title} at ${profile3[0].location_name}`);

    console.log("\n✅ Test data seeded successfully!");
    console.log("\nTest search endpoint:");
    console.log("curl 'http://localhost:5001/api/users/search-candidates?latitude=27.7172&longitude=85.324&radius=10'");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  }
};

seedWorkerData();
