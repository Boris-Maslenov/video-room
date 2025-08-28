import "./App.scss";
import Dashboard from "./components/dashboard/Dashboard";
import { StoresProvider } from "./context/StoresProvider";
// import "@radix-ui/themes/styles.css";

const App = () => {
  console.log("app render");
  return (
    <StoresProvider>
      <Dashboard />
    </StoresProvider>
  );
};

export default App;
