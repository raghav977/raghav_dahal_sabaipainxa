// controllers/ListRoomPublicController.js
const { Op } = require("sequelize");
const Room = require("../models/Room");
const RoomImages = require("../models/RoomImages");
const RoomPayment = require("../models/RoomPayment");
const { literal } = require("sequelize");


async function ListRoomPublicController(req, res) {
  try {
    const {
      search,
      location,
      minPrice,
      maxPrice,
      limit = 10,
      offset = 0,
      ordering = "-createdAt",
      latitude,
      longitude,
      radius = 5,
    } = req.query;

    console.log("Query params:", req.query);


    const safeLimit = Math.min(parseInt(limit, 10) || 10, 50);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);


    const where = { availability_status: true, status: "pending",is_active:true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Ordering
    const allowedOrderFields = ["createdAt", "price", "name"];
    const isDesc = ordering.startsWith("-");
    const orderField = ordering.replace(/^-/, "");
    const finalField = allowedOrderFields.includes(orderField)
      ? orderField
      : "createdAt";
    const order = [[finalField, isDesc ? "DESC" : "ASC"]];

    // Exclude sensitive attributes
    const excludeAttributes = [
      "contact",


      "note",
      "rejection_reason",
      "updatedAt",
      "description",
    ];

    // Fetch rooms from DB
    let rooms = await Room.findAll({
      where,
      attributes: { exclude: excludeAttributes },
      include: [{ model: RoomImages, attributes: ["id", "image_path"] }],
      order,
    });

    // Distance filter (Haversine)
    if (latitude && longitude) {
      const R = 6371; // km
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);

      rooms = rooms.filter((room) => {
        console.log("this is room",room)
        console.log("Room coordinates:", room.lat, room.lng);
        if (!room.lat || !room.lng) return false;

        const dLat = ((room.lat - userLat) * Math.PI) / 180;
        const dLng = ((room.lng - userLng) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((room.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;

        const distance = 2 * R * Math.asin(Math.sqrt(a));
        room.lat=0
        room.lng=0
        return distance <= parseFloat(radius);
      });
    }

    // Pagination
    const total = rooms.length;
    const paginatedRooms = rooms.slice(safeOffset, safeOffset + safeLimit);

    console.log("Filtered rooms count:", total);

    return res.json({
      success: true,
      message: "Public room listings fetched successfully",
      total,
      limit: safeLimit,
      offset: safeOffset,
      results: paginatedRooms,
      next: safeOffset + safeLimit < total ? safeOffset + safeLimit : null,
      previous: safeOffset - safeLimit >= 0 ? safeOffset - safeLimit : null,
    });
  } catch (error) {
    console.error("Error fetching public rooms:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching public rooms",
      error: error.message,
    });
  }
}



async function DetailRoomPublicController(req, res) {
  try {
    const { roomId } = req.params;

    const excludeAttributes = ["contact", "lat", "lng", "note", "rejection_reason", "updatedAt"];
    const room = await Room.findOne({
      where: { id: roomId, availability_status: true, status: "pending" },
      attributes: { exclude: excludeAttributes },
      include: [{ model: RoomImages, attributes: ["id", "image_path"] }],
    });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found or not available",
      });
    }
    return res.json({
      success: true,
      message: "Room details fetched successfully",
      data: room,
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching room details",
      error: error.message,
    });
  }
}

module.exports = {
    ListRoomPublicController,
    DetailRoomPublicController,
};
