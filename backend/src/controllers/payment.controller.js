require("dotenv").config();
const responses = require("../http/response");
const Bank = require("../models/Bank");
const Esewa = require("../models/Esewa");
const Khalti = require("../models/Khalti");
const PaymentAccount = require("../models/Payment");
const sequelize = require("../config/db");
const Booking = require("../models/Booking");
const PaymentActual = require("../models/PaymentActual");
const Bid = require("../models/Bid");
const User = require("../models/User");

// const {esewaClient} = require("esewa-js")


const qs = require("querystring");


const axios = require("axios");


const crypto = require("crypto");
const ServiceProvider = require("../models/ServiceProvider");
const { ServiceProviderService } = require("../database/relation");
const paymentRecords = require("../models/PaymentRecords");
// const paymentRecords = require("../models/PaymentRecords");
// const paymentRecords = require("../models/PaymentRecords");

const createPaymentAccount = async (req, res) => {
  const transaction = await sequelize.transaction();
  const user = req.user;

  try {
    const { esewa_id, khalti_id, account_number, account_holder_name, bank_name } = req.body;

    if (!esewa_id && !khalti_id && !account_number && !account_holder_name && !bank_name) {
      return responses.badRequest(res, "At least one payment method is required");
    }

    const existingAccount = await PaymentAccount.findOne({ where: { userId: user.id } });
    if (existingAccount) {
      return responses.conflict(res, "Payment account already exists, either delete or update the existing one");
    }

    let esewaObj = null;
    let khaltiObj = null;
    let bankObj = null;

    // === ESEWA ===
    if (esewa_id) {
      const esewaIdStr = esewa_id.toString().trim();

      if (!/^\d{10}$/.test(esewaIdStr)) {
        return responses.badRequest(res, "Esewa ID must be a 10-digit number");
      }

      const existingEsewa = await Esewa.findOne({ where: { esewa_id: esewaIdStr } });
      if (existingEsewa) {
        return responses.conflict(res, "Esewa for this number already exists");
      }

      esewaObj = await Esewa.create(
        { esewa_id: esewaIdStr, status: "verified" },
        { transaction }
      );
    }


    if (khalti_id) {
      const existingKhalti = await Khalti.findOne({ where: { khalti_id } });
      if (existingKhalti) {
        return responses.conflict(res, "Khalti for this number already exists");
      }

      khaltiObj = await Khalti.create(
        { khalti_id, status: "pending" },
        { transaction }
      );
    }

    // === BANK ===
    if (account_number && account_holder_name && bank_name) {
      const existingBank = await Bank.findOne({ where: { account_number } });
      if (existingBank) {
        return responses.conflict(res, "The bank account with this number already exists");
      }

      bankObj = await Bank.create(
        { bank_name, account_holder_name, account_number },
        { transaction }
      );
    }

    const paymentAccount = await PaymentAccount.create(
      {
        userId: user.id,
        esewaId: esewaObj ? esewaObj.id : null,
        khaltiId: khaltiObj ? khaltiObj.id : null,
        bankId: bankObj ? bankObj.id : null,
        status: "active",
      },
      { transaction }
    );

    await transaction.commit();
    console.log("Transaction committed successfully");

    return responses.created(res, "Payment account created successfully", paymentAccount);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating payment account:", error);
    return responses.badRequest(res, "Error creating payment account");
  }
};


const fetchPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const user = req.user;

    if (!bookingId) {
      return responses.badRequest(res, "Booking id is required");
    }

    // Fetch booking first
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return responses.notFound(res, "Booking not found");
    }

    // Authorization: only booking owner can see payment
    if (booking.userId !== user.id) {
      return responses.unauthorized(res, "You are not authorized to view this payment");
    }

    // Fetch the payment via bid → booking
    const payment = await PaymentActual.findOne({
      include: [
        {
          model: Bid,
          where: { bookingId }, 
          attributes: ["id", "bidAmount", "status", "userId", "bookingId"],
          include: [
            {
              model: User,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return responses.notFound(res, "No payment found for this booking");
    }

    return responses.success(res, "Payment fetched successfully", payment);
  } catch (err) {
    console.error("Error fetching payment status:", err);
    return responses.badRequest(res, "Error fetching payment status");
  }
};





// INITIATING THE PAYMENT



const initiatePayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const user = req.user;

    if (!bookingId) {
      return responses.badRequest(res, "Booking ID is required");
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return responses.notFound(res, "Booking not found");
    }
    if (booking.userId !== user.id) {
      return responses.unauthorized(res, "Not authorized to pay for this booking");
    }

    if (booking.status !== "confirmed") {
      return responses.badRequest(res, "Payment can only be initiated for confirmed bookings");
    }

    // Fetch existing payment if any
    let payment = await PaymentActual.findOne({ where: { bookingId } });
    console.log("thisis request.body",req.body)
    const { amount, paymentGateway, bidId } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return responses.badRequest(res, "A valid amount greater than 0 is required");
    }

    if (paymentGateway !== "esewa") {
      return responses.badRequest(res, "Currently only 'esewa' payment is supported");
    }


    if (payment) {
      if (payment.status === "completed") {
        return responses.badRequest(res, "Payment already completed for this booking");
      }
      if (payment.status === "pending") {
        console.log("Reusing existing pending payment:", payment.id);
      }
    } else {
      // Create a new payment
      payment = await PaymentActual.create({
        bookingId,
        bidId: bidId || null,
        status: "pending",
      });
    }


    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;
    const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;


    const transaction_uuid = `BOOKING${bookingId}_PAYMENT${payment.id}_${Date.now()}`;
    const product_code = "EPAYTEST"; 


    const success_url = `${process.env.FRONTEND_URL}/payment-success/esewa`;
    const failure_url = `${process.env.FRONTEND_URL}/payment-failure/esewa`;


   const signed_field_names = "total_amount,transaction_uuid,product_code";
const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
const secretKey = "8gBm/:&EnhH.1/q";
const signature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("base64");



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
    };

    console.log("Payment Data to be sent to eSewa:", paymentData);

    // const encodedData = qs.stringify(paymentData);


    const ESEWA_API_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    // const response = await axios.post(ESEWA_API_URL, paymentData, {
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   maxRedirects: 0,
    //   validateStatus: (status) => status === 302 || status === 200,
    // });
    // console.log("this is response form esewa ",response)

    const queryParams = new URLSearchParams(paymentData).toString();

        const response = await fetch(
            `https://rc-epay.esewa.com.np/api/epay/main/v2/form?${queryParams}`,
            {
                method: "POST",
            }
        );

        console.log("eSewa Response:", response);
    const redirectUrl = response.url;
    if (!redirectUrl) return responses.serverError(res, "Failed to get redirect URL from eSewa");

    console.log("Redirect URL from eSewa sandbox:", redirectUrl);

    return responses.success(res, {
      redirect_url: redirectUrl,
      message: "Payment initiated successfully",
      paymentId: payment.id,
      bookingId,
    });

  } catch (err) {
    console.error("initiatePayment error:", err.message);
    return responses.serverError(res, "Failed to initiate payment");
  }
};

// const initiatePayment = async (req, res) => {
//     const { amount,bidId,paymentGateway } = req.body;

//     const transactionUuid = uuid();
//     const ESEWA_PRODUCT_CODE = "EPAYTEST";
//     const secretKey = "8gBm/:&EnhH.1/q";
//     const signed_field_names = "total_amount,transaction_uuid,product_code";

//     const generateSignature = (data, secret) => {
//         const hmac = crypto.createHmac("sha256", secret);
//         hmac.update(data);
//         return hmac.digest("base64");
//     };

//     const signature = generateSignature(
//         `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`,
//         secretKey
//     );

