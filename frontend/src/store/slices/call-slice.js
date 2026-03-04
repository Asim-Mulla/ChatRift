export const createCallSlice = (set, get) => ({
  callState: null, // { isInCall, callType, channelName, isInitiator, remoteUser }
  incomingCall: null, // { callId, callerId, callerName, callerImage, receiverId, callType, channelName }
  callAccepted: false,
  alreadyRinging: false,
  callMessage: null,

  setAlreadyRinging: (ringing) => {
    set({ alreadyRinging: ringing });
  },

  setCallAccepted: (accepted) => {
    set({ callAccepted: accepted });
  },

  setCallState: (callState) => {
    set({ callState });
  },

  setIncomingCall: (incomingCall) => {
    set({ incomingCall });
  },

  clearCallState: () => {
    set({
      callState: null,
      incomingCall: null,
    });
  },

  setCallMessage: (callMessage) => {
    set({ callMessage });
  },
});
