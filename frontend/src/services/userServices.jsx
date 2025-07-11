import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: serverUrl,
});

export const getContacts = () => {
  return api.get("/api/user/get-users-for-dm", { withCredentials: true });
};

export const getDMContacts = () => {
  return api.get("/api/user/get-dm-contacts", { withCredentials: true });
};

export const getContactsForGroup = () => {
  return api.get("/api/user/get-users-for-group", { withCredentials: true });
};

export const removeNotification = (notifier) => {
  return api.post(
    "/api/user/remove-notification",
    { notifier },
    { withCredentials: true }
  );
};

// User info for DM from group
export const getUserInfo = (userId) => {
  return api.get(`/api/user/get-user-info/${userId}`, {
    withCredentials: true,
  });
};
