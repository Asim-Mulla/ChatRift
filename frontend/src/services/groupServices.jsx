import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: serverUrl,
});

export const createGroup = (name, members) => {
  return api.post(
    "/api/group/create-group",
    { name, members },
    { withCredentials: true }
  );
};

export const getGroups = () => {
  return api.get("/api/group/get-user-groups", { withCredentials: true });
};

export const getGroupMessages = (groupId) => {
  return api.get(`/api/group/get-group-messages/${groupId}`, {
    withCredentials: true,
  });
};

export const editGroupName = (name, originalName) => {
  return api.patch(
    "/api/group/change-name",
    { name, originalName },
    { withCredentials: true }
  );
};

export const editGroupMembers = (name, originalName, members) => {
  return api.patch(
    "/api/group/change-members",
    { name, originalName, members },
    { withCredentials: true }
  );
};

export const exitGroup = (groupId) => {
  return api.patch(
    "api/group/exit-group",
    { groupId },
    { withCredentials: true }
  );
};

export const deleteGroup = (groupId) => {
  return api.delete("/api/group/delete", {
    data: { groupId },
    withCredentials: true,
  });
};
