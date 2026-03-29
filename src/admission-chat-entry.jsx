import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AdmissionChatWidget } from "./components/AdmissionChatWidget.jsx";

const rootEl = document.getElementById("admission-chat-root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <AdmissionChatWidget />
    </StrictMode>
  );
}
