const { parse } = require("dotenv");
const responses = require("../http/response");
const Gharbeti = require("../models/Gharbeti");
// import Gharbeti from "../models/Gharbeti";
const Room = require("../models/Room");
const RoomImages = require("../models/RoomImages");
const RoomPayment = require("../models/RoomPayment");

const BaseController = require("./baseController");

const { Op } = require("sequelize");
class GharbetiRoomController extends BaseController {
  constructor() {
    super(Room, {
      searchFields: ["name", "price", "note"],
      filterFields: ["availability_status"],
      defaultLimit: 10,
      defaultOrder: [["createdAt", "DESC"]],
    });
  }

  // 🔹 Create with room images
  async create(req, res) {
    console.log("Request files:", req.files);
    try {
      const user = req.user;
      console.log("This is user",user);
      const gharbeti = await Gharbeti.findOne({ where: { userId: user.id } });
      if (!gharbeti) return responses.notFound(res, "Gharbeti profile not found.");

      console.log("This is request body:", req.body);

      const { name, lat, lng, contact, price, description, availability_status, note, originalRoomId } = req.body;

      // Basic validation: ensure required fields are present. For a reapply/update (originalRoomId provided)
      // we still require the core fields to be present in the payload (frontend pre-fills them).
      if (!name || !lat || !lng || !contact || !price)
        return responses.badRequest(res, "Name, lat, lng, contact, and price are required fields.");

      console.log("gharbetiid is:", gharbeti.id);
      console.log("name is :", name);
      console.log("lat is :", lat);
      console.log("lng is :", lng);
      console.log("contact is :", contact);
      console.log("price is :", price);
        console.log("description is :", description);
        console.log("availability_status is :", availability_status);
        console.log("note is :", note);
      // create room


      const availabilityBool = availability_status === "1" || availability_status === "true" || availability_status === true || availability_status === 1;

      // If originalRoomId is provided, treat this as a reapply/update flow: update existing room if it belongs to the user
      if (originalRoomId) {
        const existing = await Room.findByPk(originalRoomId, { include: [{ model: RoomImages, attributes: ["id", "image_path"] }] });
        if (!existing) return responses.notFound(res, "Original room not found for reapply.");
        if (existing.gharbetiId !== gharbeti.id) return responses.unauthorized(res, "You don't have permission to modify this room.");

        // update fields
        await existing.update({
          name,
          price,
          description,
          status: "pending", 
          availability_status: availabilityBool,
          note,
          contact,
          lat,
          lng,
        });

        // handle uploaded images (append)
        if (req.files && req.files.length > 0) {
          const imagesData = req.files.map((file) => ({
            roomId: existing.id,
            image_path: `/uploads/rooms/${file.filename}`,
          }));
          await RoomImages.bulkCreate(imagesData);
        }

        const updatedRoom = await Room.findByPk(existing.id, {
          include: [{ model: RoomImages, attributes: ["id", "image_path"] }],
        });

        return res.status(200).json({ room: updatedRoom, message: "Room re-applied/updated successfully" });
      }

      // Creation flow: prevent duplicate rooms with same name+lat+lng for this gharbeti
      const duplicateRoom = await Room.findOne({
        where: { gharbetiId: gharbeti.id, name, lat, lng },
      });

      if (duplicateRoom) {
        return responses.badRequest(res, "A room with the same name and location already exists.");
      }

      const room = await Room.create({
        gharbetiId: gharbeti.id,
        name,
        price,
        description,
        availability_status: availabilityBool,
        note,
        contact,
        lat,
        lng,
      });

      console.log("Room created?",room);

      // handle uploaded images
      if (req.files && req.files.length > 0) {
        const imagesData = req.files.map((file) => ({
          roomId: room.id,
          image_path: `/uploads/rooms/${file.filename}`,
        }));
        await RoomImages.bulkCreate(imagesData);
      }

      // include images in response
      const roomWithImages = await Room.findByPk(room.id, {
        include: [{ model: RoomImages,attributes: ["id", "image_path"] }],
      });

      return res.status(201).json({ room: roomWithImages, message: "Room created successfully" });
    } catch (err) {
      console.error("Error in create room:", err);
      return responses.serverError(res, err.message);
    }
  }

