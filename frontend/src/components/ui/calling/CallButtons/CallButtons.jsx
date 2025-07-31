import { useSocket } from "@/Context/SocketContext";
import { useAppStore } from "@/store/store";
import { Phone, Video } from "lucide-react";
import { useState } from "react";

const CallButtons = () => {
  const socket = useSocket();
  const { selectedChatData, selectedChatType, userInfo } = useAppStore();
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);

  const initiateCall = async (callType) => {
    if (isInitiatingCall) return;

    setIsInitiatingCall(true);

    try {
      const channelName = `call_${userInfo.id.slice(
        -6
      )}_${selectedChatData._id.slice(-6)}_${Date.now().toString().slice(-4)}`;

      const callData = {
        callerId: userInfo.id,
        callerName: `${userInfo.firstName} ${userInfo.lastName}`,
        callerImage: userInfo.image?.url,
        receiverId: selectedChatData._id,
        receiverName: selectedChatData.firstName
          ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
          : selectedChatData.email,
        receiverImage: selectedChatData.image?.url,
        callType, // 'voice' or 'video'
        channelName,
        timestamp: Date.now(),
      };

      // Emit call initiation to server
      socket.emit("initiateCall", callData);

      // Set local call state
      const { setCallState } = useAppStore.getState();
      setCallState({
        isInCall: true,
        callType,
        channelName,
        isInitiator: true,
        remoteUser: {
          id: selectedChatData._id,
          name: callData.receiverName,
          image: selectedChatData.image?.url,
        },
      });
    } catch (error) {
      console.error("Error initiating call:", error);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  if (selectedChatType !== "Contact") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={() => initiateCall("voice")}
        disabled={isInitiatingCall}
        className="p-2 rounded-full bg-[#8417ff]/20 hover:bg-[#8417ff]/30 transition-colors duration-200 disabled:opacity-50"
        title="Voice Call"
      >
        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#8417ff]" />
      </button>

      <button
        onClick={() => initiateCall("video")}
        disabled={isInitiatingCall}
        className="p-2 rounded-full bg-[#8417ff]/20 hover:bg-[#8417ff]/30 transition-colors duration-200 disabled:opacity-50"
        title="Video Call"
      >
        <Video className="w-4 h-4 sm:w-5 sm:h-5 text-[#8417ff]" />
      </button>
    </div>
  );
};

export default CallButtons;
