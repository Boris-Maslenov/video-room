import Button from "./components/shared/button/Button";
// import "@radix-ui/themes/styles.css";

const App = () => {
  return (
    <>
      <Button size="large">Создать комнату</Button>
      <Button disabled={true} size="large">
        Подключиться
      </Button>
    </>
  );
};

export default App;
