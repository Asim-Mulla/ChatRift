"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { logout } from "@/services/authServices";
import { useAppStore } from "@/store/store";
import { GoVerified } from "react-icons/go";
import { MdEdit, MdOutlineLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProfileInfo = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await logout();
      if (res.status === 200) {
        navigate("/auth");
        setUserInfo(null);
        toast.success("Logout Successful");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className=" flex items-center justify-between py-3 px-6  w-full bg-[#2a2b33] border-t border-[#2f303b]">
      <div className="flex gap-3 items-center justify-start flex-1 min-w-0">
        <div className="w-12 h-12 relative">
          <Avatar className="h-12 w-12  rounded-full overflow-hidden">
            {userInfo?.image?.url ? (
              <AvatarImage
                src={userInfo?.image?.url || "/placeholder.svg"}
                alt="profile"
                className={"object-cover w-full h-full bg-black"}
                loading="lazy"
              />
            ) : (
              <div
                className={`uppercase h-12 w-12  text-lg border flex justify-center items-center rounded-full ${getColor(
                  userInfo?.color
                )}`}
              >
                {userInfo?.firstName && userInfo?.lastName
                  ? userInfo?.firstName.trim().charAt(0).toUpperCase() +
                    userInfo?.lastName.trim().charAt(0).toUpperCase()
                  : userInfo?.email?.split("").shift()}
              </div>
            )}
          </Avatar>
        </div>
        <span
          title={`${userInfo?.firstName} ${userInfo?.lastName}`}
          className="truncate block text-sm text-white min-w-0"
        >
          {userInfo?.firstName && userInfo?.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : userInfo?.email}
        </span>
        {userInfo.verified && (
          <span className="mr-5">
            <GoVerified />
          </span>
        )}
      </div>
      <div className="flex gap-5">
        <MdEdit
          className="hover:text-gray-400 text-lg cursor-pointer"
          onClick={() => navigate("/profile")}
        />
        <MdOutlineLogout
          className="text-red-400 text-lg hover:text-red-400 cursor-pointer"
          onClick={handleLogout}
        />
      </div>
    </div>
  );
};

export default ProfileInfo;