//     const esewaConfig = {
//         amount,
//         tax_amount: 0,
//         total_amount: amount,
//         transaction_uuid: transactionUuid,
//         product_code: ESEWA_PRODUCT_CODE,
//         product_service_charge: 0,
//         product_delivery_charge: 0,
//         success_url: `http://localhost:${PORT}/payment/success`,
//         failure_url: `http://localhost:${PORT}/payment/failure`,
//         signed_field_names,
//         signature,
//     };

//     try {
//         const queryParams = new URLSearchParams(esewaConfig).toString();

//         const response = await fetch(
//             `https://rc-epay.esewa.com.np/api/epay/main/v2/form?${queryParams}`,
//             {
//                 method: "POST",
//             }
//         );

//         return res.json({
//             status_code: response.status,
//             message: "Payment request successful",
//             payment_url: response.url,
//         });
//     } catch (error) {
//         console.error("Esewa payment error:", error);
//     }
// };

// const initiatePayment = async (req, res) => {
//   let bookingId = null;
//   let redirectUrl = null; 
//   let payment = null;

//   try {
//     bookingId = req.params.bookingId;
//     const user = req.user;

//     if (!bookingId) {
//       return responses.badRequest(res, "Booking ID is required");
//     }

//     const booking = await Booking.findByPk(bookingId);
//     if (!booking) {
//       return responses.notFound(res, "Booking not found");
//     }

//     if (booking.userId !== user.id) {
//       return responses.unauthorized(res, "Not authorized to pay for this booking");
//     }

//     if (booking.status !== "confirmed") {
//       return responses.badRequest(res, "Payment can only be initiated for confirmed bookings");
//     }

//     // Fetch or create payment
//     payment = await PaymentActual.findOne({ where: { bookingId } });
//     const { amount, paymentGateway, bidId } = req.body;

//     if (!amount || isNaN(amount) || amount <= 0) {
//       return responses.badRequest(res, "A valid amount greater than 0 is required");
//     }

//     if (paymentGateway !== "esewa") {
//       return responses.badRequest(res, "Currently only 'esewa' payment is supported");
//     }

//     if (!payment) {
//       payment = await PaymentActual.create({
//         bookingId,
//         bidId: bidId || null,
//         status: "pending",
//       });
//     }

//     // eSewa payment data
//     const tax_amount = 0,
//           product_service_charge = 0,
//           product_delivery_charge = 0;

//     const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;
//     const transaction_uuid = `BOOKING${bookingId}_PAYMENT${payment.id}_${Date.now()}`;
//     const ESEWA_MERCHANT_ID = "EPAYTEST";
//     const ESEWA_SECRET = "8gBm/:&EnhH.1/q";

//     console.log("this is transaction uuid", transaction_uuid);
//     console.log("this is total amount", total_amount);

//     const success_url = `${process.env.FRONTEND_URL}/payment-success/esewa?transaction_uuid=${transaction_uuid}`;
//     const failure_url = `${process.env.FRONTEND_URL}/payment-failure/esewa?transaction_uuid=${transaction_uuid}`;

//     const signed_field_names = "total_amount,transaction_uuid,product_code";
//     const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
//     const signature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("base64");

//     const paymentData = {
//       amount: amount.toString(),
//       tax_amount: tax_amount.toString(),
//       total_amount: total_amount.toString(),
//       transaction_uuid,
//       product_code,
//       product_service_charge: product_service_charge.toString(),
//       product_delivery_charge: product_delivery_charge.toString(),
//       success_url,
//       failure_url,
//       signature,
//       signed_field_names,
//     };

//     // Convert to form-urlencoded
//     const encodedData = qs.stringify(paymentData);

//     const ESEWA_API_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
//     const esewaResponse = await axios.post(ESEWA_API_URL, encodedData, {
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       maxRedirects: 0,
//       validateStatus: (status) => status === 302 || status === 200,
//     });

//     console.log("eSewa Response Headers:", esewaResponse);

//     // For eSewa sandbox, you usually return form fields, not redirect
//     redirectUrl = ESEWA_API_URL; // fallback action URL
//     const responsePayload = {
//       action: ESEWA_API_URL,
//       method: "POST",
//       fields: paymentData,
//       paymentId: payment.id,
//       bookingId,
//     };

