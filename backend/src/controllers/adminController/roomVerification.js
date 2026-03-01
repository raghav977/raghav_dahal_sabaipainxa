
const { Op } = require("sequelize");
const Room = require("../../models/Room");
const Gharbeti = require("../../models/Gharbeti");
const RoomImages = require("../../models/RoomImages");
const responses = require("../../http/response");
const RoomPayment = require("../../models/RoomPayment");
const User = require("../../models/User");

class RoomVerificationController {
  constructor() {}


  async list(req, res) {
    try {
      const { status, limit = 10, offset = 0 } = req.query;

      const where = {};
      if (status) where.status = status;

      const rooms = await Room.findAndCountAll({
        where,
        attributes: { exclude: ["contact", "description", "lat", "lng"] },
        include: [
          {
            model: Gharbeti,
            attributes: ["id", "is_verified"],
            include: [
              {
                model: User,
                attributes: ["id", "name", "email"]
              }
            ]
          },
          {
            model: RoomImages,
           
            attributes: ["id", "image_path"]
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });



      const results = rooms.rows.map(room => ({
  roomId: room.id,
  roomname: room.name,
  roomimages: room.RoomImages?.map(d => d.image_path)[0] || [], 
  gharbetiname: room.Gharbeti?.user?.name || "N/A",
  isAvailable: room.availability_status,
  price: room.price,
  lat:room.lat,
  lng:room.lng,
  contact: room.contact,
  createdAt: room.createdAt,
  status: room.status,
  reapplied: !!room.reapplied,
  providerVerified: !!room.providerVerified,
}));

      return res.json({
        total: rooms.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        results
      });

    } catch (err) {
      console.error("Error fetching rooms:", err);
      return responses.serverError(res, {}, err.message);
    }
  }


  async approveRoom(req, res) {
    try {
      const room = await Room.findByPk(req.params.id);
      if (!room) return responses.notFound(res, "Room not found.");

      room.status = "approved";
      await room.save();

      return res.json({ room, message: "Room approved successfully." });
    } catch (err) {
      console.error("Error approving room:", err);
      return responses.serverError(res, {}, err.message);
    }
  }


  async rejectRoom(req, res) {
    try {
      const room = await Room.findByPk(req.params.id);
      if (!room) return responses.notFound(res, "Room not found.");
      const { rejection_reason } = req.body;
      if (!rejection_reason) {
        return responses.badRequest(res, "Rejection reason is required.");
      }
      room.status = "rejected";
      room.rejection_reason = rejection_reason;
      await room.save();
      return res.json({ room, message: "Room rejected successfully." });
    } catch (err) {
      console.error("Error rejecting room:", err);
      return responses.serverError(res, {}, err.message);
    }
  }
}


const getAllRoomPayments = async (req, res) => {
  try {
    const { type, status, userId, fromDate, toDate, page = 1, limit = 10 } = req.query;

    const where = {};
    const offset = (page - 1) * limit;

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (fromDate && toDate) {
      where.createdAt = { [Op.between]: [new Date(fromDate), new Date(toDate)] };
    }


    if (type === "gharbeti") where.roomId = null;
    else if (type === "viewer") where.roomId = { [Op.ne]: null };


    const { rows: payments, count: totalCount } = await RoomPayment.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Room, attributes: ["id", "name", "contact"], required: false },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formatted = payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user?.name || "N/A",
      userEmail: p.user?.email || "N/A",
      amount: p.amount,
      status: p.status,
      type: p.roomId ? "viewer" : "gharbeti",
      roomTitle: p.Room?.name || null,
      contact: p.Room?.contact || null,
      paymentDate: p.paymentDate,
      createdAt: p.createdAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return responses.success(res, {
      data: formatted,
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching payments:", err);
    return responses.serverError(res, "Failed to fetch payments");
  }
};


const getRoomDetail = async(req,res)=>{
  try{
    const id = req.params.id;
    const room = await Room.findByPk(id,{
      include:[
        {
          model:RoomImages,
          attributes:["id","image_path"]
        },
        {
          model:Gharbeti,
          attributes:["id"],
          include:[
            {
              model:User,
              attributes:["id","name","email"]
            }
          ]
        }
      ]
    });

    if(!room){
      return responses.notFound(res,"Room not found");
    }

    return responses.success(res,room,"Room details fetched successfully");

  }
  catch(err){
    console.error("Error fetching room details:", err);
    return responses.badRequest(res,"Failed to fetch room details");

  }
}

module.exports = { RoomVerificationController, getAllRoomPayments, getRoomDetail };
