export const createAuthSlice = (set) => ({
  userInfo: null,
  userNotifications: [],
  setUserInfo: (userInfo) => set({ userInfo }),
  setUserNotifications: (userNotifications) => set({ userNotifications }),
});
