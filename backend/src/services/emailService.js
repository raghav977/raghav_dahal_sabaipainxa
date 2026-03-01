const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const html = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="https://yourdomain.com/logo.png" alt="UPAAYAX" width="150" style="display: block;">
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px; color: #333333;">
                  <h1 style="color: #4CAF50;">${subject}</h1>
                  <p>Hello,</p>
                  <p> <strong>${otp}</strong></p>
                  <p>Thank you for choosing <strong>UPAAYAX</strong>!</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f0f0f0; text-align: center; color: #777;">
                  <p>Best regards,</p>
                  <img src="https://yourdomain.com/signature.png" alt="UPAAYAX Team" width="120">
                  <p>UPAAYAX Team</p>
                  <p><a href="https://upayax.com" style="color: #4CAF50; text-decoration: none;">upayax.com</a></p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    `;

    await transporter.sendMail({
      from: `<${process.env.SMTP_USER}>`,
      to,
      subject,
      html, 
    });

    console.log("Email sent to", to);
    return true;
  } catch (err) {
    console.error("Error sending email:", err.message);
    return false;
  }
};

module.exports = sendEmail;
