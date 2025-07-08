import { useEffect, useState } from "react";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageBar from "./components/MessageBar/MessageBar";
import MessageContainer from "./components/MessageContainer/MessageContainer";
import { useAppStore } from "@/store/store";

const ChatConatiner = () => {
  const { selectedChatData, selectedChatType, userInfo, groups } =
    useAppStore();
  const [removed, setRemoved] = useState(false);
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

  useEffect(() => {
    if (
      selectedChatType === "Group" &&
      selectedChatData?._id &&
      userInfo.id !== selectedChatData.admin
    ) {
      setRemoved(
        !selectedChatData.members.find((member) => member._id === userInfo.id)
      );
    }
  }, [groups, selectedChatData]);

  return (
    <div className="fixed top-0 h-[calc(var(--vh)_*100)] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1">
      <ChatHeader />
      <MessageContainer />
      {!removed ? <MessageBar /> : null}
    </div>
  );
};

export default ChatConatiner;