  // 🔹 Retrieve a single room with images
  async retrieve(req, res) {
    try {
      const room = await Room.findByPk(req.params.id, {
        include: [{ model: RoomImages, attributes: ["id", "image_path"] }],
      });
      if (!room) return responses.notFound(res, "Room not found.");
      return res.json(room);
    } catch (err) {
      console.error("Error fetching room:", err);
      return responses.serverError(res, {}, err.message);
    }
  }

  // 🔹 Update room + optionally add new images
  async update(req, res) {
    try {
      const room = await Room.findByPk(req.params.id);
      if (!room) return responses.notFound(res, "Room not found.");

      await room.update(req.body);

      if (req.files && req.files.length > 0) {
        const imagesData = req.files.map((file) => ({
          roomId: room.id,
          image_path: `/uploads/rooms/${file.filename}`,
        }));
        await RoomImages.bulkCreate(imagesData);
      }

      const updatedRoom = await Room.findByPk(room.id, {
        include: [{ model: RoomImages, attributes: ["id", "image_path"] }],
      });

      return res.json(updatedRoom);
    } catch (err) {
      console.error("Error updating room:", err);
      return responses.serverError(res, {}, err.message);
    }
  }

  
  async delete(req, res) {
    try {
      const user = req.user; 
      if (!user) return responses.unauthorized(res, "Login required");



      const gharbeti = await Gharbeti.findOne({ where: { userId: user.id } });
      if (!gharbeti) return responses.notFound(res, "Gharbeti profile not found");

      const room = await Room.findByPk(req.params.id);
      if (!room) return responses.notFound(res, "Room not found.");

      // delete images first
      await RoomImages.destroy({ where: { roomId: room.id } });

      // delete room
      await room.destroy();

      return res.status(204).json({
        message: "Room and associated images deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting room:", err);
      return responses.serverError(res, {}, err.message);
    }
  }

  async list(req, res) {
  try {
    const user = req.user;
    if (!user) return responses.unauthorized(res, "Login required");

    const gharbeti = await Gharbeti.findOne({ where: { userId: user.id } });
    if (!gharbeti) return responses.notFound(res, "Gharbeti profile not found");

    const limit = parseInt(req.query.limit) || this.defaultLimit;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;
    const ordering = req.query.ordering || null;

    const where = { gharbetiId: gharbeti.id };

    // ✅ Search support
    if (search && this.searchFields.length > 0) {
      where[Op.or] = this.searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }

    // ✅ Filters — skip invalid or “all”
    this.filterFields.forEach((field) => {
      const value = req.query[field];
      if (value !== undefined && value !== "all") {
        // If it's the availability_status, cast to boolean
        if (field === "availability_status") {
          where[field] = value === "true" || value === true;
        } else {
          where[field] = value;
        }
      }
    });

    // ✅ Ordering
    let order = this.defaultOrder;
    if (ordering) {
      const orderFields = ordering.split(",");
      order = orderFields.map((field) =>
        field.startsWith("-") ? [field.substring(1), "DESC"] : [field, "ASC"]
      );
    }

    console.log("Listing rooms with where:", where, "order:", order, "limit:", limit, "offset:", offset);

    // ✅ Query rooms
    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [{ model: RoomImages, attributes: ["id", "image_path"] }],
    });

    // ✅ Respond
    res.json({
      total: count,
      limit,
      offset,
      results: rows,
      next: offset + limit < count ? offset + limit : null,
      previous: offset - limit >= 0 ? offset - limit : null,
    });
  } catch (err) {
    console.error("Error listing rooms:", err);
    return responses.serverError(res, err.message);
  }
}


}











module.exports = new GharbetiRoomController();
