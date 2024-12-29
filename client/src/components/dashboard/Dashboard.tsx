import { FC } from "react";
import { useParams } from "../../hooks/useParams";

interface DashboardProps {
  onCreateRoom: () => void;
  onConnectToRoom: () => void;
}

const Dashboard: FC<DashboardProps> = ({ onCreateRoom, onConnectToRoom }) => {
  const [room] = useParams("room");
  return (
    <div>
      <button onClick={onCreateRoom} disabled={!!room}>
        создать комнату
      </button>
      <button onClick={onConnectToRoom} disabled={!room}>
        подключиться
      </button>
    </div>
  );
};

export default Dashboard;
