import oauth2client from "../config/googleAuth.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/userModel.js";
import "dotenv/config";

const maxAge = 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const createToken = (email, userId) => {
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ email, userId }, secret, { expiresIn: maxAge });
  return token;
};

const googleLogin = async (req, res) => {
  const { code } = req.query;

  try {
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const { email } = userRes.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, verified: true });

      await user.save();

      // Notifying on telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        const sendTelegramNotification = async () => {
          const message = `! New user signed up !
    User email :- ${user.email},
    `;

          const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(
            message
          )}`;

          try {
            const response = await fetch(url);
            const result = await response.json();
            if (result.ok) {
              // console.log("Notification sent successfully!");
            } else {
              console.error("Failed to send notification:", result);
            }
          } catch (error) {
            console.error("Error sending message:", error);
          }
        };

        sendTelegramNotification();
      }

      const token = createToken(email, user._id);

      return res
        .status(201)
        .cookie("token", token, {
          maxAge: maxAge,
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "None" : "Lax",
        })
        .json({
          user: {
            id: user._id,
            email: user.email,
            profileSetup: user.profileSetup,
          },
        });
    } else {
      // Notifying on telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        const sendTelegramNotification = async () => {
          const message = `! New user logged in !
          ${
            user.firstName
              ? `User name :- ${user.firstName} ${user.lastName}`
              : ""
          }
            User email :- ${user.email},
            `;

          const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(
            message
          )}`;

          try {
            const response = await fetch(url);
            const result = await response.json();
            if (result.ok) {
              // console.log("Notification sent successfully!");
            } else {
              console.error("Failed to send notification:", result);
            }
          } catch (error) {
            console.error("Error sending message:", error);
          }
        };

        sendTelegramNotification();
      }

      const token = createToken(email, user._id);

      return res
        .status(200)
        .cookie("token", token, {
          maxAge: maxAge,
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "None" : "Lax",
        })
        .json({
          user: {
            id: user._id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
            notifications: user.notifications,
            verified: user.verified,
          },
        });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Internal server error!" });
  }
};

export { googleLogin };
