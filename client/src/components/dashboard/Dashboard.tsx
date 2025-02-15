import { FC } from "react";
import { useParams } from "../../hooks/useParams";
import Button from "../reused/button/Button";
import CreateNewRoomModal from "../modals/create-new-room-modal/CreateNewRoomModal";
import JointToRoomModal from "../modals/create-new-room-modal/JointToRoomModal";
import { useModal } from "../../hooks/useModals";

type DashboardProps = {
  onCreateRoom: (peerName: string) => void;
  onConnectRoom: (peerName: string) => void;
};

const Dashboard: FC<DashboardProps> = ({ onCreateRoom, onConnectRoom }) => {
  const [room] = useParams("room");
  const [isOpenCreateNewRoomModal, toggleCreateNewRoomModal] = useModal();
  const [isOpenJointToRoomModal, toggleJointToRoomModal] = useModal();

  return (
    <div className="dashboard center-content">
      <div className="dashboard__content">
        <Button onClick={toggleCreateNewRoomModal} disabled={!!room}>
          Создать комнату
        </Button>

        <Button onClick={toggleJointToRoomModal} disabled={!room}>
          Подключиться
        </Button>

        <CreateNewRoomModal
          isOpen={isOpenCreateNewRoomModal}
          onClose={toggleCreateNewRoomModal}
          onSucces={onCreateRoom}
        />
        <JointToRoomModal
          isOpen={isOpenJointToRoomModal}
          onClose={toggleJointToRoomModal}
          onSucces={onConnectRoom}
        />
      </div>
    </div>
  );
};

export default Dashboard;
