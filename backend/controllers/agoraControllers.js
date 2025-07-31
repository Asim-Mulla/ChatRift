import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

export const generateAgoraToken = async (req, res) => {
  try {
    const { channelName, uid, role = "publisher" } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: "Channel name is required" });
    }

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({
        error: "Agora credentials not configured properly",
      });
    }

    // Convert role to Agora role
    const agoraRole =
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Token expiration time (24 hours from now)
    const expirationTimeInSeconds =
      Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    // Generate the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid || 0, // Use 0 for string-based UIDs
      agoraRole,
      expirationTimeInSeconds
    );

    res.status(200).json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      uid: uid || 0,
      expirationTime: expirationTimeInSeconds,
    });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    res.status(500).json({
      error: "Failed to generate token",
      details: error.message,
    });
  }
};
