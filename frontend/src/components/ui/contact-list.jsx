import { useAppStore } from "@/store/store";
import { Avatar, AvatarImage } from "./avatar";
import { getColor } from "@/lib/utils";
import { useEffect } from "react";
import { removeNotification } from "@/services/userServices";

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
  } = useAppStore();

  const handleSelectContact = async (contact) => {
    if (isGroup) {
      setSelectedChatType("Group");
    } else {
      setSelectedChatType("Contact");
    }

    const notifications =
      userInfo?.notifications?.find((notifier) => notifier.user === contact._id)
        ?.count || 0;

    setSelectedChatData(contact);

    setNotifications(notifications);

    const updatedNotifications = userInfo.notifications.filter(
      (notifier) => notifier.user !== contact._id
    );

    setUserInfo({ ...userInfo, notifications: updatedNotifications });

    if (selectedChatData && selectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }

    if (contact?.messages?.length && notifications) {
      try {
        console.log("removing by click");
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
            <div className="relative flex items-center justify-start gap-5 text-neutral-300">
              {!isGroup && (
                <div className="relative">
                  <Avatar className=" h-10 w-10  rounded-full overflow-hidden">
                    {contact?.image?.url ? (
                      <AvatarImage
                        src={contact?.image?.url}
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
              {isGroup ? (
                <span style={ellipsisStyle} className="flex flex-col mr-15">
                  {contact?.name}
                  {GMTypingMap && GMTypingMap[contact?._id]?.typing ? (
                    <span className="text-sm font-semibold italic text-purple-300">
                      {GMTypingMap[contact?._id]?.typer} is typing...
                    </span>
                  ) : null}
                </span>
              ) : contact?.firstName ? (
                <span style={ellipsisStyle} className="flex flex-col mr-15">
                  {`${contact?.firstName} ${contact?.lastName}`}
                  {DMTypingMap && DMTypingMap[contact?._id] ? (
                    <span className="text-sm font-semibold italic text-purple-300">
                      Typing...
                    </span>
                  ) : null}
                </span>
              ) : (
                <span style={ellipsisStyle}>{contact?.email}</span>
              )}
              {notification && notification.count > 0 && (
                <div className="absolute right-5 h-5 w-5 rounded-full flex items-center justify-center text-white border md:right-5 bg-purple-500">
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
