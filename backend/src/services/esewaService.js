require("dotenv").config();
const axios = require("axios");
const qs = require("qs");
const crypto = require("crypto");


// console.log("FRONTEND_URL", process.env.FRONTEND_URL);


 const initiateEsewaPayment = async (roomPayment) => {
  try {

    console.log("this is frontend url inside esewa service", process.env.FRONTEND_URL);
    // Step 1: Prepare payment variables
    const amount = roomPayment.amount || 500;
    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;
    const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;

    // Step 2: Prepare eSewa configuration
    const product_code = "EPAYTEST"; // Replace with your actual product code in production
    const secretKey = "8gBm/:&EnhH.1/q"; // Replace with your actual secret key in production

    // Step 3: Generate unique transaction UUID
    const transaction_uuid = `GHARBETI_PAY_${roomPayment.id}_${Date.now()}`;

    // Step 4: Create signature for eSewa
    const signed_field_names = "total_amount,transaction_uuid,product_code";
    const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = crypto.createHmac("sha256", secretKey).update(dataToSign).digest("base64");

    const success_url = `${process.env.FRONTEND_URL}/payment-success/gharbeti-room`;
    const failure_url = `${process.env.FRONTEND_URL}/payment-failure/gharbeti-room`;

    // Step 6: Prepare eSewa form data
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

    const encodedData = qs.stringify(paymentData);

    // Step 7: Send request to eSewa API
    const ESEWA_API_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    const esewaResponse = await axios.post(ESEWA_API_URL, encodedData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status === 200,
    });

    // Step 8: Get redirect URL
    const redirectUrl = esewaResponse.headers?.location || esewaResponse.request?.res?.responseUrl;

    if (!redirectUrl) {
      console.error("No redirect URL returned by eSewa.");
      return { status: "error", message: "Failed to get redirect URL" };
    }

    // Step 9: Return success response
    return {
      status: "success",
      redirectUrl,
      transaction_uuid,
    };
  } catch (err) {
    console.error("Error initiating eSewa payment:", err);
    return { status: "error", message: err.message };
  }
};

module.exports = {
  initiateEsewaPayment,
};  