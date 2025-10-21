import react from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <react.Fragment>
    <App />
  </react.Fragment>
);
