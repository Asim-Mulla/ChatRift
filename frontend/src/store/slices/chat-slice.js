export const createChatSlice = (set, get) => ({
  selectedChatType: null,
  selectedChatData: null,
  selectedChatMessages: [],
  DMContacts: [],
  DMOnlineContacts: [],
  groups: [],
  notifications: 0,
  receiverUnreadCount: 0,
  setReceiverUnreadCount: (receiverUnreadCount) => set({ receiverUnreadCount }),
  setNotifications: (notifications) => set({ notifications }),
  setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
  setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
  setSelectedChatMessages: (selectedChatMessages) =>
    set({ selectedChatMessages }),
  setDMContacts: (DMContacts) => set({ DMContacts }),
  setDMOnlineContacts: (onlineUsers) =>
    set(() => ({ DMOnlineContacts: [...onlineUsers] })),
  setGroups: (groups) => set({ groups }),
  closeChat: () =>
    set({
      selectedChatType: null,
      selectedChatData: null,
      selectedChatMessages: [],
    }),
  addMessage: (message) => {
    const selectedChatMessages = get().selectedChatMessages;
    const selectedChatType = get().selectedChatType;

    set({
      selectedChatMessages: [
        ...selectedChatMessages,
        {
          ...message,
          receiver:
            selectedChatType === "Group"
              ? message.receiver
              : message.receiver._id,
          sender:
            selectedChatType === "Group" ? message.sender : message.sender._id,
        },
      ],
    });
  },
  deleteMessageFromStore: (deletedMessage) => {
    const selectedChatMessages = get().selectedChatMessages;
    const updatedMessages = selectedChatMessages.map((message) => {
      if (message._id === deletedMessage._id) {
        return { ...message, deleted: true };
      }
      return message;
    });
    set({ selectedChatMessages: updatedMessages });
  },
  addGroup: (group) => {
    const groups = get().groups;
    set({ groups: [group, ...groups] });
  },
  updateGroup: (updatedGroup) => {
    const groups = get().groups.slice(); // shallow copy
    const index = groups.findIndex((group) => group._id === updatedGroup._id);

    if (index !== -1) {
      groups[index] = updatedGroup;
      const { selectedChatType } = get();
      const isCurrentGroup = selectedChatType === "Group";
      set({
        groups,
        ...(isCurrentGroup && { selectedChatData: updatedGroup }),
      });
    }
  },
  leaveGroup: (exitedGroup) => {
    const groups = get().groups.slice();
    const index = groups.findIndex((group) => group._id === exitedGroup._id);

    if (index !== -1) {
      groups.splice(index, 1);
      set({ groups });
    }
  },
  bringContactToTop: (message) => {
    const userId = get().userInfo.id;
    const fromId =
      message.sender._id === userId ? message.receiver._id : message.sender._id;
    const fromData =
      message.sender._id === userId ? message.receiver : message.sender;
    const dmContacts = [...get().DMContacts];
    const index = dmContacts.findIndex((contact) => contact._id === fromId);
    if (index !== -1) {
      const contact = dmContacts[index];
      dmContacts.splice(index, 1);
      dmContacts.unshift(contact);
    } else {
      dmContacts.unshift(fromData);
    }

    set({ DMContacts: dmContacts });
  },
  bringGroupToTop: (message) => {
    const groups = get().groups.slice(); // clone to avoid direct mutation (recommended)
    const index = groups.findIndex((group) => group._id === message.groupId);

    if (index !== -1) {
      const group = groups[index];
      groups.splice(index, 1); // remove old position
      groups.unshift(group); // add to top

      // Update the state
      set({ groups });
    }
  },
});
