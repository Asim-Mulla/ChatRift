import { useEffect, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/store";
import { useSocket } from "@/Context/SocketContext";
import { getColor } from "@/lib/utils";
import AgoraRTC from "agora-rtc-sdk-ng";
import { generateAgoraToken } from "@/services/agoraServices";
import { toast } from "sonner";

const CallInterface = () => {
  const socket = useSocket();
  const {
    callState,
    setCallState,
    userInfo,
    setAlreadyRinging,
    callAccepted,
    setCallAccepted,
  } = useAppStore();
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");

  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    if (!callState?.isInCall) return;

    initializeCall();

    return () => {
      runCleanup();
    };
  }, [callState?.isInCall]);

  useEffect(() => {
    if (isConnected) {
      startCallTimer();
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setCallDuration(0);
    }
    // Clean up timer on unmount
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      setConnectionStatus("Getting authentication token...");

      // Generate Agora token
      let tokenData = null;
      try {
        const res = await generateAgoraToken(
          callState?.channelName,
          userInfo?.id,
          "publisher"
        );

        if (res.status === 200) {
          tokenData = res.data;
        } else {
          console.log(res);
          throw new Error("Error while generating agora token.");
        }
      } catch (error) {
        console.error(error);
        throw new Error(error);
      }

      setConnectionStatus("Connecting to call...");

      if (import.meta.env.VITE_NODE_ENV === "development") {
        AgoraRTC.setLogLevel(2); // Show only ERROR in development
      } else {
        AgoraRTC.setLogLevel(4); // 4 = NONE
      }

      // Create Agora client
      clientRef.current = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
        logConfig: { level: "error" },
      });

      // Set up event listeners
      clientRef?.current?.on("user-published", handleUserPublished);
      clientRef?.current?.on("user-unpublished", handleUserUnpublished);
      clientRef?.current?.on("user-left", handleUserLeft);
      clientRef?.current?.on(
        "connection-state-changed",
        handleConnectionStateChanged
      );

      if (tokenData) {
        // Join channel with token
        await clientRef?.current?.join(
          tokenData?.appId,
          callState?.channelName,
          tokenData?.token,
          String(userInfo.id)
        );
      } else {
        console.error("Invalid agora token.");
      }

      setConnectionStatus("Setting up media...");

      // Create local tracks
      const tracks = {};

      try {
        tracks.audio = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard",
        });
      } catch (audioError) {
        console.error("Failed to create audio track:", audioError);
        throw new Error(
          "Failed to access microphone. Please check permissions."
        );
      }

      if (callState.callType === "video") {
        try {
          tracks.video = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "720p_1",
          });
          // Play local video
          if (localVideoRef.current) {
            tracks.video.play(localVideoRef.current);
          }
        } catch (videoError) {
          console.error("Failed to create video track:", videoError);
          throw new Error("Failed to access camera. Please check permissions.");
        }
      }

      setLocalTracks(tracks);

      // Publish local tracks
      const tracksToPublish = Object.values(tracks).filter(
        (track) => track !== null
      );
      if (tracksToPublish.length > 0) {
        await clientRef?.current?.publish(tracksToPublish);
      }

      setConnectionStatus("Calling ...");
      setRinging(true);
    } catch (error) {
      console.error("Error initializing call:", error);

      // Show user-friendly error message
      if (error.message.includes("token")) {
        setConnectionStatus("Authentication failed");
        toast.error(
          "Failed to authenticate with calling service. Please try again."
        );
      } else if (error.message.includes("microphone")) {
        setConnectionStatus("Microphone access denied");
        toast.error(
          "Failed to access microphone. Please check your permissions."
        );
      } else if (error.message.includes("camera")) {
        setConnectionStatus("Camera access denied");
        toast.error("Failed to access camera. Please check your permissions.");
      } else if (error.response?.status === 500) {
        setConnectionStatus("Server error");
        toast.error("Server configuration error. Please contact support.");
      } else {
        setConnectionStatus("Connection failed");
        toast.error("Failed to initialize call. Please try again.");
      }

      if (callState?.isInCall) {
        endCall();
      }
      setRinging(false);
    }
  };

  const handleConnectionStateChanged = (curState, revState) => {
    switch (curState) {
      case "CONNECTING":
        setConnectionStatus("Connecting...");
        break;
      case "CONNECTED":
        setConnectionStatus("Connected");
        setIsConnected(true);
        break;
      case "RECONNECTING":
        setConnectionStatus("Reconnecting...");
        setIsConnected(false);
        break;
      case "DISCONNECTED":
        setConnectionStatus("Disconnected");
        setIsConnected(false);
        break;
      default:
        setConnectionStatus("Unknown state");
    }
  };

  const handleUserPublished = async (user, mediaType) => {
    await clientRef.current.subscribe(user, mediaType);

    if (mediaType === "video" && remoteVideoRef.current) {
      user.videoTrack.play(remoteVideoRef.current);
    }

    if (mediaType === "audio") {
      user.audioTrack.play();
    }

    setRemoteUsers((prev) => {
      const existing = prev.find((u) => u.uid === user.uid);
      if (existing) {
        return prev.map((u) => (u.uid === user.uid ? user : u));
      }
      return [...prev, user];
    });
    setIsConnected(true);
  };

  const handleUserUnpublished = (user, mediaType) => {
    if (mediaType === "video" && user.videoTrack) {
      user.videoTrack.stop();
    }
  };

  const handleUserLeft = (user) => {
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  };

  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - callStartTimeRef.current) / 1000
      );
      setCallDuration(elapsed);
    }, 1000);
  };

  const toggleMute = async () => {
    if (localTracks.audio) {
      await localTracks.audio.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localTracks.video) {
      await localTracks.video.setMuted(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = async () => {
    // Only notify other user if callState is valid
    if (callState?.isInCall) {
      socket.emit("endCall", {
        channelName: callState?.channelName,
        userId: userInfo.id,
        remoteUserId: callState?.remoteUser.id,
        wasAccepted: callAccepted,
        caller: callState?.isInitiator
          ? userInfo?.id
          : callState?.remoteUser.id,
        duration: callDuration,
        callType: callState?.callType,
        isInitiator: callState.isInitiator,
      });
      setCallAccepted(false);
    }
    runCleanup();
  };

  useEffect(() => {
    if (!callState) {
      runCleanup();
    }
  }, [callState?.isInCall]);

  const runCleanup = async () => {
    // Clear timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Stop and close all tracks safely
    for (let track of [localTracks.audio, localTracks.video]) {
      if (track) {
        try {
          track.stop();
          track.close();
        } catch (err) {
          console.error("Track cleanup failed:", err);
        }
      }
    }

    // Leave channel and cleanup client
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
      } catch (error) {
        console.error("Error leaving channel:", error);
      }
      clientRef?.current?.removeAllListeners();
      clientRef.current = null;
    }

    // Reset state
    setCallState(null);
    setLocalTracks({ audio: null, video: null });
    setRemoteUsers([]);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
    setIsConnected(false);
    setConnectionStatus("Disconnected");
    setRinging(false);
    setAlreadyRinging(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!callState?.isInCall) return null;

  return (
    <div className="fixed inset-0 bg-[#1b1c24] z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#2f303b]">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 rounded-full overflow-hidden">
            {callState.remoteUser?.image ? (
              <AvatarImage
                src={callState.remoteUser.image || "/placeholder.svg"}
                alt="remote user"
                className="object-cover w-full h-full bg-black"
              />
            ) : (
              <div
                className={`uppercase h-10 w-10 text-lg border flex justify-center items-center rounded-full ${getColor(
                  0
                )}`}
              >
                {callState.remoteUser?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </Avatar>
          <div>
            <h3 className="text-white font-semibold">
              {callState.remoteUser?.name}
            </h3>
            <p className="text-gray-400 text-sm">
              {isConnected ? formatDuration(callDuration) : connectionStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#8417ff]">
            {callState.callType === "video" ? (
              <Video className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            <span className="text-sm capitalize">
              {callState.callType} Call
            </span>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {callState.callType === "video" ? (
          <>
            {/* Remote Video */}
            <div className="w-full h-full">
              <div
                ref={remoteVideoRef}
                className="w-full h-full bg-gray-900 flex items-center justify-center"
              >
                {remoteUsers.length === 0 && (
                  <div className="text-center">
                    <Avatar className="h-32 w-32 rounded-full overflow-hidden mx-auto mb-4">
                      {callState.remoteUser?.image ? (
                        <AvatarImage
                          src={callState.remoteUser.image || "/placeholder.svg"}
                          alt="remote user"
                          className="object-cover w-full h-full bg-black"
                        />
                      ) : (
                        <div
                          className={`uppercase h-32 w-32 text-4xl border flex justify-center items-center rounded-full ${getColor(
                            0
                          )}`}
                        >
                          {callState.remoteUser?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>
                      )}
                    </Avatar>
                    <p className="text-white text-lg">
                      {isConnected ? "Camera is off" : connectionStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Local Video (Picture in Picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-[#8417ff]/30">
              <div
                ref={localVideoRef}
                className="w-full h-full bg-gray-900 flex items-center justify-center"
              >
                {isVideoOff && (
                  <div className="text-white text-xs">Camera Off</div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Voice Call UI */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Avatar className="h-48 w-48 rounded-full overflow-hidden mx-auto mb-8 ring-4 ring-[#8417ff]/30">
                {callState.remoteUser?.image ? (
                  <AvatarImage
                    src={callState.remoteUser.image || "/placeholder.svg"}
                    alt="remote user"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <div
                    className={`uppercase h-48 w-48 text-6xl border flex justify-center items-center rounded-full ${getColor(
                      0
                    )}`}
                  >
                    {callState.remoteUser?.name?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </div>
                )}
              </Avatar>
              <h2 className="text-white text-2xl font-semibold mb-2">
                {callState.remoteUser?.name}
              </h2>
              <p className="text-gray-400 text-lg">
                {isConnected ? formatDuration(callDuration) : connectionStatus}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-[#1b1c24] border-t border-[#2f303b]">
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className={`p-4 rounded-full transition-colors duration-200 disabled:opacity-50 ${
              isMuted
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video Toggle (only for video calls) */}
          {callState.callType === "video" && (
            <button
              onClick={toggleVideo}
              disabled={!isConnected}
              className={`p-4 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          {/* Speaker Button (voice calls only) */}
          {/* {callState.callType
           === "voice" && (
            <button
              disabled={!isConnected}
              className={`p-4 rounded-full ${
                isSpeakerOn ? "bg-purple-700" : "bg-gray-600"
              } hover:bg-purple-800 transition-colors duration-200 disabled:opacity-50`}
            >
              <Volume2 className="w-6 h-6 text-white" />
            </button>
          )} */}

          {/* End Call Button */}
          <button
            onClick={endCall}
            disabled={!ringing}
            // disabled={!callState?.isInCall} // Changed from !ringing
            className={`p-4 rounded-full ${
              ringing
                ? "bg-red-500 cursor-pointer"
                : "bg-red-700 cursor-not-allowed"
            }  hover:bg-red-600 transition-colors duration-200`}
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallInterface;
