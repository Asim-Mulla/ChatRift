import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: serverUrl,
});

export const getMessages = (otherUserId) => {
  return api.get(`/api/message/get-messages/${otherUserId}`, {
    withCredentials: true,
  });
};

export const uploadFile = (formData) => {
  return api.post("/api/message/upload-file", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteMessage = (message, group) => {
  return api.delete("/api/message/delete", {
    data: { message, group },
    withCredentials: true,
  });
};
