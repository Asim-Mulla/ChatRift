import { useAppStore } from "@/store/store";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import EmptyChatContainer from "./components/EmptyChatContainer/EmptyChatContainer";
import ChatConatiner from "./components/ChatContainer/ChatConatiner";
import "../../index.css";
import ContactsContainer from "./components/ContactsContainer/ContactsContainer";

const Chat = () => {
  const { userInfo, selectedChatType } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo?.profileSetup) {
      toast("Please setup the profile to continue");
      navigate("/profile");
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    const setViewportHeight = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setViewportHeight();

    window.addEventListener("resize", setViewportHeight);
  }, []);

  return (
    <div className="flex h-[calc(var(--vh)_*100)] text-white overflow-hidden">
      <ContactsContainer />
      {selectedChatType === null ? <EmptyChatContainer /> : <ChatConatiner />}
    </div>
  );
};

export default Chat;
