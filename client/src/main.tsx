import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorProvider from "./context/ErrorContext.tsx";
import "simplebar-react/dist/simplebar.min.css";

createRoot(document.getElementById("root")!).render(
  <ErrorProvider>
    <App />
  </ErrorProvider>
);
