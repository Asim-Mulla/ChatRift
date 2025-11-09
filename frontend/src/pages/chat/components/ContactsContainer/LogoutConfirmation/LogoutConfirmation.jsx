import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { FaPowerOff } from "react-icons/fa";
import { toast } from "sonner";
import { MdOutlineLogout } from "react-icons/md";

const LogoutConfirmation = ({ onLogout }) => {
  const [openLogoutModal, setOpenLogoutModal] = useState(false);

  //   const handleLogout = async () => {
  //     try {
  //       // You can call your actual logout API or clear local storage here
  //       toast.success("Logged out successfully!");
  //       setOpenLogoutModal(false);

  //       if (onLogout) onLogout(); // optional callback
  //     } catch (error) {
  //       console.error(error);
  //       toast.error("Failed to logout. Please try again.");
  //     }
  //   };

  return (
    <div>
      <MdOutlineLogout
        className="text-red-400 text-lg hover:text-red-500 cursor-pointer"
        onClick={() => setOpenLogoutModal(true)}
      />

      <Dialog open={openLogoutModal} onOpenChange={setOpenLogoutModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[220px] flex flex-col items-center justify-between p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold text-white">
              Confirm Logout
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-400 text-center">
            Are you sure you want to log out of your account?
          </p>

          <div className="flex w-full justify-between gap-4">
            <Button
              className="flex-1 bg-[#2c2e3b] hover:bg-[#383b4a] transition-all duration-300"
              onClick={() => setOpenLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-700 transition-all duration-300"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogoutConfirmation;
