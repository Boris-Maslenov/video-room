import { FC } from "react";
import { useParams } from "../../hooks/useParams";
import Button from "../reused/button/Button";

interface DashboardProps {
  onCreateRoom: () => void;
  onConnectToRoom: () => void;
}

const Dashboard: FC<DashboardProps> = ({ onCreateRoom, onConnectToRoom }) => {
  const [room] = useParams("room");
  return (
    <div className="center-content">
      <Button onClick={onCreateRoom} disabled={!!room}>
        создать комнату
      </Button>

      <Button onClick={onConnectToRoom} disabled={!room}>
        подключиться
      </Button>
    </div>
  );
};

export default Dashboard;
