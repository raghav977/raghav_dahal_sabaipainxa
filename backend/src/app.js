
// src/app.js
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
// cookie-parser removed: we'll use header-based tokens and localStorage on client
const path = require("path");
const rateLimit = require("express-rate-limit"); 

const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");

const scrappingRoute = require("./routes/scrapping");

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
app.use(express.json());







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

// Payments
app.use("/api/payments", paymentRoute);


app.use("/api/pdfs",scrappingRoute);

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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));




module.exports = app;