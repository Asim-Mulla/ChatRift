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

export const deleteMessage = (messageId, groupData) => {
  return api.delete("/api/message/delete", {
    data: { messageId, groupData },
    withCredentials: true,
  });
};

export const deleteMessageForMe = (messageId, groupData) => {
  return api.delete("/api/message/delete-for-me", {
    data: { messageId, groupData },
    withCredentials: true,
  });
};

export const editMessage = (messageId, editedContent) => {
  return api.patch(
    "/api/message/edit",
    { messageId, editedContent },
    { withCredentials: true },
  );
};
