import react from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <react.StrictMode>
    <App />
  </react.StrictMode>
);
