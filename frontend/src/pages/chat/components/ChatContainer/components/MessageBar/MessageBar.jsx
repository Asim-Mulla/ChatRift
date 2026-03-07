import { useSocket } from "@/Context/SocketContext";
import { uploadFile } from "@/services/messageServices";
import { useAppStore } from "@/store/store";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { toast } from "sonner";
import VoiceMessage from "./VoiceMessage/VoiceMessage";

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

  const inputRef = useRef();
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
      toast.info("Message cannot be empty.");
      return;
    }

    if (message.trim().length >= 2000) {
      toast.info("Message cannot exceed 2000 characters.");
      return;
    }

    if (selectedChatType === "Contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        receiver: selectedChatData._id,
        content: message.trim(),
        messageType: "text",
        isGroupMessage: false,
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
            (notifier) => notifier.user === userInfo.id,
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
        content: message.trim(),
        messageType: "text",
        groupId: selectedChatData._id,
        isGroupMessage: true,
      });
      socket.emit("isTypingInGroup", {
        isTyping: false,
        from: userInfo,
        in: selectedChat,
      });
    }

    setMessage("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
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
                messageType: "file",
                isGroupMessage: false,
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
                    (notifier) => notifier.user === userInfo.id,
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
                      },
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
                messageType: "file",
                file: {
                  url: res.data.filePath,
                  fileName: res.data.fileName,
                  size: res.data.fileSize,
                  fileCloudName: res.data.fileCloudName,
                },
                groupId: selectedChatData._id,
                isGroupMessage: true,
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

  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleCloseEmojiPicker);

    return () => {
      document.removeEventListener("mousedown", handleCloseEmojiPicker);
    };
  }, [emojiRef]);

  return (
    <div className="min-h-[8vh] bg-[#1c1d25] flex items-end justify-center p-3 sm:p-4 gap-3 sm:gap-4">
      <div className="flex-1 flex bg-[#2a2b33] rounded-md items-end sm:gap-3 pr-3 min-w-0">
        <textarea
          ref={inputRef}
          className="max-h-[125px] flex-1 p-4 bg-transparent rounded-md focus:border-none focus:outline-none text-sm sm:text-base min-w-0 resize-none text-input-scrollbar"
          placeholder="Enter Message"
          value={message}
          onChange={(e) => {
            handleSetMessage(e);
            autoResize(e.target);
          }}
          onKeyDown={handleKeyPress}
          onInput={(e) => autoResize(e.target)}
          rows={1}
          maxLength={2000}
          disabled={uploading}
        />

        {/* Action buttons container */}
        <div className="flex items-center gap-2 sm:gap-5 lg:gap-7 flex-shrink-0 pb-3 sm:p-4">
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
              className="flex items-center justify-center text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer hover:text-white p-1 sm:p-0"
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

          {/* Voice Message Button */}
          <VoiceMessage />
        </div>
      </div>

      <button
        className={`bg-[#8417ff] rounded-md flex items-center justify-center p-4 focus:border-none hover:bg-[#741bda] focus:bg-[#741bda] focus:outline-none focus:text-white duration-300 transition-all flex-shrink-0 ${
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
