import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/Context/SocketContext";
import { useAppStore } from "@/store/store";
import { getColor } from "@/lib/utils";

const IncomingCallModal = () => {
  const socket = useSocket();
  const {
    incomingCall,
    setIncomingCall,
    setCallState,
    setAlreadyRinging,
    setCallAccepted,
  } = useAppStore();

  if (!incomingCall) {
    return null;
  }

  const acceptCall = () => {
    socket.emit("acceptCall", {
      callId: incomingCall.callId,
      accepterId: incomingCall.receiverId,
      callerId: incomingCall.callerId,
    });
    setCallAccepted(true);

    setCallState({
      isInCall: true,
      callType: incomingCall.callType,
      channelName: incomingCall.channelName,
      isInitiator: false,
      remoteUser: {
        id: incomingCall.callerId,
        name: incomingCall.callerName,
        image: incomingCall.callerImage,
      },
    });

    setAlreadyRinging(false);
    setIncomingCall(null);
  };

  const declineCall = () => {
    socket.emit("declineCall", {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId,
      declinerId: incomingCall.receiverId,
      callType: incomingCall.callType,
    });

    setAlreadyRinging(false);
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1b1c24] rounded-2xl p-8 max-w-sm w-full mx-4 border border-[#2f303b]">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-[#8417ff]/30">
                {incomingCall.callerImage ? (
                  <AvatarImage
                    src={incomingCall.callerImage || "/placeholder.svg"}
                    alt="caller"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <div
                    className={`uppercase h-24 w-24 text-2xl border flex justify-center items-center rounded-full ${getColor(
                      0
                    )}`}
                  >
                    {incomingCall.callerName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-[#8417ff] rounded-full p-2">
                {incomingCall.callType === "video" ? (
                  <Video className="w-4 h-4 text-white" />
                ) : (
                  <Phone className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {incomingCall.callerName}
          </h3>
          <p className="text-gray-400 mb-8">
            Incoming {incomingCall.callType} call...
          </p>
          <div className="flex justify-center gap-8">
            <button
              onClick={declineCall}
              className="bg-red-500 hover:bg-red-600 p-4 rounded-full transition-colors duration-200 shadow-lg"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={acceptCall}
              className="bg-green-500 hover:bg-green-600 p-4 rounded-full transition-colors duration-200 shadow-lg animate-pulse"
            >
              <Phone className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
