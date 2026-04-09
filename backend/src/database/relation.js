const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Import models
const User = require("../models/User");
const Role = require("../models/Role");
const Otp = require("../models/Otp");
const ServiceProvider = require("../models/ServiceProvider");
const Gharbeti = require("../models/Gharbeti");
const RoomImages = require("../models/RoomImages");
// const ServiceProviderServiceLocation = require("../models/ServiceProviderServiceLocation");


const PaymentActual = require("../models/PaymentActual");



const Service = require("../models/Services");
const Subcategory = require("../models/Subcategory");
const Package = require("../models/package");

const ServiceProviderService = require("../models/ServiceProviderService");
const ServiceDocument = require("../models/ServiceDocument");
const ServiceImages = require("../models/ServiceImages");
const ServiceLocation = require("../models/Location");
const ServiceSchedules = require("../models/Schedule");

const Province = require("../models/Provinces");
const District = require("../models/Districts");
const Municipal = require("../models/Municipal");


const Esewa = require("../models/Esewa");
const Khalti = require("../models/Khalti");
const Bank = require("../models/Bank");
const PaymentAccount = require("../models/Payment");

const PaymentRecords = require("../models/PaymentRecords");




const KycImages = require("../models/kycImages");
const Kyc = require("../models/Kyc");
const Room = require("../models/Room");

const Booking = require("../models/Booking");

const Bid = require("../models/Bid");
const Rating = require("../models/Rating");

// NEW: Job-related models
const Job = require("../models/Job");
const JobResponse = require("../models/JobResponse");
const UserLocation = require("../models/UserLocation");
const BusinessAccount = require("../models/BusinessAccount");
const WebsiteBuilder = require("../models/WebsiteBuilder");
const WorkerProfile = require("../models/WorkerProfile");

// room payment

const RoomPayment = require("../models/RoomPayment");


// templates









const UserRole = sequelize.define("UserRole", {}, { timestamps: false, tableName: "UserRole" });





User.belongsToMany(Role, { through: UserRole });
Role.belongsToMany(User, { through: UserRole });

// ===== User -> Otp (One-to-Many) =====
// User.hasMany(Otp, { foreignKey: "userId" });
// Otp.belongsTo(User, { foreignKey: "userId" });

// ===== User -> ServiceProvider (One-to-Many) =====
User.hasMany(ServiceProvider, { foreignKey: "userId" });
ServiceProvider.belongsTo(User, { foreignKey: "userId" });

// ===== User -> Gharbeti (One-to-Many) =====
User.hasMany(Gharbeti, { foreignKey: "userId" });
Gharbeti.belongsTo(User, { foreignKey: "userId" });




Service.hasMany(Subcategory, { foreignKey: "serviceId" });
Subcategory.belongsTo(Service, { foreignKey: "serviceId" });

ServiceProviderService.hasMany(Package, { foreignKey: "serviceProviderServiceId" });
Package.belongsTo(ServiceProviderService, { foreignKey: "serviceProviderServiceId" });

// ===== Subcategory -> Package (One-to-Many) =====
// Subcategory.hasMany(Package, { foreignKey: "subcategoryId" });
// Package.belongsTo(Subcategory, { foreignKey: "subcategoryId" });

// ===== ServiceProvider -> ServiceProviderService (One-to-Many) =====
ServiceProvider.hasMany(ServiceProviderService, { foreignKey: "serviceProviderId" });
ServiceProviderService.belongsTo(ServiceProvider, { foreignKey: "serviceProviderId" });

// ===== ServiceProviderService -> Service & Subcategory =====
ServiceProviderService.belongsTo(Service, { foreignKey: "serviceId" });
Service.hasMany(ServiceProviderService, { foreignKey: "serviceId" });

// ServiceProviderService.belongsTo(Subcategory, { foreignKey: "subcategoryId", allowNull: true });
// Subcategory.hasMany(ServiceProviderService, { foreignKey: "subcategoryId" });

// ===== ServiceProviderService -> Package (optional, if service is a package) =====
// ===== ServiceProviderService -> Documents & Images =====
ServiceProviderService.hasMany(ServiceDocument, { foreignKey: "serviceProviderServiceId" });
ServiceDocument.belongsTo(ServiceProviderService, { foreignKey: "serviceProviderServiceId" });

