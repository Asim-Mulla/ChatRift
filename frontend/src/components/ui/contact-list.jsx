import { useAppStore } from "@/store/store";
import { Avatar, AvatarImage } from "./avatar";
import { getColor } from "@/lib/utils";
import { removeNotification } from "@/services/userServices";
import { GoVerified } from "react-icons/go";
import { useSocket } from "@/Context/SocketContext";

const ContactList = ({
  contacts,
  DMTypingMap,
  GMTypingMap,
  isGroup = false,
}) => {
  const {
    userInfo,
    setUserInfo,
    setNotifications,
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    DMOnlineContacts,
    setReceiverUnreadCount,
  } = useAppStore();

  const socket = useSocket();

  const handleSelectContact = async (contact) => {
    if (isGroup) {
      setSelectedChatType("Group");
    } else {
      setSelectedChatType("Contact");
    }

    const notifications =
      userInfo?.notifications?.find((notifier) => notifier.user === contact._id)
        ?.count || 0;

    if (!isGroup) {
      if (contact.notifications.length) {
        const hasUnreadMessages = contact.notifications.find(
          (notifier) => notifier.user === userInfo.id
        );
        if (hasUnreadMessages) {
          setReceiverUnreadCount(hasUnreadMessages.count);
        }
      } else {
        setReceiverUnreadCount(0);
      }
    }

    setSelectedChatData(contact);

    setNotifications(notifications);

    const updatedNotifications = userInfo.notifications.filter(
      (notifier) => notifier.user !== contact._id
    );

    if (notifications) {
      const to = contact._id;
      const notifier = userInfo.id;
      if (socket) {
        socket.emit("messageRead", {
          to,
          notifier,
        });
      }
    }

    setUserInfo({ ...userInfo, notifications: updatedNotifications });

    if (selectedChatData && selectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }

    if (contact?.messages?.length && notifications) {
      try {
        await removeNotification(contact._id);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const ellipsisStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  if (!userInfo) {
    return;
  }

  return (
    <div className="mt-5">
      {contacts?.map((contact) => {
        const notification = userInfo?.notifications?.find(
          (notifi) => notifi.user === contact._id
        );

        return (
          <div
            key={contact?._id}
            className={`pl-10 py-2 transition-all duration-300 cursor-pointer ${
              selectedChatData && selectedChatData._id === contact?._id
                ? "bg-[#8417ff] hover:bg-[#8417ff]"
                : "hover:bg-[#f1f1f111]"
            }`}
            onClick={() => handleSelectContact(contact)}
          >
            <div className="relative flex items-center justify-start gap-5 text-neutral-300 pr-10">
              {!isGroup && (
                <div className="relative">
                  <Avatar className=" h-10 w-10  rounded-full overflow-hidden">
                    {contact?.image?.url ? (
                      <AvatarImage
                        src={contact?.image?.url || "/placeholder.svg"}
                        alt="profile"
                        className={"object-cover w-full h-full bg-black"}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={`uppercase h-10 w-10  text-lg border flex justify-center items-center rounded-full ${getColor(
                          contact?.color
                        )}`}
                      >
                        {contact?.firstName && contact?.lastName
                          ? contact?.firstName.trim().charAt(0).toUpperCase() +
                            contact?.lastName.trim().charAt(0).toUpperCase()
                          : contact?.email.split("").shift()}
                      </div>
                    )}
                  </Avatar>
                  {DMOnlineContacts?.includes(contact?._id) && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-purple-300 bg-purple-500" />
                  )}
                </div>
              )}
              {isGroup && (
                <Avatar className=" h-10 w-10  rounded-full overflow-hidden">
                  <div
                    className={`uppercase h-10 w-10  text-lg border flex justify-center items-center rounded-full bg-gray-700`}
                  >
                    <span>#</span>
                  </div>
                </Avatar>
              )}

              <div className="min-w-0 flex items-center gap-2 mr-5">
                <div className="flex-1 min-w-0">
                  {isGroup ? (
                    <>
                      <div style={ellipsisStyle} className="text-neutral-300">
                        {contact?.name}
                      </div>
                      {GMTypingMap && GMTypingMap[contact?._id]?.typing && (
                        <div
                          className="text-sm font-semibold italic text-purple-300"
                          style={ellipsisStyle}
                        >
                          {GMTypingMap[contact?._id]?.typer} is typing...
                        </div>
                      )}
                    </>
                  ) : contact?.firstName ? (
                    <>
                      <div style={ellipsisStyle} className="text-neutral-300">
                        {`${contact?.firstName} ${contact?.lastName}`}
                      </div>
                      {DMTypingMap && DMTypingMap[contact?._id] && (
                        <div className="text-sm font-semibold italic text-purple-300">
                          Typing...
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={ellipsisStyle} className="text-neutral-300">
                      {contact?.email}
                    </div>
                  )}
                </div>

                {!isGroup && contact?.verified && (
                  <div className="flex-shrink-0">
                    <GoVerified />
                  </div>
                )}
              </div>

              {notification && notification.count > 0 && (
                <div className="absolute right-5 h-5 w-5 rounded-full flex items-center justify-center text-white border md:right-5 bg-purple-500 flex-shrink-0">
                  <span className="text-xs flex justify-center items-center">
                    {notification.count}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContactList;
