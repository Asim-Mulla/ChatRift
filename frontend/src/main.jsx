import { SocketProvider } from "./Context/SocketContext";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <SocketProvider>
    <App clasaName="App" />
    <Toaster closeButton position="top-center" />
  </SocketProvider>
);
