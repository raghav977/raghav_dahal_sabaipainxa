const responses = require("../http/response");
const Gharbeti = require("../models/Gharbeti");
const Room = require("../models/Room");


const toggleRoomAvailability = async(req,res)=>{
  try{
    const user = req.user;
    let roomId = req.params.id;
    const {availability_status} = req.body;
    console.log("this is body:",req.body);
    console.log("This is availability status:",availability_status);

    if(availability_status===undefined){
        return responses.badRequest(res,"Availability status is required");
    }

    roomId = parseInt(roomId);
    if (isNaN(roomId)) return responses.badRequest(res, "Invalid Room ID");



    
    if (!user) return responses.unauthorized(res, "Login required");
    if(!roomId) return responses.badRequest(res,"Room ID is required");

    const gharbeti = await Gharbeti.findOne({ where: { userId: user.id } });
    if (!gharbeti) return responses.notFound(res, "Gharbeti profile not found");

    const room = await Room.findOne({where:{id:roomId,gharbetiId:gharbeti.id}});

    if(!room) return responses.notFound(res,"Room not found");

    if(availability_status !== true && availability_status !== false){
        return responses.badRequest(res,"Invalid availability status value");
    }

    if(room.availability_status === availability_status){
        return responses.badRequest(res,"Room is already in the desired availability status");
    }
    room.availability_status = availability_status;



    await room.save();

    return responses.success(res, {availability_status:room.availability_status}, "Room availability status toggled successfully");




  }
  catch(err){

    console.error("Error toggling room availability:", err);
    return responses.badRequest(res, err.message);

  }
}


const fetchRoomDetail = async(req,res)=>{
  try{
    const user = req.user;
    const roomId = req.params.id;

    if(!user) return responses.unauthorized(res,"Login required");
    if(!roomId) return responses.badRequest(res,"Room ID is required");
    
    const gharbeti = await Gharbeti.findOne({ where: { userId: user.id } });
    if (!gharbeti) return responses.notFound(res, "Gharbeti profile not found");
    const roomInstance = await Room.findOne({
      where: { id: roomId, gharbetiId: gharbeti.id },
      include: [{ model: require("../models/RoomImages"), attributes: ["id", "image_path"] }],
    });

    if (!roomInstance) return responses.notFound(res, "Room not found");

    // Normalize to plain object and map RoomImages -> images with path keys expected by frontend
    const room = roomInstance.toJSON ? roomInstance.toJSON() : roomInstance;
    room.images = Array.isArray(room.RoomImages)
      ? room.RoomImages.map((ri) => ({ id: ri.id, path: ri.image_path }))
      : [];
    delete room.RoomImages;

    // Return the normalized room as the data payload
    return responses.success(res, room, "Room details fetched successfully");

  } catch (err) {
    console.error("Error fetching room detail:", err);
    return responses.serverError(res, {}, err.message);
  }
}


module.exports = {toggleRoomAvailability,fetchRoomDetail};