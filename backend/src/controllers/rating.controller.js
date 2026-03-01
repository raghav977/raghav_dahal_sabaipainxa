


const Booking = require("../models/Booking");
const PaymentActual = require("../models/PaymentActual");
const Rating = require("../models/Rating");
const ServiceProvider = require("../models/ServiceProvider");
const ServiceProviderServices = require("../models/ServiceProviderService");
const { getUserRole } = require("../services/userServices");


const submitRating = async (req, res) => {
  try {
    const { bookingId, rating, ratingType, comment } = req.body;
    const user = req.user;

    if (!bookingId || !rating || !ratingType) {
      return res
        .status(400)
        .json({ message: "Booking ID, rating and rating type are required" });
    }

    // Fetch booking and related provider
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

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const providerUserId =
      booking.ServiceProviderService?.ServiceProvider?.userId;

    // Authorization check: Only client or provider can rate
    if (user.id !== booking.userId && user.id !== providerUserId) {
      return res.status(403).json({
        message: "You are not authorized to rate this booking.",
      });
    }

    // Check payment status
    const payment = await PaymentActual.findOne({
      where: { bookingId, status: "completed" },
    });

    if (!payment) {
      return res.status(400).json({
        message: "Payment not completed for this booking. Cannot rate.",
      });
    }

    const existingRating = await Rating.findOne({
      where: {
        bookingId,
      },
    });

    if(user.id==booking.userId){
        booking.clientCompleted=true;
    }
    if(user.id==providerUserId){
        booking.providerCompleted=true;
    }
    await booking.save();

    if (existingRating) {
      return res
        .status(400)
        .json({ message: "You have already rated this booking." });
    }


    const newRating = await Rating.create({
      bookingId,
      rating,
      ratingType,
      comment: comment,
    });
    booking.status="completed";
    await booking.save();


    return res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      data: newRating,
    });
  } catch (err) {
    console.error("Error in submitRating:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while creating rating",
      error: err.message,
    });
  }

};


const getRating = async(req,res)=>{
    try{
        const {bookingId}=req.params;

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

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

   
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const rating = await Rating.findOne({ where: { bookingId } });

        if(!rating){
            return res.status(404).json({message:"Rating not found for this booking"});
        }

        const user = req.user;
        const providerUserId = booking.ServiceProviderService?.ServiceProvider?.userId;
        console.log("Provider User ID:", providerUserId);
        console.log("Booking User ID:", booking.userId);
        console.log("Requesting User ID:", user.id);
        const userRole = await getUserRole(user);

        // Authorization check: Only client or provider can view rating or admin
        if (user.id !== booking.userId && user.id !== providerUserId) {
          return res.status(403).json({
            message: "You are not authorized to view this rating.",
          });
        }
        return res.status(200).json({success:true, data:rating});

        

    }
    catch(err){


    }
}


module.exports={submitRating,getRating};