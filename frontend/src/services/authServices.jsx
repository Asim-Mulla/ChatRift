import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: serverUrl,
});

export const signup = (email, password) => {
  return api.post(
    "/api/auth/signup",
    { email, password },
    { withCredentials: true }
  );
};

export const login = (email, password) => {
  return api.post(
    "/api/auth/login",
    { email, password },
    { withCredentials: true }
  );
};

export const getUserData = () => {
  return api.get("/api/auth/user-info", { withCredentials: true });
};

export const updateProfile = (firstName, lastName, color) => {
  return api.post(
    "/api/auth/update-profile",
    { firstName, lastName, color },
    { withCredentials: true }
  );
};

export const addProfileImage = (formData) => {
  return api.post("/api/auth/add-profile-image", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteProfileImage = () => {
  return api.post(
    "/api/auth/delete-profile-image",
    {},
    { withCredentials: true }
  );
};

export const logout = () => {
  return api.post("/api/auth/logout", {}, { withCredentials: true });
};
