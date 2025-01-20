import { FC, useState } from "react";
import { useParams } from "../../hooks/useParams";
import Button from "../reused/button/Button";
import CreateNewRoomModal from "../modals/create-new-room-modal/CreateNewRoomModal";
import { useModal } from "../../hooks/useModals";
interface DashboardProps {
  onCreateRoom: () => void;
  onConnectToRoom: () => void;
}

const Dashboard: FC<DashboardProps> = ({ onCreateRoom, onConnectToRoom }) => {
  const [room] = useParams("room");
  const [isOpenCreateNewRoomModal, toogleCreateNewRoomModal] = useModal(true);

  return (
    <div className="center-content">
      <Button onClick={toogleCreateNewRoomModal} disabled={!!room}>
        создать комнату
      </Button>

      <Button onClick={onConnectToRoom} disabled={!room}>
        подключиться
      </Button>

      <CreateNewRoomModal
        isOpen={isOpenCreateNewRoomModal}
        onClose={toogleCreateNewRoomModal}
        onSucces={onCreateRoom}
      />
    </div>
  );
};

export default Dashboard;
