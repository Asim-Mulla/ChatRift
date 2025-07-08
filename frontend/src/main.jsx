import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "sonner";
import { SocketProvider } from "./Context/SocketContext";

createRoot(document.getElementById("root")).render(
  <SocketProvider>
    <App clasaName="App" />
    <Toaster closeButton position="top-center" />
  </SocketProvider>
);
