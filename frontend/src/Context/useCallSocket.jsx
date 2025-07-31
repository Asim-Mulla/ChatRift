import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/Context/SocketContext";
import { useAppStore } from "@/store/store";
import { toast } from "sonner";

export const useCallSocket = () => {
  const socket = useSocket();

  // Handle incoming call
  const handleIncomingCall = useCallback(
    (callData) => {
      // Only show incoming call if not already in a call
      const { callState, setIncomingCall, alreadyRinging, setAlreadyRinging } =
        useAppStore.getState();
      if (alreadyRinging) {
        socket.emit("callBusy", callData);
        return;
      }
      if (callState?.isInCall) {
        socket.emit("callBusy", callData);
        return;
      }

      setAlreadyRinging(true);

      setIncomingCall({
        callId: callData.callId,
        callerId: callData.callerId,
        callerName: callData.callerName,
        callerImage: callData.callerImage,
        receiverId: callData.receiverId,
        callType: callData.callType,
        channelName: callData.channelName,
      });
    },
    [socket]
  );

  // Handle call accepted
  const handleCallAccepted = useCallback((data) => {
    const { setCallAccepted } = useAppStore.getState();
    setCallAccepted(true);
    toast.success("Call accepted");
  }, []);

  // Handle call declined
  const handleCallDeclined = useCallback((data) => {
    const { callState, setCallState, setAlreadyRinging, setCallAccepted } =
      useAppStore.getState();
    setTimeout(
      () => {
        setCallState(null);
        setAlreadyRinging(false);
        setCallAccepted(false);
        toast.info("Call declined");
      },
      callState?.callType === "video"
        ? 3000
        : callState?.callType === "voice"
        ? 2000
        : 1000
    );
  }, []);

  // Handle call ended
  const handleCallEnded = useCallback((data) => {
    const {
      callState,
      setCallState,
      setIncomingCall,
      setAlreadyRinging,
      incomingCall,
      setCallAccepted,
    } = useAppStore.getState();

    const isCurrent =
      data.channelName === callState?.channelName ||
      data.channelName === incomingCall?.channelName;

    if (isCurrent) {
      setTimeout(
        () => {
          setCallState(null);
          setIncomingCall(null);
          setAlreadyRinging(false);
          setCallAccepted(false);
          toast.info("Call ended");
        },
        callState?.callType === "video"
          ? 3000
          : callState?.callType === "voice"
          ? 2000
          : 1000
      );
    }
  }, []);

  // Handle user busy
  const handleCallBusy = useCallback((data) => {
    const { callState, setCallState, setAlreadyRinging, incomingCall } =
      useAppStore.getState();

    // Only reset if this busy event matches the current call or incoming call
    const isCurrent =
      data.channelName === callState?.channelName ||
      data.channelName === incomingCall?.channelName;

    if (isCurrent) {
      setTimeout(
        () => {
          setCallState(null);
          setAlreadyRinging(false);
          toast.info("User is busy");
        },
        callState?.callType === "video"
          ? 3000
          : callState?.callType === "voice"
          ? 2000
          : 1000
      );
    }
  }, []);

  // Handle call timeout
  const handleCallTimeout = useCallback((data) => {
    const {
      callState,
      setCallState,
      incomingCall,
      setIncomingCall,
      setAlreadyRinging,
    } = useAppStore.getState();
    if (
      data.channelName === incomingCall?.channelName ||
      data.channelName === callState?.channelName
    ) {
      setCallState(null);
      setIncomingCall(null);
      setAlreadyRinging(false);
      toast.info("Call timeout");
    }
  }, []);

  // Handle receiver offline
  const handleReceiverOffline = useCallback(() => {
    const { callState, setCallState, setAlreadyRinging } =
      useAppStore.getState();
    setTimeout(
      () => {
        setCallState(null);
        setAlreadyRinging(false);
        toast.info("Could not connect, user is offline.");
      },
      callState?.callType === "video"
        ? 4000
        : callState?.callType === "voice"
        ? 3000
        : 1000
    );
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callDeclined", handleCallDeclined);
    socket.on("callEnded", handleCallEnded);
    socket.on("callBusy", handleCallBusy);
    socket.on("callTimeout", handleCallTimeout);
    socket.on("userOffline", handleReceiverOffline);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callDeclined", handleCallDeclined);
      socket.off("callEnded", handleCallEnded);
      socket.off("callBusy", handleCallBusy);
      socket.off("callTimeout", handleCallTimeout);
      socket.off("userOffline", handleReceiverOffline);
    };
  }, [
    socket,
    handleIncomingCall,
    handleCallAccepted,
    handleCallDeclined,
    handleCallEnded,
    handleCallBusy,
    handleCallTimeout,
    handleReceiverOffline,
  ]);
};
