import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/store";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { colors, getColor } from "@/lib/utils";
import { LuPlus, LuTrash } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { AiOutlineLoading } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  addProfileImage,
  deleteProfileImage,
  updateProfile,
} from "@/services/authServices";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo, setUserNotifications } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState({});
  const [imagePreview, setImagePreview] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [hovered, setHovered] = useState();
  const [selectedColor, setSelectedColor] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const validateProfile = () => {
    if (!firstName && !lastName) {
      toast.error("First and last name is required!");
      return false;
    } else if (!firstName) {
      toast.error("First name is required!");
      return false;
    } else if (!lastName) {
      toast.error("Last name is required!");
      return false;
    }

    return true;
  };
  const handleDeleteImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handlePreviewImage = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImageFile(file);
      const previewImageUrl = URL.createObjectURL(file);
      setImagePreview({ url: previewImageUrl, filename: file.name });
    }
  };

  const handleProfileImageChanges = async () => {
    if (imageFile) {
      const formData = new FormData();

      formData.append("profile-image", imageFile);

      try {
        setLoading(true);
        const res = await addProfileImage(formData);
        if (res.status === 200) {
          setImageFile(null);
          setImage(res.data.image);
          setImagePreview(res.data.image);
          setLoading(false);
          toast.success("Profile image updated");
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data);
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const res = await deleteProfileImage();
        if (res.status === 200) {
          setImageFile(null);
          setImage(null);
          setImagePreview(null);
          setLoading(false);
          toast.success("Profile image updated");
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data);
        setLoading(false);
      }
    }
  };

  const handleSaveChange = async () => {
    if (validateProfile()) {
      try {
        const res = await updateProfile(firstName, lastName, selectedColor);
        if (res.status == 200 && res.data.user) {
          setUserInfo(res.data.user);
          setUserNotifications(res.data.user.notifications);
          toast.success("Profile info updated successfully");
          navigate("/chat");
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data);
      }
    }
  };

  const handleBack = () => {
    if (userInfo.profileSetup) {
      navigate("/chat");
    } else {
      toast("Please setup profile");
    }
  };

  useEffect(() => {
    if (userInfo?.profileSetup) {
      setFirstName(userInfo.firstName);
      setLastName(userInfo.lastName);
      setSelectedColor(userInfo.color);
      if (userInfo.image?.url) {
        setImage(userInfo.image);
        setImagePreview(userInfo.image);
      }
    }
  }, []);

  useEffect(() => {
    const setViewportHeight = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set it on load
    setViewportHeight();

    // Update it on resize (optional)
    window.addEventListener("resize", setViewportHeight);
  }, []);

  return (
    <div className="bg-[#1b1c24] h-[calc(var(--vh)_*100)] flex items-center justify-center flex-col gap-10">
      <div className="flex flex-col gap-10 w-[80vw] md:w-max">
        <div>
          <IoArrowBack
            className="text-4xl lg:text-6xl text-white/90 cursor-pointer"
            onClick={handleBack}
          />
        </div>
        <div className="grid grid-cols-2">
          <div className="flex flex-col items-center justify-evenly md:justify-between">
            <div
              className="h-25 w-25 md:w-35 md:h-35 relative flex items-center justify-center"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Avatar className="h-25 w-25 md:w-35 md:h-35 rounded-full overflow-hidden">
                {imagePreview?.url ? (
                  <AvatarImage
                    src={imagePreview?.url}
                    alt="profile"
                    className={"object-cover w-full h-full bg-black"}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`uppercase h-25 w-25 md:w-35 md:h-35 text-5xl border flex justify-center items-center rounded-full ${getColor(
                      selectedColor
                    )}`}
                  >
                    {firstName && lastName
                      ? firstName.trim().charAt(0).toUpperCase() +
                        lastName.trim().charAt(0).toUpperCase()
                      : userInfo?.email?.split("").shift()}
                  </div>
                )}
              </Avatar>
              {hovered && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 ring-fuchsia-50 rounded-full"
                  onClick={
                    imagePreview?.url ? handleDeleteImage : handleFileClick
                  }
                >
                  {imagePreview?.url ? (
                    <LuTrash className="text-white text-3xl cursor-pointer" />
                  ) : (
                    <LuPlus className="text-white text-3xl cursor-pointer" />
                  )}
                </div>
              )}
              {loading && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 ring-fuchsia-50 rounded-full"
                  onClick={
                    imagePreview?.url ? handleDeleteImage : handleFileClick
                  }
                >
                  <AiOutlineLoading className="text-white text-3xl animate-spin" />
                </div>
              )}
              {
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePreviewImage}
                  className="opacity-0 w-full"
                  name="profile-image"
                  accept=".png, .jpg, .svg, .jpeg, .webp"
                  hidden
                />
              }
            </div>
            <div>
              <Button
                className={`p-4 bg-purple-700 hover:bg-purple-900 disabled:bg-purple-500 transition-all duration-300 cursor-pointer `}
                onClick={handleProfileImageChanges}
                disabled={
                  (!imageFile && !image?.url && !imagePreview?.url) ||
                  image?.url === imagePreview?.url ||
                  loading
                }
              >
                Save image
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center min-w-32 gap-5 md:min-w-64 flex-col text-white">
            <div className="w-full">
              <Input
                placeholder="Email"
                type="email"
                disabled
                value={userInfo.email}
                className={"rounded-lg p-6 bg-[#2c2e3b] border-none"}
              />
            </div>
            <div className="w-full">
              <Input
                placeholder="First Name"
                type="text"
                value={firstName}
                maxLength="20"
                onChange={(e) => setFirstName(e.target.value)}
                className={"rounded-lg p-6 bg-[#2c2e3b] border-none"}
              />
            </div>
            <div className="w-full">
              <Input
                placeholder="Last Name"
                type="text"
                maxLength="20"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={"rounded-lg p-6 bg-[#2c2e3b] border-none"}
              />
            </div>
            <div className="w-full flex gap-2 md:gap-5">
              {colors?.map((color, index) => (
                <div
                  key={index}
                  className={`${color} h-8 w-8 rounded-full cursor-pointer transition-all duration-300 ${
                    selectedColor === index ? "outline outline-white/100" : ""
                  }`}
                  onClick={() => setSelectedColor(index)}
                ></div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full">
          <Button
            className="p-6 w-full bg-purple-700 hover:bg-purple-900 disabled:bg-purple-500 transition-all duration-300 cursor-pointer"
            onClick={handleSaveChange}
            // disabled={loading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
