import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const environment = process.env.NODE_ENV;

export const sendTelegramNotification = async (message) => {
  if (botToken && chatId && environment === "production") {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(
      message,
    )}`;

    try {
      const response = await fetch(url);
      const result = await response.json();
      if (result.ok) {
        // console.log("Notification sent successfully!");
      } else {
        console.error("Failed to send signup message:", result);
      }
    } catch (error) {
      console.error("Error sending signup message:", error);
    }
  }
};
