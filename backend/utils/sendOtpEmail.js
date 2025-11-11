import nodemailer from "nodemailer";
import "dotenv/config";

const sendOtpEmail = async (to, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD, // App Password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject: "OTP for Signing up to Chatrift.",
      text,
    });
  } catch (error) {
    console.log(error);
  }
};

export default sendOtpEmail;
