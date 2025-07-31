import { SocketProvider } from "./Context/SocketContext";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")).render(
  <SocketProvider>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App clasaName="App" />
      <Toaster closeButton position="top-center" expand visibleToasts={3} />
    </GoogleOAuthProvider>
  </SocketProvider>
);
