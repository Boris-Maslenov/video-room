import { useState } from "react";
import Modal from "./components/shared/modal/Modal";
import "@radix-ui/themes/styles.css";

const App = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Modal
        open={open}
        openChange={(open) => setOpen(open)}
        title="Создать новую комнату"
      />
    </>
  );
};

export default App;
