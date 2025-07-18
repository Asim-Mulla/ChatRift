import { useAppStore } from "@/store/store";
import { io } from "socket.io-client";
import { createContext, useContext, useRef, useEffect } from "react";
import { toast } from "sonner";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef();
  const { userInfo } = useAppStore();

  useEffect(() => {
    if (userInfo) {
      socket.current = io(import.meta.env.VITE_SERVER_URL, {
        withCredentials: true,
        query: { userId: userInfo.id },
      });

      const handleDmOnlineContacts = (onlineContacts) => {
        const { setDMOnlineContacts } = useAppStore.getState();
        setDMOnlineContacts(onlineContacts);
      };

      const handleReceiveMessage = async (message) => {
        const { userInfo, setUserInfo } = useAppStore.getState();
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          bringContactToTop,
        } = useAppStore.getState();

        if (
          selectedChatType === "Contact" &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.receiver._id)
        ) {
          addMessage(message);
        } else {
          const notificationsExists = userInfo.notifications.find(
            (notifier) => notifier.user === message.sender._id
          );

          let updatedNotifications = null;

          if (notificationsExists) {
            if (notificationsExists.count === 0) {
              toast.info(
                `New message from ${message.sender.firstName} ${message.sender.lastName}`
              );
            }
            updatedNotifications = userInfo.notifications.map((notifier) => {
              if (notifier.user === message.sender._id) {
                return { ...notifier, count: notifier.count + 1 };
              } else {
                return { ...notifier };
              }
            });
          } else {
            updatedNotifications = [
              ...userInfo.notifications,
              { user: message.sender._id, count: 1 },
            ];
            toast.info(
              `New message from ${message.sender.firstName} ${message.sender.lastName}`
            );
          }

          setUserInfo({
            ...userInfo,
            notifications: updatedNotifications,
          });
        }

        if (
          selectedChatType === "Contact" &&
          userInfo.id === message.receiver._id &&
          selectedChatData._id === message.sender._id
        ) {
          // emit message read
          const to = message.sender._id;
          const notifier = message?.receiver?._id;
          socket.current.emit("messageRead", {
            to,
            notifier,
          });
        }

        bringContactToTop(message);
      };

      const handleMessageRead = ({ notifier }) => {
        const {
          selectedChatData,
          setReceiverUnreadCount,
          DMContacts,
          setDMContacts,
          userInfo,
        } = useAppStore.getState();

        if (selectedChatData?._id === notifier) {
          setReceiverUnreadCount(0);
        }

        const updatedDMContacts = DMContacts.map((contact) => {
          if (contact._id === notifier) {
            const contactsNewNotifications = contact?.notifications.filter(
              (n) => n.user !== userInfo.id
            );
            return { ...contact, notifications: contactsNewNotifications };
          } else {
            return contact;
          }
        });
        setDMContacts(updatedDMContacts);
      };

      const handleMessageEdited = ({ editedMessage, group }) => {
        const {
          selectedChatData,
          selectedChatType,
          setSelectedChatMessages,
          selectedChatMessages,
        } = useAppStore.getState();
        if (
          selectedChatType === "Group" &&
          group &&
          selectedChatData?._id === group.groupId
        ) {
          const updatedMessages = selectedChatMessages.map((message) => {
            if (message._id === editedMessage._id) {
              return editedMessage;
            } else {
              return message;
            }
          });

          setSelectedChatMessages(updatedMessages);
        } else if (
          selectedChatType === "Contact" &&
          (selectedChatData?._id === editedMessage?.sender ||
            selectedChatData?._id === editedMessage?.receiver)
        ) {
          const updatedMessages = selectedChatMessages.map((message) => {
            if (message._id === editedMessage._id) {
              return editedMessage;
            } else {
              return message;
            }
          });

          setSelectedChatMessages(updatedMessages);
        }
      };

      const handleReceiveGroupMessage = (message) => {
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          bringGroupToTop,
          userInfo,
          setUserInfo,
        } = useAppStore.getState();

        if (
          selectedChatType === "Group" &&
          selectedChatData._id === message.groupId
        ) {
          addMessage(message);
        } else {
          const notificationsExists = userInfo.notifications.find(
            (notifier) => notifier.user === message.groupId
          );

          let updatedNotifications = null;

          if (notificationsExists) {
            if (notificationsExists.count === 0) {
              toast.info(`New message in group ${message.groupName}`);
            }
            updatedNotifications = userInfo.notifications.map((notifier) => {
              if (notifier.user === message.groupId) {
                return { ...notifier, count: notifier.count + 1 };
              } else {
                return { ...notifier };
              }
            });
          } else {
            updatedNotifications = [
              ...userInfo.notifications,
              { user: message.groupId, count: 1 },
            ];
            toast.info(`New message in group ${message.groupName}`);
          }

          setUserInfo({ ...userInfo, notifications: updatedNotifications });
        }

        bringGroupToTop(message);
      };

      const handleMessageDeleted = ({ message }) => {
        const { deleteMessageFromStore } = useAppStore.getState();
        deleteMessageFromStore(message);
      };

      const handleGroupCreated = (group) => {
        const { addGroup } = useAppStore.getState();
        addGroup(group);
      };

      const handleChangedGroupName = (group) => {
        const { updateGroup } = useAppStore.getState();
        updateGroup(group);
      };

      const handleEditGroup = (group) => {
        const { updateGroup, groups, addGroup } = useAppStore.getState();

        const foundGroup = groups.find(
          (currGroup) => currGroup._id === group._id
        );

        if (foundGroup?._id) {
          updateGroup(group);
        } else {
          addGroup(group);
        }
      };

      const handleRemovedFromGroup = (group) => {
        const { updateGroup } = useAppStore.getState();
        updateGroup(group);
        toast.info(`You have been removed from group '${group.name}'`);
      };

      const handleLeftGroup = ({ group, user }) => {
        const { selectedChatType, selectedChatData, updateGroup } =
          useAppStore.getState();
        updateGroup(group);
        const userName = user.firstName.length
          ? `${user.firstName} ${user.lastName}`
          : `${user.email}`;

        if (
          selectedChatType === "Group" &&
          selectedChatData?._id === group?._id
        ) {
          toast.info(`${userName} left the group.`);
        } else {
          toast.info(`${userName} left the group '${group.name}'.`);
        }
      };

      const handleGroupDeleted = (deletedGroup) => {
        const {
          leaveGroup,
          selectedChatType,
          selectedChatData,
          setSelectedChatType,
          setSelectedChatData,
          setSelectedChatMessages,
        } = useAppStore.getState();
        leaveGroup(deletedGroup);
        if (
          selectedChatType === "Group" &&
          selectedChatData._id === deletedGroup._id
        ) {
          setSelectedChatType(null);
          setSelectedChatData(null);
          setSelectedChatMessages([]);
        }
        toast.info(`Admin deleted the group '${deletedGroup?.name}'`);
      };

      socket.current.on("connect", () => {});
      socket.current.on("onlineContacts", handleDmOnlineContacts);
      socket.current.on("receiveMessage", handleReceiveMessage);
      socket.current.on("messageRead", handleMessageRead);
      socket.current.on("messageEdited", handleMessageEdited);
      socket.current.on("receiveGroupMessage", handleReceiveGroupMessage);
      socket.current.on("messageDeleted", handleMessageDeleted);
      socket.current.on("groupCreated", handleGroupCreated);
      socket.current.on("changedGroupName", handleChangedGroupName);
      socket.current.on("changedGroupMembers", handleEditGroup);
      socket.current.on("removedFromGroup", handleRemovedFromGroup);
      socket.current.on("leftGroup", handleLeftGroup);
      socket.current.on("groupDeleted", handleGroupDeleted);

      return () => {
        socket.current.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
