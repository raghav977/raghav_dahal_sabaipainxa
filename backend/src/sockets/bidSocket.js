// src/sockets/bidSocket.js
const { sendNotification, deliverPendingNotifications } = require("../services/notificationService");
const { addOnlineUser, removeOnlineUser, emitToRoom, emitToUser } = require("./socketManager");
const Booking = require("../models/Booking");
const Bid = require("../models/Bid");
const User = require("../models/User");

const PaymentActual = require("../models/PaymentActual");
const ServiceProviderServices = require("../models/ServiceProviderService");
const ServiceProvider = require("../models/ServiceProvider");

const initBidSocket = (io) => {
  console.log("this is socket io",io)
  console.log("getting here");
  console.log("Socket.IO initialized");

  io.on("connection", async(socket) => {
    console.log("✅ User connected:", socket.id, "user:", socket.user?.id);

    const userId = socket?.user?.id;
    if (!socket.user || !socket.user.id) {
  console.warn("⚠️ No valid user in socket context — skipping action.");
  return;
}


    socket.join(`notification-${userId}`);

    console.log(`User ${userId} joined notification- ${userId}`)

    await deliverPendingNotifications(userId);

    socket.on(`join-booking-room`,({bookingId})=>{
      socket.join(`booking-${bookingId}`)

      console.log(`user ${userId} joined booking-${bookingId}`)
    })

    socket.on("help",({message})=>{
      console.log("hello",message)
    })


socket.on("place-bid", async ({ bookingId, bidAmount }) => {
      try {
        console.log("Place bid event by user:", socket.user?.id);
        
        console.log("Booking ID:", bookingId, "Bid Amount:", bidAmount, "User ID:", socket?.user?.id);
        if (!bookingId || !bidAmount || !userId) return socket.emit("error", { message: "Invalid bid data" });

        const booking = await Booking.findByPk(bookingId);
        if (!booking) return socket.emit("error", { message: "Booking not found" });

        console.log("Booking found:", booking.toJSON());

        const acceptedBid = await Bid.findOne({ where: { bookingId, status: "accepted" } });
        if (acceptedBid) return socket.emit("error", { message: "Bidding closed" });

        if(booking.status === "cancelled"){
          console.log("Booking is cancelled, cannot place bid");
          return socket.emit("error", { message: "Cannot bid on a cancelled booking" });
        }


        console.log("TYPE OF BOOKING USER ID",typeof(bookingId))

        let bookiningNum = parseInt(bookingId)

        console.log("Creating bid:", {
  bookingId: bookiningNum,
  userId: socket.user.id,
  bidAmount: bidAmount,
  status: "pending"
});
        const bid = await Bid.create({
          bookingId: bookiningNum,
          userId: socket.user?.id,
          bidAmount,
          status: "pending"
        });
        

        console.log("Bid created with ID:", bid.toJSON());
        const user = await User.findByPk(socket.user?.id);

        console.log("Bidding user:", user ? user.toJSON() : "User not found");

        // Notify booking owner
        await sendNotification(
          booking.userId,
          "New Bid Received",
          `${user?.username || "A user"} placed a bid of ${bidAmount} on your booking.`
        ); 

        // Emit to booking room
        emitToRoom(`booking-${bookingId}`, "new-bid", {
          ...bid.toJSON(),
          user: { id: user.id, name: user.username || user.name }
        });

        console.log("this is user id",userId)
        console.log("✅ New bid placed:", bid.id);
      } catch (err) {
        console.error("❌ place-bid error:", err);
        socket.emit("error", { message: "Failed to place bid" });
      }
    });

    // Accept bid
    socket.on("accept-bid", async ({ bidId, bookingId }) => {
  try {
    const bid = await Bid.findByPk(bidId);
    if (!bid) return socket.emit("error", { message: "Bid not found" });
    

    if (bid.userId === socket.user.id) {
      return socket.emit("error", { message: "You cannot accept your own bid" });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return socket.emit("error", { message: "Booking not found" });

    const serviceProviderServiceId = booking.serviceProviderServiceId;

    const serviceProviderService = await ServiceProviderServices.findByPk(serviceProviderServiceId);
    console.log("service provider service",serviceProviderService)

    const serviceProviderId = serviceProviderService.serviceProviderId;
    console.log("service provider id",serviceProviderId)
    const serviceProviderUser = await ServiceProvider.findByPk(serviceProviderId);
    console.log("service provider user id",serviceProviderUser.userId)

    console.log("booking user id and socket user id",booking.userId,socket.user.id)
    console.log("booking service provider id and socket user id",serviceProviderId,socket.user.id)
    if (booking.userId !== socket.user.id && serviceProviderUser.userId !== socket.user.id) {
      return socket.emit("error", { message: "Not authorized to accept bid" });
    }

    if (bid.status === "accepted") return socket.emit("error", { message: "Bid already accepted" });
    if (booking.status === "confirmed") return socket.emit("error", { message: "Booking already confirmed" });
    if(booking.status === "cancelled"){
      console.log("Booking is cancelled, cannot accept bid");
      return socket.emit("error", { message: "Cannot accept bid on a cancelled booking" });
    }
    booking.status = "confirmed";
    await booking.save();

    bid.status = "accepted";
    await bid.save();

    // Create a PaymentActual record for the accepted bid

    const payment = await PaymentActual.create({
      bidId: bid.id,
      amount: bid.bidAmount,
      status: "pending",
      bookingId: booking.id
    })

    console.log("Payment record created for bid:", payment.toJSON());

    // Notify bidder
    await sendNotification(
      booking.userId,
      "Bid Accepted",
      `Your bid of ${bid.bidAmount} on booking #${booking.id} has been accepted.`
    );
    
    // Emit updates
    emitToUser(booking.userId, "bid-accepted", { bid });
    emitToRoom(`booking-${bookingId}`, "bid-accepted", { bid, bookingStatus: "confirmed" });

  } catch (err) {
    console.error("accept-bid error:", err);
    socket.emit("error", { message: "Failed to accept bid" });
  }
});


    // Reject bid
    socket.on("decline-bid", async ({ bidId, bookingId }) => {
  try {
    const bid = await Bid.findByPk(bidId);
    if (!bid) return socket.emit("error", { message: "Bid not found" });

   
    if (bid.userId === socket.user.id) {
      return socket.emit("error", { message: "You cannot decline your own bid" });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return socket.emit("error", { message: "Booking not found" });


    if (booking.userId !== socket.user.id) {
      return socket.emit("error", { message: "Not authorized to decline bid" });
    }
    if(booking.status === "cancelled"){
      console.log("Booking is cancelled, cannot decline bid");
      return socket.emit("error", { message: "Cannot decline bid on a cancelled booking" });
    }

    if (bid.status === "rejected") return socket.emit("error", { message: "Bid already rejected" });

    bid.status = "rejected";
    await bid.save();

    emitToUser(booking.userId, "bid-rejected", { bid });
    emitToRoom(`booking-${bookingId}`, "bid-rejected", { bid });

  } catch (err) {
    console.error("decline-bid error:", err);
    socket.emit("error", { message: "Failed to reject bid" });
  }
});


    socket.on("disconnect", () => {
      removeOnlineUser(socket.id);
      console.log("❎ User disconnected:", socket.id);
    });
  });
};

module.exports = { initBidSocket };
