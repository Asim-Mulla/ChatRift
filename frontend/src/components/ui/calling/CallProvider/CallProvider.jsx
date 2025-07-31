import { useCallSocket } from "@/Context/useCallSocket";
import IncomingCallModal from "../IncomingCallModal/IncomingCallModal";
import CallInterface from "../CallInterface/CallInterface";

const CallProvider = ({ children }) => {
  // Initialize call socket listeners
  useCallSocket();

  return (
    <>
      {children}
      <IncomingCallModal />
      <CallInterface />
    </>
  );
};

export default CallProvider;
