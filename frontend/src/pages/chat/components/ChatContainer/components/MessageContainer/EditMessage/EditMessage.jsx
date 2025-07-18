import { useSocket } from "@/Context/SocketContext";
import { useAppStore } from "@/store/store";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { MdEdit } from "react-icons/md";
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
import { editMessage } from "@/services/messageServices";

const EditMessage = ({ message }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const socket = useSocket();
  const emojiRef = useRef();
  const inputRef = useRef();

  const { userInfo, selectedChatData, selectedChatType, updateMessageInStore } =
    useAppStore();

  const isOwnMessage = (message.sender._id || message.sender) === userInfo.id;

  const handleOpenEdit = () => {
    setOpenEditDialog(true);
    setEditedContent(message.content);
    // Focus input after dialog opens
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }
    }, 100);
  };

  const handleCloseEdit = () => {
    setOpenEditDialog(false);
    setEditedContent(message.content);
    setEmojiPickerOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (editedContent.trim() === message.content) {
      setOpenEditDialog(false);
      return;
    }

    setIsUpdating(true);

    try {
      toast.promise(editMessage(message, editedContent), {
        loading: "Editing message...",
        success: (res) => {
          if (res.status === 200) {
            if (socket) {
              socket.emit("messageEdited", {
                editedMessage: res.data.editedMessage,
                group:
                  selectedChatType === "Group"
                    ? {
                        members: selectedChatData.members.map(
                          (member) => member?._id
                        ),
                        admin: selectedChatData.admin,
                        groupId: selectedChatData._id,
                      }
                    : null,
              });
            }

            return "Message edited successfully";
          } else {
            console.log(res);
            throw new Error("Something went wrong!");
          }
        },
        error: (err) => {
          console.log(err);
          return err?.response?.data || "Error while editing message.";
        },
      });
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    } finally {
      setIsUpdating(false);
      setOpenEditDialog(false);
    }
  };

  const handleCloseEmojiPicker = (event) => {
    if (emojiRef.current && !emojiRef.current.contains(event.target)) {
      setEmojiPickerOpen(false);
    }
  };

  const handleAddEmoji = (emoji) => {
    setEditedContent((prev) => prev + emoji.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCloseEdit();
    }
  };

  useEffect(() => {
    if (openEditDialog) {
      document.addEventListener("mousedown", handleCloseEmojiPicker);
      return () => {
        document.removeEventListener("mousedown", handleCloseEmojiPicker);
      };
    }
  }, [openEditDialog, emojiRef]);

  if (!isOwnMessage || message.messageType !== "text" || message.deleted) {
    return null;
  }

  return (
    <div>
      <button
        className={`absolute -bottom-2 ${
          isOwnMessage ? "-left-2" : "-right-2"
        } bg-[#8417ff] hover:bg-[#741bda] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer`}
        onClick={handleOpenEdit}
        title="Edit message"
        type="button"
      >
        <MdEdit className="text-md" />
      </button>

      <AlertDialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <AlertDialogContent className="bg-[#181920] text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Message</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Make changes to your message below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            {/* Input with emoji picker */}
            <div className="flex bg-[#2a2b33] rounded items-center gap-2 pr-2 relative">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 p-3 bg-transparent rounded focus:border-none focus:outline-none text-sm min-w-0"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isUpdating}
                placeholder="Edit your message..."
              />

              {/* Emoji picker button */}
              <div className="relative">
                <button
                  className="text-neutral-500 hover:text-white transition-colors p-1"
                  onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                  disabled={isUpdating}
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
              onClick={handleCloseEdit}
              disabled={isUpdating}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`bg-[#8417ff] hover:bg-[#741bda] ${
                isUpdating ||
                !editedContent.trim() ||
                editedContent === message.content
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              onClick={handleSaveEdit}
              disabled={
                isUpdating ||
                !editedContent.trim() ||
                editedContent === message.content
              }
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  Saving...
                </div>
              ) : (
                "Edit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditMessage;
