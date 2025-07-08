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
import { Button } from "@/components/ui/button";
import { useSocket } from "@/Context/SocketContext";
import { deleteGroup } from "@/services/groupServices";
import { useAppStore } from "@/store/store";
import { useState } from "react";
import { toast } from "sonner";

const DeleteGroupDialog = () => {
  const [openDeleteGroupModel, setOpenDeleteGroupModal] = useState(false);
  const {
    userInfo,
    leaveGroup,
    selectedChatData,
    selectedChatType,
    setSelectedChatMessages,
    setSelectedChatData,
    setSelectedChatType,
  } = useAppStore();
  const socket = useSocket();

  const handleDeleteGroup = async () => {
    if (selectedChatType === "Contact") {
      return toast.error("Something went wrong!");
    }

    if (selectedChatData.admin !== userInfo.id) {
      return toast.error("Access Denied");
    }

    try {
      return toast.promise(deleteGroup(selectedChatData._id), {
        loading: `Deleting group '${selectedChatData.name}' and its messages...`,
        success: (res) => {
          if (res.status === 200) {
            const deletedGroup = res.data.deletedGroup;

            leaveGroup(deletedGroup);
            setSelectedChatMessages([]);
            setSelectedChatData(null);
            setSelectedChatType(null);

            if (socket) {
              socket.emit("groupDeleted", deletedGroup);
            }

            return "Group deleted successfully";
          } else {
            throw new Error("Unexpected response");
          }
        },
        error: (err) => {
          console.log(err);
          return err?.response?.data?.message || "Failed to delete group";
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div>
      <Button
        className="w-full bg-red-800 hover:bg-red-500 active:bg-red-700 transition-all duration-300 cursor-pointer"
        onClick={() => setOpenDeleteGroupModal(true)}
      >
        Delete group
      </Button>
      <AlertDialog
        open={openDeleteGroupModel}
        onOpenChange={setOpenDeleteGroupModal}
      >
        <AlertDialogContent className="bg-[#181920] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group!</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#181920] hover:bg-gray-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-800 hover:bg-red-500"
              onClick={handleDeleteGroup}
            >
              delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeleteGroupDialog;