//     return responses.success(res, { message: "Payment initiated successfully", data: responsePayload });
//   } catch (err) {
//     console.error("initiatePayment error:", err.message);
//     return responses.serverError(res, err.message || "Failed to initiate payment");
//   }
// // };


// const initiatePayment = async (req, res) => {
//   try{
//     const bookingId = req.params.bookingId;
//     const user = req.user;
//     const price = req.body.amount;



//     // const transaction_uuid = `BOOKING${bookingId}_USER${user.id}_${Date.now()}`;
//      const transaction_uuid = `BOOKING${bookingId}_USER${user.id}_${Date.now()}`;

//      const signedField = 'total_amount,transaction_uuid,product_code';

//      const total_amount = price; 
//       const product_code = "EPAYTEST";
//       const secretKey = "8gBm/:&EnhH.1/q";
//       const signature = crypto.createHmac("sha256", secretKey).update(`total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`).digest("base64");


//       const paymentData = {
//         amount: price.toString(),
//         tax_amount: "0",
//         total_amount: total_amount.toString(),
//         product_delivery_charge: "0",
//         transaction_uuid,
//         product_code,
//         signedField,
//         success_url: `${process.env.FRONTEND_URL}/payment-success/esewa`,
//         failure_url: `${process.env.FRONTEND_URL}/payment-failure/esewa`,
//         signature,

//       }

//     try{
//       const response = await axios.post('https://rc-epay.esewa.com.np/api/epay/main/v2/form',qs.stringify(paymentData),{
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         maxRedirects:0,
//         validateStatus: (status) => status === 302 || status === 200,
//       });

//       console.log("this is response form esewa ",response)
//       return responses.success(res,{
//         response
//       })


//     }
//     catch(err){
//       console.error("Error initiating payment with eSewa:", err);

//     }
    

//   }
//   catch(err){
//     console.error("initiatePayment error:", err.message);

//   }

// }







// const verifyPayment = async(req,res)=>{
//   console.log("hey is there?")
//   console.log("Verifying payment with data:", req.body);
//   try{
//     const {bookingId,paymentId,transaction_uuid} = req.body;

//     if(!bookingId || !paymentId || !transaction_uuid){
//       return responses.badRequest(res,"bookingId, paymentId and transaction_uuid are required for verification");
//     }

//     const payment = await PaymentActual.findOne({where:{id:paymentId,bookingId}});
//     if(!payment){
//       return responses.notFound(res,"Payment record not found for the given booking and payment ID");
//     }

//     if(payment.status === "completed"){
//       return responses.success(res,"Payment already verified and completed",payment);
//     }


//     payment.status="completed";

    
//     await payment.save();

//     return responses.success(res,"Payment verified and completed successfully",payment);
    
    



//   }
//   catch(err){
//     console.error("Payment verification error:", err.message);
//     return responses.serverError(res,"Failed to verify payment");
//   }
// }

// ---------------------
// INITIATE PAYMENT
// ---------------------
// const initiatePayment = async (req, res) => {
//   try {
//     const bookingId = req.params.bookingId;
//     const user = req.user;

//     if (!bookingId) return responses.badRequest(res, "Booking ID is required");

//     const booking = await Booking.findByPk(bookingId);
//     if (!booking) return responses.notFound(res, "Booking not found");
//     if (booking.userId !== user.id)
//       return responses.unauthorized(res, "Not authorized to pay for this booking");

//     if (booking.status !== "confirmed")
//       return responses.badRequest(res, "Payment can only be initiated for confirmed bookings");

//     // Fetch existing payment if any
//     let payment = await PaymentActual.findOne({ where: { bookingId } });

//     const { amount, paymentGateway, bidId } = req.body;
//     if (!amount || isNaN(amount) || amount <= 0)
//       return responses.badRequest(res, "A valid amount greater than 0 is required");

