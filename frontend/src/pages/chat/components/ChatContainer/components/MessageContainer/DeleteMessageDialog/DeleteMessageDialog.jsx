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
import { useSocket } from "@/Context/SocketContext";
import { deleteMessage, deleteMessageForMe } from "@/services/messageServices";
import { useAppStore } from "@/store/store";
import { useState } from "react";
import { MdOutlineDelete } from "react-icons/md";
import { toast } from "sonner";

const DeleteMessageDialog = ({ message, isOwnMessage, isAdmin = false }) => {
  const [openDeleteMessageDialog, setOpenDeleteMessageDialog] = useState(false);
  const [deletingMessages, setDeletingMessages] = useState(new Set());
  const socket = useSocket();
  const { selectedChatData, selectedChatType, deleteMessageFromStore } =
    useAppStore();

  const handleDeleteMessage = async (message) => {
    if (deletingMessages.has(message._id)) return;

    setDeletingMessages((prev) => new Set([...prev, message._id]));
    const messageId = message._id;
    const groupData =
      selectedChatType === "Group" ? { groupId: selectedChatData._id } : null;

    try {
      toast.promise(deleteMessage(messageId, groupData), {
        loading: "Deleting message...",
        success: (res) => {
          if (res.status === 200) {
            deleteMessageFromStore(res.data.message);

            if (socket) {
              const data = {
                message: res.data.message,
                chatType: selectedChatType,
                groupId: selectedChatData._id,
              };

              if (selectedChatType === "Contact") {
                socket.emit("deleteMessage", data);
              } else if (selectedChatType === "Group") {
                socket.emit("deleteGroupMessage", data);
              }
            }

            return "Message deleted successfully!";
          } else {
            console.log(res);
            throw new Error("Something went wrong!");
          }
        },
        error: (err) => {
          console.log(err);
          console.log(err.response.data);
          return err?.response?.data || "Error while deleting message.";
        },
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeletingMessages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(message._id);
        return newSet;
      });
    }
  };

  const handleDeleteMessageForMe = async (message) => {
    if (deletingMessages.has(message._id)) return;

    setDeletingMessages((prev) => new Set([...prev, message._id]));
    const messageId = message._id;
    const groupData =
      selectedChatType === "Group" ? { groupId: selectedChatData._id } : null;

    try {
      toast.promise(deleteMessageForMe(messageId, groupData), {
        loading: "Deleting message...",
        success: (res) => {
          if (res.status === 200) {
            deleteMessageFromStore(res.data.message);
            return "Message deleted successfully!";
          } else {
            console.log(res);
            throw new Error("Something went wrong!");
          }
        },
        error: (err) => {
          console.log(err);
          console.log(err.response.data);
          return err?.response?.data || "Error while deleting message.";
        },
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeletingMessages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(message._id);
        return newSet;
      });
    }
  };

  const canDeleteForEveryone =
    (isOwnMessage || isAdmin) &&
    message.messageType !== "voice-call" &&
    message.messageType !== "video-call";

  return (
    <div>
      <button
        className={`absolute -bottom-2 ${
          isOwnMessage ? "-left-2" : "-right-2"
        } bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer`}
        onClick={() => setOpenDeleteMessageDialog(true)}
        disabled={deletingMessages.has(message._id)}
        title="Delete message"
      >
        {deletingMessages.has(message._id) ? (
          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
        ) : (
          <MdOutlineDelete className="text-md" />
        )}
      </button>
      <AlertDialog
        open={openDeleteMessageDialog}
        onOpenChange={setOpenDeleteMessageDialog}
      >
        {/* <AlertDialogTrigger>Open</AlertDialogTrigger> */}
        <AlertDialogContent className="bg-[#181920] text-white border-1 border-gray-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Deleting Message!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-400">
              Are you sure you want to delete this message?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex !flex-col">
            {canDeleteForEveryone && (
              <AlertDialogAction
                className="bg-red-800 hover:bg-red-700"
                onClick={() => handleDeleteMessage(message)}
              >
                Delete for everyone
              </AlertDialogAction>
            )}
            <AlertDialogAction
              className="bg-red-800 hover:bg-red-700"
              onClick={() => handleDeleteMessageForMe(message)}
            >
              Delete for me
            </AlertDialogAction>
            <AlertDialogCancel className="bg-[#181920] hover:bg-gray-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeleteMessageDialog;