ServiceProviderService.hasMany(ServiceImages, { foreignKey: "serviceProviderServiceId" });
ServiceImages.belongsTo(ServiceProviderService, { foreignKey: "serviceProviderServiceId" });

// ===== ServiceProviderService -> Location =====
// ServiceProviderService.belongsToMany(ServiceLocation, {
//   through: ServiceProviderServiceLocation,
//   foreignKey: "serviceProviderServiceId",
// });

// ServiceLocation.belongsToMany(ServiceProviderService, {
//   through: ServiceProviderServiceLocation,
//   foreignKey: "locationId",
// });

ServiceProviderService.hasMany(ServiceLocation, { foreignKey: "serviceProviderServiceId" });
ServiceLocation.belongsTo(ServiceProviderService, { foreignKey: "serviceProviderServiceId" });

// ===== ServiceProviderService -> Schedule =====
ServiceProviderService.hasMany(ServiceSchedules, { foreignKey: "serviceProviderServiceId" });
ServiceSchedules.belongsTo(ServiceProviderService, { foreignKey: "serviceProviderServiceId" });

// ===== KYC -> KycImages =====
Kyc.hasMany(KycImages, { foreignKey: "kycId" });
KycImages.belongsTo(Kyc, { foreignKey: "kycId" });

// ===== User -> KYC =====
User.hasOne(Kyc, { foreignKey: "userId" });
Kyc.belongsTo(User, { foreignKey: "userId" });

// ===== BusinessAccount -> KYC (polymorphic via entityType and entityId) =====
BusinessAccount.hasMany(Kyc, { foreignKey: "entityId", constraints: false, scope: { entityType: "BusinessAccount" } });
Kyc.belongsTo(BusinessAccount, { foreignKey: "entityId", constraints: false, targetKey: "id" });

Room.hasMany(RoomImages, { foreignKey: "roomId" });
RoomImages.belongsTo(Room, { foreignKey: "roomId" });

Gharbeti.hasMany(Room, { foreignKey: "gharbetiId" });
Room.belongsTo(Gharbeti, { foreignKey: "gharbetiId" });


// booking relation with bids, serviceprovider and users


Booking.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Booking, { foreignKey: "userId" });

ServiceSchedules.hasMany(Booking, { foreignKey: "serviceScheduleId" });
Booking.belongsTo(ServiceSchedules, { foreignKey: "serviceScheduleId" });

Booking.belongsTo(ServiceProviderService, { foreignKey: "serviceProviderServiceId" });
ServiceProviderService.hasMany(Booking, { foreignKey: "serviceProviderServiceId" });


Booking.hasMany(Bid, { foreignKey: "bookingId" });
Bid.belongsTo(Booking, { foreignKey: "bookingId" });

User.hasMany(Bid, { foreignKey: "userId" });
Bid.belongsTo(User, { foreignKey: "userId" });

Package.hasMany(Booking, { foreignKey: "packageId" });
Booking.belongsTo(Package,{foreignKey:"packageId"});


// province district and municpal relations

District.hasMany(Municipal, { foreignKey:'district_code',sourceKey:'district_code' });
Municipal.belongsTo(District, { foreignKey:'district_code', targetKey:'district_code' });

// Optional: Municipal → User
User.belongsTo(Municipal, { foreignKey: 'municipal_code', targetKey: 'municipal_code' });
Municipal.hasMany(User, { foreignKey: 'municipal_code', sourceKey: 'municipal_code' });



Province.hasMany(District, { foreignKey: 'province_code', sourceKey: 'province_code' });
District.belongsTo(Province, { foreignKey: 'province_code', targetKey: 'province_code' });



// payment system

User.hasOne(PaymentAccount, { foreignKey: "userId" });
PaymentAccount.belongsTo(User, { foreignKey: "userId" });

Esewa.hasOne(PaymentAccount, { foreignKey: "esewaId" });
PaymentAccount.belongsTo(Esewa, { foreignKey: "esewaId" });

Khalti.hasOne(PaymentAccount, { foreignKey: "khaltiId" });
PaymentAccount.belongsTo(Khalti, { foreignKey: "khaltiId" });

Bank.hasOne(PaymentAccount, { foreignKey: "bankId" });
PaymentAccount.belongsTo(Bank, { foreignKey: "bankId" });


// actual payment 

