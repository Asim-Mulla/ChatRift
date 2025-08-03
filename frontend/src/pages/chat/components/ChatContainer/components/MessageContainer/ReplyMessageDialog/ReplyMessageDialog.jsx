import { useSocket } from "@/Context/SocketContext";
import { useAppStore } from "@/store/store";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { MdReply } from "react-icons/md";
import { RiEmojiStickerLine } from "react-icons/ri";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ReplyMessage = ({ message }) => {
  const [openReplyDialog, setOpenReplyDialog] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const socket = useSocket();
  const emojiRef = useRef();
  const inputRef = useRef();

  const {
    userInfo,
    selectedChatData,
    selectedChatType,
    setReceiverUnreadCount,
    receiverUnreadCount,
    DMContacts,
    setDMContacts,
  } = useAppStore();

  const handleOpenReply = () => {
    setOpenReplyDialog(true);
    setReplyContent("");
    // Focus input after dialog opens
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleCloseReply = () => {
    setOpenReplyDialog(false);
    setReplyContent("");
    setEmojiPickerOpen(false);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      toast.info("Message reply cannot be empty.");
      return;
    }

    if (selectedChatType === "Contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        receiver: selectedChatData._id,
        content: replyContent,
        messageType: "text",
        reply: {
          isReply: true,
          to: message._id,
        },
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
        content: replyContent,
        messageType: "text",
        reply: {
          isReply: true,
          to: message._id,
        },
        file: null,
        groupId: selectedChatData._id,
      });

      socket.emit("isTypingInGroup", {
        isTyping: false,
        from: userInfo,
        in: selectedChat,
      });
    }

    setReplyContent("");
    setIsReplying(false);
    setOpenReplyDialog(false);
  };

  const handleCloseEmojiPicker = (event) => {
    if (emojiRef.current && !emojiRef.current.contains(event.target)) {
      setEmojiPickerOpen(false);
    }
  };

  const handleAddEmoji = (emoji) => {
    setReplyContent((prev) => prev + emoji.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    } else if (e.key === "Escape") {
      handleCloseReply();
    }
  };

  useEffect(() => {
    if (openReplyDialog) {
      document.addEventListener("mousedown", handleCloseEmojiPicker);
      return () => {
        document.removeEventListener("mousedown", handleCloseEmojiPicker);
      };
    }
  }, [openReplyDialog, emojiRef]);

  // Get the message content for display
  const getMessagePreview = () => {
    if (message?.messageType === "text") {
      return message?.content?.length > 50
        ? message?.content?.substring(0, 50) + "..."
        : message?.content;
    } else if (message?.messageType === "file") {
      return `${message?.file?.fileName || "File"}`;
    }

    return "Message";
  };

  const isOwnMessage =
    (message?.sender?._id || message?.sender) === userInfo?.id;

  return (
    <div>
      <button
        className={`absolute top-5 ${
          isOwnMessage ? "-left-12" : "-right-12"
        } bg-[#8417ff] hover:bg-[#741bda] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer`}
        onClick={handleOpenReply}
        title="Reply to message"
        type="button"
      >
        <MdReply className="text-md" />
      </button>

      <AlertDialog open={openReplyDialog} onOpenChange={setOpenReplyDialog}>
        <AlertDialogContent className="bg-[#181920] text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reply to Message</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Replying to:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            {/* Original message preview */}
            <div className="bg-[#2a2b33] rounded p-3 mb-4 border-l-4 border-[#8417ff]">
              <div className="text-sm text-gray-300">
                <span className="font-medium text-[#8417ff]">
                  {selectedChatType === "Group"
                    ? `${message.sender?.firstName} ${message.sender?.lastName}`
                    : isOwnMessage
                    ? "You"
                    : `${selectedChatData?.firstName} ${selectedChatData.lastName}`}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {getMessagePreview()}
              </div>
            </div>

            {/* Reply input with emoji picker */}
            <div className="flex bg-[#2a2b33] rounded items-center gap-2 pr-2 relative">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 p-3 bg-transparent rounded focus:border-none focus:outline-none text-sm min-w-0"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isReplying}
                placeholder="Type your reply..."
              />

              {/* Emoji picker button */}
              <div className="relative">
                <button
                  className="text-neutral-500 hover:text-white transition-colors p-1"
                  onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                  disabled={isReplying}
                  type="button"
                >
                  <RiEmojiStickerLine className="text-lg" />
                </button>

                {/* Emoji picker */}
                <div
                  className="absolute bottom-8 right-0 z-50"
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
                    height={300}
                  />
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-[#181920] hover:bg-gray-800 hover:text-white cursor-pointer"
              onClick={handleCloseReply}
              disabled={isReplying}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`bg-[#8417ff] hover:bg-[#741bda] ${
                isReplying || !replyContent.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              onClick={handleSendReply}
              disabled={isReplying || !replyContent.trim()}
            >
              {isReplying ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  Sending...
                </div>
              ) : (
                "Reply"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReplyMessage;
