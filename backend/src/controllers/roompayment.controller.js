require("dotenv").config();
const axios = require("axios");

const qs = require("qs");
const crypto = require("crypto");
const responses = require("../http/response");
const Room = require("../models/Room");
const RoomPayment = require("../models/RoomPayment");
const { Op } = require("sequelize");



const sequelize = require("../config/db");
const Gharbeti = require("../models/Gharbeti");
const { initiateEsewaPayment } = require("../services/esewaService");


const initiateRoomPayment = async (req, res) => {
  try {
    const { roomId } = req.params;
    const user = req.user; 

    if (!roomId) return responses.badRequest(res, "Room ID is required");

    const room = await Room.findByPk(roomId);
    if (!room) return responses.notFound(res, "Room not found");


    const existingPayment = await RoomPayment.findOne({
      where: {
        userId: user.id,
        roomId,
        status: "completed",
      },
    });

    if (existingPayment) {
      
      return responses.badRequest(res, "You already have access to this room");
    }


    let payment = await RoomPayment.findOne({
      where: {
        userId: user.id,
        roomId,
        status: "pending",
      },
    });


    const amount = 100;
    const paymentGateway = "esewa";

    if (!payment) {
      payment = await RoomPayment.create({
        userId: user.id,
        roomId,
        amount,
        status: "pending",
        paymentGateway,
      });
    }
    console.log("this is frontend url", process.env.FRONTEND_URL);


    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;
    const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;

    const transaction_uuid = `ROOM${roomId}_PAY${payment.id}_${Date.now()}`;
    const product_code = "EPAYTEST";
    const secretKey = "8gBm/:&EnhH.1/q";

    const signed_field_names = "total_amount,transaction_uuid,product_code";
    const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("base64");

    const success_url = `${process.env.FRONTEND_URL}/payment-success/esewa-room`;
    const failure_url = `${process.env.FRONTEND_URL}/payment-failure/esewa-room`;
    console.log("Success URL:", success_url);
    console.log("Failure URL:", failure_url);

    const paymentData = {
      amount: amount.toString(),
      tax_amount: tax_amount.toString(),
      total_amount: total_amount.toString(),
      transaction_uuid,
      product_code,
      product_service_charge: product_service_charge.toString(),
      product_delivery_charge: product_delivery_charge.toString(),
      success_url,
      failure_url,
      signature,
      signed_field_names,
      roomId,
    };

    const encodedData = qs.stringify(paymentData);


    const ESEWA_API_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    const esewaResponse = await axios.post(ESEWA_API_URL, encodedData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status === 200,
    });

    console.log("eSewa Response Headers:", esewaResponse);

    const redirectUrl = esewaResponse.headers?.location || esewaResponse.request?.res?.responseUrl;
    console.log("eSewa Redirect URL:", redirectUrl);
    if (!redirectUrl) {
      return responses.serverError(res, "Failed to get redirect URL from eSewa");
    }

    return responses.success(res, {
      message: "Room payment initiated successfully",
      redirect_url: redirectUrl,
      paymentId: payment.id,
      transaction_uuid,
      roomId,
    });
  } catch (err) {
    console.error("Error in initiateRoomPayment:", err);
    return responses.serverError(res, err.message || "Failed to initiate room payment");
  }
};



const payToAccessRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const user = req.user.id;

    const roomPayment = await RoomPayment.findOne({
      where: { roomId, userId: user, status: "completed" },
    });

    if (!roomPayment) {
      return res.status(402).json({
        success: false,
        message: "Payment required to access this room",
      });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const { contact, lat, lng } = room;

    // return data object in the `data` field and human message as the `message`
    return responses.success(res, { lat, lng, contact }, "Payment verified, access granted");
  } catch (err) {
    console.error("Error in payToAccessRoom:", err);
    return res.status(500).json({
      success: false,
      message: "Server error in payment verification",
      error: err.message,
    });
  }
};


const verifyRoomPayment = async (req, res) => {
  try {
    const {  payment_id } = req.body;

    if (!payment_id) {
      return responses.badRequest(res, "payment_id and transaction_uuid are required");
    }
    
    const roomPayment = await RoomPayment.findOne({
      where: {
        id: payment_id,
        userId: req.user.id,
        status: "pending",
      },
    });
    
    if (!roomPayment) {
      return responses.notFound(res, "Pending room payment not found");
    }
    
    roomPayment.status = "completed";
    roomPayment.paymentDate = new Date();
    await roomPayment.save();
    return responses.success(res, "Room payment verified successfully", {
      status: "COMPLETED",
    });
  }
  catch (err) {
    console.error("Error in verifyRoomPayment:", err);
    return responses.serverError(res, err.message || "Failed to verify room payment");
  }
};



// gharbeti room payment

const initiateGharbetiRoomPayment = async(req,res)=>{
  try{
    // const { gharbetiId } = req.params;
    const user = req.user;



    const gharbeti = await Gharbeti.findOne({ where: { userId: user.id } });

    if (!gharbeti) return responses.notFound(res, "Submit your kyc details to move further");

    if(gharbeti.is_paid){
      return responses.badRequest(res, "You have already paid for gharbeti dashboard access. You can access the dashboard");

    }
    const amount = 500;
    
    const roompayment = await RoomPayment.create({
        userId: user.id,
        roomId: null,
        amount,
        status: "pending",
        paymentGateway: "esewa",
    });


    const esewaResponse = await initiateEsewaPayment(roompayment);

    console.log("eSewa Response:", esewaResponse);

    if (!esewaResponse || esewaResponse.status !== "success") {
      return responses.serverError(res, "Failed to initiate eSewa payment");
    }

    const redirectUrl = esewaResponse?.redirectUrl || esewaResponse.request?.res?.responseUrl;

    if (!redirectUrl) {
      return responses.serverError(res, "Failed to get redirect URL from eSewa");
    }

    return responses.success(res, {
      message: "Gharbeti room payment initiated successfully",
      redirect_url: redirectUrl,
      paymentId: roompayment.id,
      transaction_uuid: roompayment.transaction_uuid,
      roomId: roompayment.roomId,
    });
  }
  catch(err){
    console.error("Error in initiateGharbetiRoomPayment:", err);
    return responses.serverError(res, err.message || "Failed to initiate gharbeti room payment");
  }
}


const verifyGharbetiRoomPayment = async (req, res) => {

  const { gharbetiId } = req.body;

  if (!gharbetiId) {
    return responses.badRequest(res, "Gharbeti ID is required");
  }

  try {
    const gharbetiPayment = await RoomPayment.findOne({
      where: {
        id: gharbetiId,
      },
    });

    if (!gharbetiPayment) {
      return responses.notFound(res, "Pending gharbeti payment not found");
    }

    gharbetiPayment.status = "completed";

    const gharbeti = await Gharbeti.findOne({ where: { userId: gharbetiPayment.userId } });
    gharbeti.is_paid = true;
    await gharbeti.save();
    gharbetiPayment.paymentDate = new Date();
    await gharbetiPayment.save();

    return responses.success(res, "Gharbeti payment verified successfully", {
      status: "COMPLETED",
    });
  } catch (err) {
    console.error("Error in verifyGharbetiRoomPayment:", err);
    return responses.serverError(res, err.message || "Failed to verify gharbeti payment");
  }
}

module.exports = { initiateRoomPayment, payToAccessRoom, verifyRoomPayment ,initiateGharbetiRoomPayment, verifyGharbetiRoomPayment};
