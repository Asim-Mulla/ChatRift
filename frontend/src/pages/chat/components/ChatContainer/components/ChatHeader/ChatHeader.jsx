import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/Context/SocketContext";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store/store";
import { useEffect, useState } from "react";
import EditGroupModel from "../EditGroupModel/EditGroupModel";
import ExitGroupModel from "../ExitGroupModel/ExitGroupModel";
import { FaArrowLeft } from "react-icons/fa";

const ChatHeader = () => {
  const socket = useSocket();
  const {
    userInfo,
    closeChat,
    selectedChatData,
    selectedChatType,
    groups,
    DMOnlineContacts,
  } = useAppStore();
  const [isTyping, setIsTyping] = useState(false);
  const [isTypingInGroup, setIsTypingInGroup] = useState({
    typing: false,
    typer: "",
  });
  const [chatName, setChatName] = useState("");
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (selectedChatType === "Contact") {
      if (selectedChatData?.firstName) {
        setChatName(
          `${selectedChatData.firstName} ${selectedChatData.lastName}`
        );
      } else {
        setChatName(selectedChatData?.email);
      }
    } else if (selectedChatType === "Group") {
      setChatName(selectedChatData?.name);
    }
  }, [selectedChatData]);

  useEffect(() => {
    if (!isTyping) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isTyping]);

  useEffect(() => {
    if (!isTypingInGroup.typing) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsTypingInGroup((prev) => ({ ...prev, typing: false }));
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isTypingInGroup]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("otherPersonTypingInDM", (typingData) => {
      if (typingData.isTyping && typingData.from === selectedChatData._id) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }
    });

    socket.on("personTypingInGroup", (typingData) => {
      if (
        selectedChatType === "Group" &&
        selectedChatData._id === typingData.in._id
      ) {
        setIsTypingInGroup({
          typing: typingData.typing,
          typer: `${typingData.typer.firstName} ${typingData.typer.lastName}`,
        });
      }
    });
  }, [socket]);

  useEffect(() => {
    if (
      selectedChatType === "Group" &&
      selectedChatData?._id &&
      userInfo.id !== selectedChatData.admin
    ) {
      setRemoved(
        !selectedChatData.members.find((member) => member._id === userInfo.id)
      );
    }
  }, [groups, selectedChatData]);

  return (
    <div className="border-b-2 border-[#2f303b] flex items-center justify-between px-6 py-4">
      <div className="w-full flex items-center justify-between gap-5">
        <div className="flex gap-5 items-center justify-center">
          <div className="flex justify-center items-center">
            <button
              className="text-neutral-400 text-2xl focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer"
              onClick={() => closeChat()}
            >
              <FaArrowLeft />
            </button>
          </div>
          <div className="flex gap-3 items-center justify-center">
            <div className="w-10 h-10 relative">
              {selectedChatType === "Contact" ? (
                <Avatar className="h-10 w-10  rounded-full overflow-hidden">
                  {selectedChatData?.image?.url ? (
                    <AvatarImage
                      src={selectedChatData?.image?.url}
                      alt="profile"
                      className={"object-cover w-full h-full bg-black"}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`uppercase h-10 w-10  text-lg border flex justify-center items-center rounded-full ${getColor(
                        selectedChatData?.color
                      )}`}
                    >
                      {selectedChatData?.firstName && selectedChatData?.lastName
                        ? selectedChatData?.firstName
                            .trim()
                            .charAt(0)
                            .toUpperCase() +
                          selectedChatData?.lastName
                            .trim()
                            .charAt(0)
                            .toUpperCase()
                        : selectedChatData?.email?.split("").shift()}
                    </div>
                  )}
                </Avatar>
              ) : (
                <div className="bg-[#ffffff22] h-10 w-10 flex  items-center justify-center rounded-full">
                  <span>#</span>
                </div>
              )}
            </div>
            <div>
              <div>{chatName}</div>
              {selectedChatData && (
                <div className="text-xs sm:text-sm font-semibold text-gray-500 italic">
                  {isTyping
                    ? "typing..."
                    : DMOnlineContacts?.includes(String(selectedChatData._id))
                    ? "online"
                    : null}
                </div>
              )}
              {selectedChatData &&
              selectedChatType === "Group" &&
              isTypingInGroup.typing ? (
                <div className="text-xs sm:text-sm font-semibold text-gray-500 italic">
                  {isTypingInGroup?.typer} is typing...
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-5">
          {selectedChatType === "Group" &&
          selectedChatData?.admin === userInfo?.id ? (
            <EditGroupModel />
          ) : selectedChatType === "Group" && !removed ? (
            <ExitGroupModel />
          ) : null}

          {/* <button
            className="text-neutral-500 text-3xl focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer"
            onClick={() => closeChat()}
          >
            <IoClose />
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