//     if (paymentGateway !== "esewa")
//       return responses.badRequest(res, "Currently only 'esewa' payment is supported");

//     // Create or reuse payment
//     if (payment) {
//       if (payment.status === "completed")
//         return responses.badRequest(res, "Payment already completed for this booking");
//       console.log("Reusing existing pending payment:", payment.id);
//     } else {
//       payment = await PaymentActual.create({
//         bookingId,
//         bidId: bidId || null,
//         status: "pending",
//       });
//     }

//     // --- eSewa setup ---
//     const tax_amount = 0;
//     const product_service_charge = 0;
//     const product_delivery_charge = 0;
//     const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;

//     // simpler transaction_uuid
//     const transaction_uuid = `${bookingId}_${Date.now()}`;

//     const product_code = "EPAYTEST";
//     const success_url = `${process.env.FRONTEND_URL}/payment-success/esewa`;
//     const failure_url = `${process.env.FRONTEND_URL}/payment-failure/esewa`;

//     const signed_field_names = "total_amount,transaction_uuid,product_code";
//     const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
//     const secretKey = "8gBm/:&EnhH.1/q";
//     const signature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("base64");

//     const paymentData = {
//       amount: amount.toString(),
//       tax_amount: tax_amount.toString(),
//       total_amount: total_amount.toString(),
//       transaction_uuid,
//       product_code,
//       product_service_charge: product_service_charge.toString(),
//       product_delivery_charge: product_delivery_charge.toString(),
//       success_url,
//       failure_url,
//       signature,
//       signed_field_names,
//       bookingId,
//     };

//     console.log("Payment Data to be sent to eSewa:", paymentData);

//     const encodedData = qs.stringify(paymentData);

//    const ESEWA_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

// return responses.success(res, {
//   data: {
//     action: ESEWA_FORM_URL,
//     method: "POST",
//     fields: paymentData,
//   },
// });


//   } catch (err) {
//     console.error("initiatePayment error:", err.message);
//     return responses.serverError(res, "Failed to initiate payment");
//   }
// };

// const initiatePayment = async (req, res) => {
//   try {
//     const bookingId = req.params.bookingId;
//     const user = req.user;
//     const { amount, paymentGateway, bidId } = req.body;

//     if (!bookingId || !amount) {
//       return responses.badRequest(res, "Booking ID and amount are required");
//     }

//     const booking = await Booking.findByPk(bookingId);
//     if (!booking) return responses.notFound(res, "Booking not found");
//     if (booking.userId !== user.id)
//       return responses.unauthorized(res, "Not authorized");
//     if (booking.status !== "confirmed")
//       return responses.badRequest(res, "Booking not confirmed yet");

//     // create or reuse payment
//     let payment = await PaymentActual.findOne({ where: { bookingId } });
//     if (!payment) {
//       payment = await PaymentActual.create({
//         bookingId,
//         bidId: bidId || null,
//         status: "pending",
//       });
//     }


//     const total_amount = amount;
//     const product_code = "EPAYTEST";
//     const transaction_uuid = `BOOKING${bookingId}_PAY${payment.id}_${Date.now()}`;
//     const tax_amount = 0;
//     const product_service_charge = 0;
//     const product_delivery_charge = 0;

//     const success_url = `${process.env.FRONTEND_URL}/payment-success/esewa`;
//     const failure_url = `${process.env.FRONTEND_URL}/payment-failure/esewa`;


//     const secretKey = "8gBm/:&EnhH.1/q";
//     const signed_field_names = "total_amount,transaction_uuid,product_code";
//     const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
//     const signature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("base64");

//     // --- Send form data to frontend ---
//     const paymentData = {
//       amount: total_amount.toString(),
//       tax_amount: tax_amount.toString(),
//       total_amount: total_amount.toString(),
//       transaction_uuid,
//       product_code,
//       product_service_charge: product_service_charge.toString(),
//       product_delivery_charge: product_delivery_charge.toString(),
//       success_url,
//       failure_url,
//       signature,
//       signed_field_names,
//       bookingId,
//     };

