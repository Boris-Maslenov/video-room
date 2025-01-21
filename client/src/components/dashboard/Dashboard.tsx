import { FC, useState } from "react";
import { useParams } from "../../hooks/useParams";
import Button from "../reused/button/Button";
import CreateNewRoomModal from "../modals/create-new-room-modal/CreateNewRoomModal";
import JointToRoomModal from "../modals/create-new-room-modal/JointToRoomModal";
import { useModal } from "../../hooks/useModals";
interface DashboardProps {
  onCreateRoom: () => void;
  onConnectToRoom: () => void;
}

const Dashboard: FC<DashboardProps> = ({ onCreateRoom, onConnectToRoom }) => {
  const [room] = useParams("room");
  const [isOpenCreateNewRoomModal, toggleCreateNewRoomModal] = useModal();
  const [isOpenJointToRoomModal, toggleJointToRoomModal] = useModal();

  return (
    <div className="center-content">
      <Button onClick={toggleCreateNewRoomModal} disabled={!!room}>
        создать комнату
      </Button>

      <Button onClick={toggleJointToRoomModal} disabled={!room}>
        подключиться
      </Button>

      <CreateNewRoomModal
        isOpen={isOpenCreateNewRoomModal}
        onClose={toggleCreateNewRoomModal}
        onSucces={onCreateRoom}
      />
      <JointToRoomModal
        isOpen={isOpenJointToRoomModal}
        onClose={toggleJointToRoomModal}
        onSucces={onConnectToRoom}
      />
    </div>
  );
};

export default Dashboard;
