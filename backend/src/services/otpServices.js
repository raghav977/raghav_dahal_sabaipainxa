// const crypto = require('crypto');

const { Op } = require("sequelize");

const User = require("../models/User");

const Otp = require("../models/Otp");

// Function to generate a random OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
}


// Function to create and store OTP

const createAndStoreOtp = async (email = null, phone_number = null) => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);


    const recentOtpCount = await Otp.count({
      where: {
        email,
        createdAt: { [Op.gte]: fiveMinutesAgo },
      }
    });

    if (recentOtpCount >= 5) {
      throw new Error("Too many OTP requests. Please try again after 5 minutes.");
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); 

    await Otp.create({
      email,
      phone_number,
      Otp: otpCode,
      expiresAt,
      created_at: now, 
    });

    return otpCode;
  } catch (error) {
    console.error("Error creating OTP:", error);
    throw error;
  }
};



const verifyOtp = async (email, otpCode) => {
  console.log("Verifying OTP for:", email, "code:", otpCode);

  try {

    const otpRecord = await Otp.findOne({
      where: { email },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
      return { valid: false, message: "No OTP found for this email" };
    }


    if (new Date() > new Date(otpRecord.expiresAt)) {
      console.log("this is newData",new Date())
      console.log("this is expire date", new Date(otpRecord.expiresAt))

      console.log("the token")
      return { valid: false, message: "OTP has expired" };
    }


    if (otpRecord.attempts >= 5) {
      // await otpRecord.destroy();
      return { valid: false, message: "Maximum attempts exceeded" };
    }


    otpRecord.attempts += 1;
    await otpRecord.save();

    
    if (otpRecord.Otp === otpCode) {
      otpRecord.is_verified = true;
      await otpRecord.save();
      return { valid: true, message: "OTP verified successfully" };
    }

    return { valid: false, message: "Invalid OTP" };

  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};


module.exports = {
    createAndStoreOtp,
    verifyOtp,
    generateOtp
};