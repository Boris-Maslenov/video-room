import { FC } from "react";
import { observer } from "mobx-react-lite";
import Button from "../shared/button/Button";
import "./Dashboard.scss";
// import { useDevicesStore } from "../../context/StoresProvider";

const Dashboard: FC = () => {
  console.log("render Dashboard");
  return (
    <div className="Dashboard">
      <div className="Dashboard__actions">
        <Button size="large" onClick={() => console.log("Создать комнату")}>
          Создать комнату
        </Button>
        <Button size="large" onClick={() => console.log("Подключиться")}>
          Подключиться
        </Button>
      </div>
    </div>
  );
};

export default observer(Dashboard);
