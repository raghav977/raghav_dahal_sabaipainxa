
// src/app.js
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
// cookie-parser removed: we'll use header-based tokens and localStorage on client
const path = require("path");
const rateLimit = require("express-rate-limit"); 



const app = express();


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later."
});

// app.use(globalLimiter);


// We no longer rely on cookie-parser; tokens are passed via headers/localStorage.
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ["x-access-token", "x-refresh-token"]
}));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Increase payload size limit for photo uploads (base64 encoded images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));







const userRoute = require("./routes/userRoute");
const kycRoute = require("./routes/kycRoute");
const adminKycRoute = require("./routes/adminRoutes/kycVerification");
const bidRoutes = require("./routes/bid.routes");
const adminUserRoute = require("./routes/adminRoutes/userRoutes");
const servicesRoute = require("./routes/servicesRoute");
const adminServiceRoute = require("./routes/adminRoutes/serviceRoutes");
const roomVerificationRoute = require("./routes/adminRoutes/roomVerification");
const packageRoute = require("./routes/packageRoute");
const roomRoute = require("./routes/roomRoute");
const serviceProviderRoute = require("./routes/serviceProviderRoute");
const bookingRoute = require("./routes/booking.routes");
const dashboardRoute = require("./routes/adminRoutes/dashboard.routes");
const paymentRoute = require("./routes/payment.route");
const addressRoutes = require('./routes/address.route');
const notificationRoute = require("./routes/notification.route");
const ratingRoute = require("./routes/rating.routes");

const gharbetiDashboardRoute = require("./routes/gharbetidashboard.route");
const jobRoutes = require("./routes/job.routes");
const businessAccountRoutes = require("./routes/businessAccount.routes");
const websiteBuilderRoutes = require("./routes/websiteBuilder.routes");
const workerProfileRoutes = require("./routes/workerProfile.routes");

// Health check endpoint for Docker/Kubernetes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Admin KYC
app.use("/api/admin/kyc", adminKycRoute);

// User & KYC
app.use("/api/users", userRoute);
app.use("/api/kyc", kycRoute);

// Services
app.use("/api/service-providers", serviceProviderRoute);
app.use("/api/services", servicesRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/admin/service", adminServiceRoute);
app.use("/api/admin/users", adminUserRoute);

// Rooms & Packages
app.use("/api/rooms", roomRoute);
app.use("/api/admin/room-verification", roomVerificationRoute);
app.use("/api/packages", packageRoute);

// Bids
app.use("/api/bids", bidRoutes);

// Address
app.use('/api/address', addressRoutes);

// Admin Dashboard
app.use("/api/admin/dashboard", dashboardRoute);

// Notifications
app.use("/api/notifications", notificationRoute);

// Jobs
app.use("/api/jobs", jobRoutes);

// Business Accounts
app.use("/api/business-accounts", businessAccountRoutes);

// Website Builder
app.use("/api/website-builder", websiteBuilderRoutes);

// Worker Profiles
app.use("/api/worker-profiles", workerProfileRoutes);

// Payments
app.use("/api/payments", paymentRoute);




// ratings

app.use("/api/ratings",ratingRoute);

// gharbeti dashboard
app.use("/api/gharbeti/dashboard", gharbetiDashboardRoute);

// Error handler
app.use(errorHandler);

module.exports = app;



// const userRoute = require("./routes/userRoute")
// const kycRoute = require("./routes/kycRoute")
// const adminKycRoute = require("./routes/adminRoutes/kycVerification")

// const bidRoutes = require("./routes/bid.routes")
// const adminUserRoute = require("./routes/adminRoutes/userRoutes")

// const servicesRoute = require("./routes/servicesRoute")
// const adminServiceRoute = require("./routes/adminRoutes/serviceRoutes")

// const roomVerificationRoute = require("./routes/adminRoutes/roomVerification")
// const packageRoute = require("./routes/packageRoute")

// const roomRoute = require("./routes/roomRoute")
// const serviceProviderRoute = require("./routes/serviceProviderRoute")

// const bookingRoute = require("./routes/booking.routes");

// const dashboardRoute = require("./routes/adminRoutes/dashboard.routes")

// payment routes

// const paymentRoute = require("./routes/payment.route")

app.use("/api/admin/kyc",adminKycRoute)

app.use("/api/users",userRoute)
app.use("/api/kyc",kycRoute)

app.use("/api/service-providers",serviceProviderRoute);

app.use("/api/services",servicesRoute);

app.use("/api/booking",bookingRoute);



app.use("/api/admin/service",adminServiceRoute);

app.use("/api/admin/users",adminUserRoute);

// room routes

app.use("/api/rooms",roomRoute);


// room verification routes

app.use("/api/admin/room-verification",roomVerificationRoute);


// package routes

app.use("/api/packages",packageRoute);


// bid routes

app.use("/api/bids",bidRoutes)




// Address Routes
// const addressRoutes = require('./routes/address.route');
app.use('/api/address', addressRoutes);

// admin routes for dashboard analytics

app.use("/api/admin/dashboard",dashboardRoute)
app.use(errorHandler)


// notification routes

// const notificationRoute = require("./routes/notification.route");

app.use("/api/notifications",notificationRoute)


// payment
app.use("/api/payments",paymentRoute)

// swagger docs





module.exports = app;