//     return responses.success(res, {
//       action: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
//       method: "POST",
//       fields: paymentData,
//       message: "eSewa payment form ready",
//     });
//   } catch (err) {
//     console.error("initiatePayment error:", err.message);
//     return responses.serverError(res, "Failed to initiate payment");
//   }
// };




// ---------------------
// VERIFY PAYMENT
// ---------------------
const verifyPayment = async (req, res) => {
  console.log("Verifying payment with data:", req.body);
  try {
    const { bookingId, paymentId, transaction_uuid} = req.body;

    if (!bookingId || !paymentId || !transaction_uuid)
      return responses.badRequest(res, "bookingId, paymentId, and transaction_uuid are required");

    const payment = await PaymentActual.findOne({ where: { id: paymentId, bookingId } });
    if (!payment)
      return responses.notFound(res, "Payment record not found for the given booking and payment ID");

    if (payment.status === "completed")
      return responses.success(res, "Payment already verified", payment);
const status = "COMPLETED"; // This should come from eSewa's verification response
    // Only mark as completed if eSewa said success
    if (status === "COMPLETE" || status === "COMPLETED") {
      payment.status = "completed";
      await payment.save();
      return responses.success(res, "Payment verified and completed successfully", payment);
    }

    return responses.badRequest(res, "Payment verification failed or status invalid");
  } catch (err) {
    console.error("Payment verification error:", err.message);
    return responses.serverError(res, "Failed to verify payment");
  }
};

const releasePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  console.log("Releasing payment with data:", req.body || req.query);

  const bookingId = req.params.bookingId;
  

  if (!bookingId) {
    return responses.badRequest(res, "Booking ID is required to release or check payment");
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return responses.notFound(res, "Booking not found");
  }

  // 👇 Check if already released first
  const existingPaymentRecord = await paymentRecords.findOne({
    where: { bookingId: booking.id },
  });

  if (req.method === 'GET') {
    console.log("hello ")
    const isReleased = existingPaymentRecord && existingPaymentRecord.status === "released";
    return responses.success(res, "Payment release status fetched", {
      bookingId,
      released: isReleased,
      releasedAt: existingPaymentRecord ? existingPaymentRecord.releasedAt : null
    });
  }


  if (booking.status !== "completed") {
    return responses.badRequest(res, "Payment can only be released for completed bookings");
  }

  const payment = await PaymentActual.findOne({ where: { bookingId } });
  if (!payment || payment.status !== "completed") {
    return responses.badRequest(res, "Payment has not been completed for this booking");
  }

  const bid = await Bid.findOne({ where: { id: payment.bidId, status: "accepted" }, transaction });
  if (!bid) {
    return responses.notFound(res, "Bid associated with this payment not found");
  }

  const serviceProviderServiceId = booking.serviceProviderServiceId;
  if (!serviceProviderServiceId) {
    return responses.badRequest(res, "Service provider service ID missing in booking");
  }

  const serviceProviderAmount = bid.bidAmount;
  const platformFeePercentage = 0.10;
  const platformFee = serviceProviderAmount * platformFeePercentage;
  const amountToRelease = serviceProviderAmount - platformFee;

  const serviceproviderService = await ServiceProviderService.findOne({ where: { id: serviceProviderServiceId }, transaction });
  if (!serviceproviderService) {
    return responses.notFound(res, "Service provider not found for this booking");
  }

  const serviceProvider = await ServiceProvider.findByPk(serviceproviderService.serviceProviderId, { transaction });
  if (!serviceProvider) {
    return responses.notFound(res, "Service provider record not found");
  }

  const serviceProviderUserId = serviceProvider.userId;
  if (!serviceProviderUserId) {
    return responses.notFound(res, "Service provider user ID not found");
  }

  const serviceProviderPaymentAccount = await PaymentAccount.findOne({ where: { userId: serviceProviderUserId }, transaction });
  if (!serviceProviderPaymentAccount) {
    return responses.notFound(res, "Service provider payment account not found");
  }

  if (existingPaymentRecord && existingPaymentRecord.status === "released") {
    return responses.badRequest(res, "Payment has already been released for this booking");
  }

  const paymentRecord = await paymentRecords.create({
    paymentAccountId: serviceProviderPaymentAccount.id,
    paymentActualId: payment.id,
    bookingId: booking.id,
    amount: amountToRelease,
    currency: "NPR",
    status: "released",
    releasedAt: new Date()
  }, { transaction });

  try {
    await transaction.commit();
    return responses.success(res, "Payment released successfully", {
      amountReleased: amountToRelease,
      serviceProviderId: serviceProviderUserId,
      releasedAt: paymentRecord.releasedAt
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error releasing payment:", err);
    return responses.serverError(res, "Error releasing payment to service provider");
  }
};



const getPaymentRecordsForProvider = async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query; 

    // Valid statuses
    const validStatuses = ['initiated', 'completed', 'failed', 'released'];

    // Build conditional filter
    let statusFilter = {};
    if (status && status !== 'all' && validStatuses.includes(status)) {
      statusFilter = { status };
    }

    // Get all payment accounts for this provider
    const accounts = await PaymentAccount.findAll({ where: { userId: user.id } });

    if (!accounts.length) {
      return responses.success(res, "No payment accounts found", []);
    }

    // Extract account IDs
    const accountIds = accounts.map(acc => acc.id);


    const paymentRecord= await paymentRecords.findAll({
      where: {
        paymentAccountId: accountIds,
        ...statusFilter,
      },
    });

    return responses.success(res, "Payment records fetched successfully", paymentRecord);
  } catch (err) {
    console.error("Error fetching payment records for provider:", err);
    return responses.badRequest(res, "Failed to fetch payment records");
  }
};


