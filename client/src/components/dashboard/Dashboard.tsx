import { FC } from "react";

interface DashboardProps {
  onCreateRoom: () => void;
  onConnectToRoom: () => void;
}

const Dashboard: FC<DashboardProps> = ({ onCreateRoom, onConnectToRoom }) => {
  return (
    <div>
      <button onClick={onCreateRoom}>создать комнату</button>
      <button onClick={onConnectToRoom}>подключиться</button>
    </div>
  );
};

export default Dashboard;
