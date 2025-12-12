import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Button from "../shared/button/Button";
import "./Dashboard.scss";
import {
  useMediaSoupStore,
  useSocketStore,
  useDevicesStore,
} from "../../context/StoresProvider";
import CreateRoomModal from "../modals/CreateRoomModal";
import EnterRoomModal from "../modals/EnterRoomModal";
import { setQueryParams } from "../../utils/setQueryParams";
import { ROOM_QUERY_KEY } from "../../config";

const Dashboard: FC<{ roomId?: string }> = ({ roomId }) => {
  const devicesStore = useDevicesStore();
  const mediaStore = useMediaSoupStore();
  const socketStore = useSocketStore();
  const [modal, setModalOpen] = useState<
    "CreateRoomModal" | "EnterRoomModal" | null
  >(null);

  const status = socketStore.networkStatus;

  const [disabledModalBtn, setDisabledModalBtn] = useState(false);

  const createRoomHandle = async (peerName: string) => {
    setDisabledModalBtn(true);
    await mediaStore.createRoom(peerName);
    setQueryParams(ROOM_QUERY_KEY, "0");
    setModalOpen(null);
  };

  const enterRoomHandle = async (peerName: string) => {
    if (roomId) {
      setDisabledModalBtn(true);
      await mediaStore.enterRoom(roomId, peerName);
      setModalOpen(null);
    }
  };

  useEffect(() => {
    if (!modal) {
      setDisabledModalBtn(false);
    }
  }, [modal]);

  return (
    <div className="Dashboard">
      <div className="Dashboard__actions">
        <Button
          size="large"
          onClick={() => setModalOpen("CreateRoomModal")}
          disabled={!!roomId || status !== "online"}
        >
          Создать комнату
        </Button>
        <Button
          size="large"
          onClick={() => {
            devicesStore.initV2();
            setModalOpen("EnterRoomModal");
          }}
          disabled={!roomId || status !== "online"}
        >
          Подключиться
        </Button>
      </div>
      {modal === "CreateRoomModal" && (
        <CreateRoomModal
          open={true}
          onOpen={() => setModalOpen(null)}
          onSucces={createRoomHandle}
          disabledSuccesButton={disabledModalBtn}
        />
      )}
      {modal === "EnterRoomModal" && (
        <EnterRoomModal
          open={true}
          onOpen={() => {
            devicesStore.cleanupDevicesSession();
            setModalOpen(null);
          }}
          onSucces={enterRoomHandle}
          disabledSuccesButton={disabledModalBtn}
          mediaDevices={devicesStore.allMediaDevices}
          loading={devicesStore.isMediaDevicesLoading}
          selectedMic={devicesStore.selectedMic ?? ""}
        />
      )}
    </div>
  );
};

export default observer(Dashboard);
