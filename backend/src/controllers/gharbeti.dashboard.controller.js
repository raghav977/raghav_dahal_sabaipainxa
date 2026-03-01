const responses = require("../http/response");
const Gharbeti = require("../models/Gharbeti");
const Room = require("../models/Room");





const getDataForGharbetiDashboard = async (req, res) => {
  try {
    const user = req.user;

    const gharbeti = await Gharbeti.findOne({ where: { userId: user.id } });
    if (!gharbeti) {
      return responses.notFound(res, "Gharbeti profile not found");
    }

    const totalRooms = await Room.count({ where: { gharbetiId: gharbeti.id } });
    const verifiedRooms = await Room.count({ where: { gharbetiId: gharbeti.id,status:"approved"} });
    const blockedRooms = await Room.count({ where: { gharbetiId: gharbeti.id, is_active: false } });
    const unverifiedRooms = totalRooms - verifiedRooms;

    return responses.success(res, {
      totalRooms,
      verifiedRooms,
      blockedRooms,
      unverifiedRooms,
    }, "Gharbeti dashboard data fetched successfully");

  }
  catch(err){
    console.error(err);
    return responses.badRequest(res, "An error occurred while fetching Gharbeti dashboard data");
  }


}

module.exports = {
  getDataForGharbetiDashboard,
};