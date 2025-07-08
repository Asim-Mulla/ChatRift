import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSocket } from "@/Context/SocketContext";
import { exitGroup } from "@/services/groupServices";
import { useAppStore } from "@/store/store";
import { useState } from "react";
import { TbLogout } from "react-icons/tb";
import { toast } from "sonner";

const ExitGroupModel = () => {
  const [openExitGroupModel, setOpenExitGroupModal] = useState(false);
  const { userInfo, selectedChatData, updateGroup } = useAppStore();
  const socket = useSocket();

  const handleExitGroup = async () => {
    try {
      return toast.promise(exitGroup(selectedChatData._id), {
        loading: `Leaving group "${selectedChatData.name}"...`,
        success: (res) => {
          if (res.status === 200) {
            const group = res.data.group;

            updateGroup(group);

            if (socket) {
              socket.emit("leftGroup", { group, userId: userInfo.id });
            }

            return `Left group "${group.name}"`;
          } else {
            throw new Error("Unexpected response");
          }
        },
        error: (err) => {
          console.log(err);
          return err?.response?.data?.message || "Failed to leave group";
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div>
      <TbLogout
        className="text-neutral-400 text-2xl  focus:border-none focus:outline-none focus:text-white duration-300 transition-all cursor-pointer"
        onClick={() => {
          setOpenExitGroupModal(true);
        }}
      />
      <AlertDialog
        open={openExitGroupModel}
        onOpenChange={setOpenExitGroupModal}
      >
        <AlertDialogContent className="bg-[#181920] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Group!</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to leave this group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#181920] hover:bg-gray-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-800 hover:bg-red-500"
              onClick={handleExitGroup}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExitGroupModel;
