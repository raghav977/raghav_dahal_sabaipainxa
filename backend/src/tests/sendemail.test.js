jest.mock("nodemailer");
const nodemailer = require("nodemailer");
const sendEmail = require("../services/emailService");


test("should send email successfully", async () => {
  const sendMailMock = jest.fn().mockResolvedValue(true);

  nodemailer.createTransport.mockReturnValue({
    sendMail: sendMailMock,
  });

  const result = await sendEmail("test@gmail.com", "OTP", "123456");

  expect(result).toBe(true);
  expect(sendMailMock).toHaveBeenCalled();
});




test("should handle email sending failure", async () => {
  const sendMailMock = jest.fn().mockRejectedValue(new Error("SMTP Error"));

  nodemailer.createTransport.mockReturnValue({
    sendMail: sendMailMock,
  });

  const result = await sendEmail("test@gmail.com", "OTP", "123456");

  expect(result).toBe(false);
});



test("should call sendMail with correct parameters", async () => {
  const sendMailMock = jest.fn().mockResolvedValue(true);

  nodemailer.createTransport.mockReturnValue({
    sendMail: sendMailMock,
  });

  await sendEmail("test@gmail.com", "OTP Code", "999999");

  expect(sendMailMock).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "test@gmail.com",
      subject: "OTP Code",
      html: expect.any(String),
    })
  );
});