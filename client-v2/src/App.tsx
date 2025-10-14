import "./App.scss";
import { StoresProvider } from "./context/StoresProvider";
import RootLayout from "./components/rootLayout/RootLayout";
// import "@radix-ui/themes/styles.css";
const App = () => {
  return (
    <StoresProvider>
      <RootLayout />
    </StoresProvider>
  );
};

export default App;