const getPaymentStatus = async (req, res) => {
  try {
    // Parse bookingIds from query if provided (comma separated)
    const ids = req.query.bookingIds
      ? req.query.bookingIds.split(",").map((id) => Number(id.trim())).filter(Boolean)
      : [];

    // Fetch paymentRecords for those booking IDs (or all if none passed)
    const whereClause = ids.length > 0 ? { bookingId: ids } : {};
    const records = await paymentRecords.findAll({
      attributes: ["bookingId", "status", "released_at"],
      where: whereClause,
    });

    // Build map: bookingId -> released true/false
    const statusMap = {};
    for (const r of records) {
      statusMap[r.bookingId] = r.status === "released";
    }

    // If booking IDs provided but not all found, default them to false
    if (ids.length > 0) {
      for (const id of ids) {
        if (statusMap[id] === undefined) statusMap[id] = false;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk payment release statuses fetched successfully",
      data: statusMap,
    });
  } catch (err) {
    console.error("Error fetching payment statuses:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching payment release statuses",
      error: err.message || err,
    });
  }
};



const getPaymentHistoryForProvider = async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;
    // Valid statuses
    const validStatuses = ['initiated', 'completed', 'failed', 'released'];

    let statusFilter = {};
    if (status && status !== 'all' && validStatuses.includes(status)) {
      statusFilter = { status };
    }
    // Get all payment accounts for this provider
    const accounts = await PaymentAccount.findAll({ where: { userId: user.id } });
    if (!accounts.length) {
      return responses.success(res, "No payment accounts found", []);
    }
    // Extract account IDs
    const accountIds = accounts.map(acc => acc.id);
    const paymentRecord= await paymentRecords.findAll({
      where: {
        paymentAccountId: accountIds,
        ...statusFilter,
      },
    });
    return responses.success(res, "Payment records fetched successfully", paymentRecord);
  } catch (err) {
    console.error("Error fetching payment records for provider:", err);
    return responses.badRequest(res, "Failed to fetch payment records");
  }
};





module.exports = { createPaymentAccount,fetchPaymentStatus,initiatePayment,verifyPayment,releasePayment, getPaymentRecordsForProvider, getPaymentStatus, getPaymentHistoryForProvider };


