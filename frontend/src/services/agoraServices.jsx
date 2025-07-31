import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: serverUrl,
});

export const generateAgoraToken = (channelName, uid, role = "publisher") => {
  return api.post(
    "/api/agora/generate-token",
    { channelName, uid, role },
    { withCredentials: true }
  );
};
