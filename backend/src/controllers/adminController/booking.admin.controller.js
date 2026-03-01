const Bid = require("../../models/Bid");
const Booking = require("../../models/Booking");
const User = require("../../models/User");
const ServiceSchedules = require("../../models/Schedule");
const Package = require("../../models/package");
const ServiceProviderServices = require("../../models/ServiceProviderService");
const Service = require("../../models/Services");
const ServiceProvider = require("../../models/ServiceProvider");
const { success } = require("../../http/response");
const messages = require("../../http/messages");

const getAcceptedBidsForAdmin = async (req, res) => {
  try {
    const acceptedBids = await Bid.findAll({
      where: { status: "accepted" },
      include: [
        {
          model: Booking,
          attributes: ["id", "status", "createdAt", "serviceScheduleId", "serviceProviderServiceId", "packageId"],
          include: [
            {
              model: User,
              attributes: ["id", "name", "email", "phone_number"]
            },
            {
              model: ServiceSchedules,
              attributes: ["id", "day_of_week", "start_time", "end_time"]
            },
            {
              model: Package,
              attributes: ["id", "name", "price"]
            },
            {
              model: ServiceProviderServices,
              attributes: ["id", "serviceProviderId"],
              include: [
                {
                  model: User, // the service provider's user info
                  attributes: ["id", "name", "email", "phone_number"]
                },
                {
                  model: Service,
                  attributes: ["id", "name"]
                }
              ]
            }
          ]
        },
        {
          model: User,
          attributes: ["id", "name", "email", "phone_number"] // who placed the bid
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json({
      status: "success",
      code: 200,
      message: "Accepted bids with full details fetched",
      data: acceptedBids
    });
  } catch (err) {
    console.error("this is err",err);
    res.status(500).json({ status: "error", message: "Failed to fetch accepted bids" });
  }
};



const getBookingsByStatusForAdmin = async (req, res) => {
  try {
    const statusQuery = req.query.status;
    const limitQuery = req.query.limit;
      const pageQuery = req.query.page;

    const statusFilter = statusQuery
      ? statusQuery.split(",").map((s) => s.trim().toLowerCase())
      : null;

  const limit = limitQuery ? parseInt(limitQuery, 10) : 8;
  const page = pageQuery ? Math.max(1, parseInt(pageQuery, 10)) : 1;

    const where = {};
    if (statusFilter) {
      where.status = statusFilter;
    }

    const offset = limit ? (page - 1) * limit : null;

    // get total count for pagination
    const total = await Booking.count({ where });

    const bookings = await Booking.findAll({
      where,
      attributes: [
        "id",
        "status",
        "serviceScheduleId",
        "serviceProviderServiceId",
        "packageId",
        "createdAt",
        "contact_number",
        "lat",
        "lng",
      ],
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: ServiceSchedules, attributes: ["id", "day_of_week", "start_time", "end_time"] },
        { model: Package, attributes: ["id", "name", "price"] },

        { model: Bid, attributes: ["id", "bidAmount", "status"], where: { status: "accepted" }, required: false },
        {
          model: ServiceProviderServices,
          attributes: ["id", "rate", "serviceProviderId"],
          include: [
            { model: ServiceProvider, attributes: ["id", "userId"], include: { model: User, attributes: ["id", "name", "email"] } },
            { model: Service, attributes: ["id", "name"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      ...(limit ? { limit, offset } : {}), 
    });

    console.log("this is bookings",bookings)


    const results = bookings.map((b) => {
  const user = b.User;
  const schedule = b.ServiceSchedule || b.ServiceSchedules || null;
  const contact_number = b.contact_number || null;
  const pkg = b.Package || null;
  const sps = b.ServiceProviderService || b.ServiceProviderServices || null;
  const serviceProviderUser = sps && sps.ServiceProvider ? sps.ServiceProvider.user : null;
  const service = sps && sps.Service ? sps.Service : null;

  const acceptedBid = Array.isArray(b.Bids) && b.Bids.length > 0 ? b.Bids[0] : null;
  const lat = b.lat !== undefined && b.lat !== null ? b.lat : null;
  const lng = b.lng !== undefined && b.lng !== null ? b.lng : null;

  const confirmedMoney = pkg
    ? pkg.price
    : acceptedBid
    ? acceptedBid.bidAmount
    : sps
    ? sps.rate
    : null;

  return {
    id: b.id,
    name: user ? user.name : null,
    service: service ? service.name : null,
    confirmed_money: confirmedMoney,
    confirmed_bid_amount: acceptedBid ? acceptedBid.bidAmount : null,
    contact_number: contact_number,
    schedule: schedule
      ? `${schedule.day_of_week || ""} ${schedule.start_time || ""}-${schedule.end_time || ""}`.trim()
      : null,
    serviceprovider: serviceProviderUser ? serviceProviderUser.name : null,
    serviceProviderEmail: serviceProviderUser ? serviceProviderUser.email : null,
    package: pkg ? pkg.name : null,
    status: b.status,
    lat,   
    lng,   
  };
});


  const totalPages = limit ? Math.max(1, Math.ceil(total / limit)) : 1;

  return res.json({ status: "success", code: 200, data: results, meta: { total, page, limit, totalPages } });
  } catch (err) {
    console.error("Error in getBookingsByStatusForAdmin:", err);
    return res.status(500).json({ status: "error", message: "Failed to fetch bookings" });
  }
};


const handleMarkAsComplete = async (req, res) => {
  try {
    const user = req.user;
    const bookingId= req.params.bookingId;
    console.log("this si eq.params",req.params)
    console.log("This is booking id",bookingId)

    const existBooking = await Booking.findOne({
      where:{
        id:bookingId
      }
    })

    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: ServiceProviderServices,
          include: [
            {
              model: ServiceProvider,
              attributes: ["id", "userId"], 
            },
          ],
        },
      ],
    });

    if (!existBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    console.log("This is booking",booking)
    const providerUserId =
      booking.ServiceProviderService?.ServiceProvider?.userId;

      console.log("this is serviceprovder",providerUserId)
    const serviceProvider = await ServiceProviderServices.findOne({
      where:{
        id:providerUserId
      }
    })

    console.log("the user id is",user.id)
  console.log("the booking user id is",booking.userId)
  
  console.log("the provider user id is",providerUserId)
    // Check authorization
    if (user.id !== booking.userId && user.id !== providerUserId) {
  return res.status(403).json({
    success: false,
    message: "You are not authorized",
  });
}


    // Determine who marked completion
    if (user.id === booking.userId) {
      if (booking.clientCompleted) {
        return res
          .status(400)
          .json({ success: false, message: "Client already marked as complete." });
      }
      booking.clientCompleted = true;
    } else if (user.id === providerUserId) {
      if (booking.providerCompleted) {
        return res
          .status(400)
          .json({ success: false, message: "Provider already marked as complete." });
      }
      booking.providerCompleted = true;
    }

    
    if (booking.clientCompleted && booking.providerCompleted) {
      booking.status = "completed";
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking completion status updated successfully.",
      data: {
        id: booking.id,
        status: booking.status,
        clientCompleted: booking.clientCompleted,
        providerCompleted: booking.providerCompleted,
      },
    });
  } catch (err) {
    console.error("Error in handleMarkAsComplete:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};






module.exports = { getAcceptedBidsForAdmin, getBookingsByStatusForAdmin,handleMarkAsComplete};
