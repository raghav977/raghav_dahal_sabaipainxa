
const responses = require("../http/response");
const Bid = require("../models/Bid");
const Booking = require("../models/Booking");
const ServiceProvider = require("../models/ServiceProvider");
const ServiceProviderServices = require("../models/ServiceProviderService");
const Service = require("../models/Services");
const User = require("../models/User");

const getProviderDashboardMetricsData = async(req,res)=>{

        const user = req.user;
        try{
            const provider = await ServiceProvider.findOne({where: {userId: user.id}});
            if(!provider){
                return responses.notFound(res,{}, "Service provider profile not found.");
            }

            const totalServices = await ServiceProviderServices.count({where: {serviceProviderId: provider.id}});


          // Total bookings for this provider
const totalBookings = await Booking.count({
  include: {
    model: ServiceProviderServices,   // related model                   // alias from Booking.belongsTo(ServiceProviderServices)
    required: true,                    // inner join
    where: { serviceProviderId: provider.id } // filter on service provider
  }
});

// Pending bookings for this provider
const pendingBookings = await Booking.count({
  where: { status: 'pending' },
  include: {
    model: ServiceProviderServices,
    required: true,
    where: { serviceProviderId: provider.id }
  }
});

// Recent 5 bookings for this provider
const recentBookings = await Booking.findAll({
  include: [
    {
      model: ServiceProviderServices,
      as: 'ServiceProviderService',
      attributes: ['id', 'rate', 'description', 'serviceId'],
      required: true,
      where: { serviceProviderId: provider.id },
      include: [
        {
          model: Service,
          attributes: ['id', 'name'], // gives service name
        },
      ],
    },
    {
      model: User,

      attributes: ['id', 'name', 'email']
    },
    {
      model: Bid,

      required: false,
      where: { status: 'accepted' },
      attributes: ['id', 'bidAmount', 'userId', 'status']
    }
  ],
  order: [['createdAt', 'DESC']],
  limit: 5,
  attributes: ['id', 'status', 'contact_number', 'createdAt']
});




            return responses.success(res,{
                totalServices,
                totalBookings,
                recentBookings

            },"Provider dashboard metrics data fetched successfully.");
        }


    catch(err){
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });

    }
}

module.exports = {
    getProviderDashboardMetricsData
}