Bid.hasOne(PaymentActual, { foreignKey: "bidId" });
PaymentActual.belongsTo(Bid, { foreignKey: "bidId" });

Booking.hasOne(PaymentActual, { foreignKey: "bookingId" });
PaymentActual.belongsTo(Booking, { foreignKey: "bookingId" });


// rating

Booking.hasMany(Rating,{foreignKey:"bookingId"})
Rating.belongsTo(Booking,{foreignKey:"bookingId"})



// paymentrecords 

PaymentAccount.hasMany(PaymentRecords,{foreignKey:"paymentAccountId"});
PaymentRecords.belongsTo(PaymentAccount,{foreignKey:"paymentAccountId"});

Booking.hasMany(PaymentRecords,{foreignKey:"bookingId"});
PaymentRecords.belongsTo(Booking,{foreignKey:"bookingId"});




// room payment

RoomPayment.belongsTo(Room, { foreignKey: "roomId" });
Room.hasMany(RoomPayment, { foreignKey: "roomId" });

User.hasMany(RoomPayment, { foreignKey: "userId" });
RoomPayment.belongsTo(User, { foreignKey: "userId" });

// ===== JOB RELATIONSHIPS =====
// Job -> User (creator)
Job.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(Job, { as: 'jobs', foreignKey: 'created_by' });

// JobResponse -> Job
JobResponse.belongsTo(Job, { foreignKey: 'job_id' });
Job.hasMany(JobResponse, { as: 'responses', foreignKey: 'job_id' });

// JobResponse -> User
JobResponse.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(JobResponse, { as: 'jobResponses', foreignKey: 'user_id' });

// UserLocation -> User
UserLocation.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(UserLocation, { as: 'locations', foreignKey: 'user_id' });

// BusinessAccount -> User
BusinessAccount.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(BusinessAccount, { as: 'businessAccount', foreignKey: 'user_id' });

// BusinessAccount -> WebsiteBuilder (One-to-Many)
BusinessAccount.hasMany(WebsiteBuilder, { foreignKey: 'business_account_id', as: 'websites' });
WebsiteBuilder.belongsTo(BusinessAccount, { foreignKey: 'business_account_id' });

// ===== WORKER PROFILE RELATIONSHIPS =====
// User -> WorkerProfile (One-to-One)
User.hasOne(WorkerProfile, { foreignKey: 'user_id', as: 'workerProfile' });
WorkerProfile.belongsTo(User, { foreignKey: 'user_id' });

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    
    // Disable foreign key checks to allow cleanup
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete orphaned job records with non-existent created_by users
    // Only if tables exist
    // try {
    //   await sequelize.query(`
    //     DELETE FROM jobs 
    //     WHERE created_by IS NOT NULL 
    //     AND created_by NOT IN (SELECT id FROM users)
    //   `);
    // } catch (e) {
    //   // Table doesn't exist yet, skip cleanup
    //   if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
    // }
    
    // Delete orphaned job responses
    // Only if tables exist
    // try {
    //   await sequelize.query(`
    //     DELETE FROM job_responses 
    //     WHERE job_id IS NOT NULL 
    //     AND job_id NOT IN (SELECT id FROM jobs)
    //   `);
    // } catch (e) {
    //   // Table doesn't exist yet, skip cleanup
    //   if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
    // }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Now sync the database - use force: false to create if not exists
    await sequelize.sync({ alter: false, force: false });

    console.log("Database synced successfully");
  } catch (err) {
    
    console.error(" Database sync error:", err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    // Sequelize wraps DB errors in err.original or err.parent depending on version
    if (err && (err.original || err.parent)) {
      const orig = err.original || err.parent;
      console.error('DB error details:', orig);
      if (orig.sql) console.error('Failed SQL:', orig.sql);
    }
  }
};

syncDatabase();

module.exports = {
  sequelize,
  User,
  Role,
  Otp,
  ServiceProvider,
  Gharbeti,
  RoomImages,
  Service,
  Subcategory,
  Package,
  ServiceProviderService,
  ServiceDocument,
  ServiceImages,
  ServiceLocation,
  ServiceSchedules,
  Kyc,
  KycImages,
  Job,
  JobResponse,
  UserLocation,
  BusinessAccount,
  WebsiteBuilder,
  WorkerProfile,
};