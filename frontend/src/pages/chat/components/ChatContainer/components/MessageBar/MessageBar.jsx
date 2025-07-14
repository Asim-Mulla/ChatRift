import { useSocket } from "@/Context/SocketContext";
import { uploadFile } from "@/services/messageServices";
import { useAppStore } from "@/store/store";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { toast } from "sonner";

const MessageBar = () => {
  const socket = useSocket();
  const [message, setMessage] = useState("");
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    receiverUnreadCount,
    setReceiverUnreadCount,
    DMContacts,
    setDMContacts,
  } = useAppStore();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const emojiRef = useRef();
  const fileRef = useRef();

  const handleSetMessage = (e) => {
    if (selectedChatType === "Contact") {
      if (e.target.value.trim()) {
        socket.emit("isTypingInDM", {
          isTyping: true,
          from: userInfo.id,
          to: selectedChatData._id,
        });
      } else {
        socket.emit("isTypingInDM", {
          isTyping: false,
          from: userInfo.id,
          to: selectedChatData._id,
        });
      }
    } else {
      const selectedChat = {
        _id: selectedChatData._id,
        name: selectedChatData.name,
        members: selectedChatData.members,
        admin: selectedChatData.admin,
      };
      if (e.target.value.trim()) {
        socket.emit("isTypingInGroup", {
          isTyping: true,
          from: userInfo,
          in: selectedChat,
        });
      } else {
        socket.emit("isTypingInGroup", {
          isTyping: false,
          from: userInfo,
          in: selectedChat,
        });
      }
    }

    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      return;
    }
    if (selectedChatType === "Contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        receiver: selectedChatData._id,
        content: message,
        messageType: "text",
        file: null,
      });
      socket.emit("isTypingInDM", {
        isTyping: false,
        from: userInfo.id,
        to: selectedChatData._id,
      });

      setReceiverUnreadCount(receiverUnreadCount + 1);

      const updatedDMContacts = DMContacts.map((contact) => {
        if (contact._id === selectedChatData._id) {
          const notifications = contact.notifications?.find(
            (notifier) => notifier.user === userInfo.id
          );
          let updatedNotifications = null;
          if (notifications) {
            updatedNotifications = contact.notifications.map((notifier) => {
              if (notifier.user === userInfo.id) {
                return { ...notifier, count: notifier.count + 1 };
              } else {
                return notifier;
              }
            });
          } else {
            updatedNotifications = [{ user: userInfo.id, count: 1 }];
          }
          contact.notifications = updatedNotifications;
        }
        return contact;
      });
      setDMContacts(updatedDMContacts);
    } else if (selectedChatType === "Group") {
      const selectedChat = {
        _id: selectedChatData._id,
        name: selectedChatData.name,
        members: selectedChatData.members,
        admin: selectedChatData.admin,
      };
      socket.emit("sendGroupMessage", {
        sender: userInfo.id,
        content: message,
        messageType: "text",
        file: null,
        groupId: selectedChatData._id,
      });
      socket.emit("isTypingInGroup", {
        isTyping: false,
        from: userInfo,
        in: selectedChat,
      });
    }

    setMessage("");
  };

  const handleAttachmentClick = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleCloseEmojiPicker = (event) => {
    if (emojiRef.current && !emojiRef.current.contains(event.target)) {
      setEmojiPickerOpen(false);
    }
  };

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (<5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.promise(uploadFile(formData), {
        loading: "Uploading file...",
        success: (res) => {
          if (res.status === 200 && res.data.filePath) {
            if (selectedChatType === "Contact") {
              socket.emit("sendMessage", {
                sender: userInfo.id,
                receiver: selectedChatData._id,
                content: null,
                messageType: "file",
                file: {
                  url: res.data.filePath,
                  fileName: res.data.fileName,
                  size: res.data.fileSize,
                  fileCloudName: res.data.fileCloudName,
                },
              });

              setReceiverUnreadCount(receiverUnreadCount + 1);

              const updatedDMContacts = DMContacts.map((contact) => {
                if (contact._id === selectedChatData._id) {
                  const notifications = contact.notifications?.find(
                    (notifier) => notifier.user === userInfo.id
                  );
                  let updatedNotifications = null;
                  if (notifications) {
                    updatedNotifications = contact.notifications.map(
                      (notifier) => {
                        if (notifier.user === userInfo.id) {
                          return { ...notifier, count: notifier.count + 1 };
                        } else {
                          return notifier;
                        }
                      }
                    );
                  } else {
                    updatedNotifications = [{ user: userInfo.id, count: 1 }];
                  }
                  contact.notifications = updatedNotifications;
                }
                return contact;
              });
              setDMContacts(updatedDMContacts);
            } else if (selectedChatType === "Group") {
              socket.emit("sendGroupMessage", {
                sender: userInfo.id,
                content: null,
                messageType: "file",
                file: {
                  url: res.data.filePath,
                  fileName: res.data.fileName,
                  size: res.data.fileSize,
                  fileCloudName: res.data.fileCloudName,
                },
                groupId: selectedChatData._id,
              });
            }
            return "File uploaded successfully!";
          } else {
            console.log(res);
            throw new Error("Upload failed: Something went wrong!.");
          }
        },
        error: (err) =>
          err?.response?.data?.error || "Upload failed. Please try again.",
      });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleCloseEmojiPicker);

    return () => {
      document.removeEventListener("mousedown", handleCloseEmojiPicker);
    };
  }, [emojiRef]);

  return (
    <div className="min-h-[8vh] bg-[#1c1d25] flex items-center justify-center  px-4  py-4 gap-4">
      <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center  gap-3   pr-3  min-w-0">
        <input
          type="text"
          className="flex-1  p-4 bg-transparent rounded-md focus:border-none focus:outline-none text-sm sm:text-base min-w-0"
          placeholder="Enter Message"
          value={message}
          onChange={handleSetMessage}
          onKeyPress={handleKeyPress}
          disabled={uploading}
        />

        {/* Action buttons container */}
        <div className="flex items-center gap-3 sm:gap-5 md:gap-5 lg:gap-7 flex-shrink-0">
          <button
            className={`text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer hover:text-white p-1 sm:p-0 ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleAttachmentClick}
            disabled={uploading}
          >
            <GrAttachment className="text-base sm:text-lg md:text-xl" />
          </button>

          <input
            type="file"
            className="hidden"
            ref={fileRef}
            onChange={handleAttachmentChange}
            accept="image/*,.pdf,.txt,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4"
            disabled={uploading}
          />

          <div className="relative">
            <button
              className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer hover:text-white p-1 sm:p-0"
              onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
              disabled={uploading}
            >
              <RiEmojiStickerLine className="text-base sm:text-lg md:text-xl" />
            </button>

            {/* Responsive emoji picker positioning */}
            <div
              className="absolute bottom-12 sm:bottom-16 right-0 z-50"
              ref={emojiRef}
              style={{
                transform: "translateX(calc(100% - 280px))",
                maxWidth: "calc(100vw - 20px)",
              }}
            >
              <EmojiPicker
                theme="dark"
                open={emojiPickerOpen}
                onEmojiClick={handleAddEmoji}
                autoFocusSearch={false}
                width={Math.min(280, window.innerWidth - 20)}
                height={350}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        className={`bg-[#8417ff] rounded-md flex items-center justify-center p-4  focus:border-none hover:bg-[#741bda] focus:bg-[#741bda] focus:outline-none focus:text-white duration-300 transition-all flex-shrink-0 ${
          uploading || !message.trim() ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleSendMessage}
        disabled={uploading || !message.trim()}
      >
        <IoSend className="text-base sm:text-lg md:text-xl" />
      </button>
    </div>
  );
};

export default MessageBar;
