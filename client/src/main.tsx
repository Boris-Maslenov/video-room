import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorProvider from "./context/ErrorContext.tsx";

createRoot(document.getElementById("root")!).render(
  <ErrorProvider>
    <App />
  </ErrorProvider>
);
