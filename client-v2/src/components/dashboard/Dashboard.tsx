import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Button from "../shared/button/Button";
import "./Dashboard.scss";
import {
  useDevicesStore,
  useMediaSoupStore,
} from "../../context/StoresProvider";
import CreateRoomModal from "../modals/CreateRoomModal";

const Dashboard: FC = () => {
  console.log("render Dashboard");

  const devicesStore = useDevicesStore();
  const mediaStore = useMediaSoupStore();
  const [isCreateRoomOpen, setCreateRoomOpen] = useState(false);

  const videoTrack = devicesStore.videoTrack;
  const audioTrack = devicesStore.audioTrack;

  useEffect(() => {
    // const init = async () => {
    //   await devicesStore.init();
    //   await devicesStore.startMediaTracks();
    // };
    // init();
  }, []);

  const createRoomHandle = (peerName: string) => {
    mediaStore.createRoom(peerName);
  };

  return (
    <div className="Dashboard">
      <div className="Dashboard__actions">
        <Button size="large" onClick={() => setCreateRoomOpen(true)}>
          Создать комнату
        </Button>
        <Button size="large" onClick={() => console.log("Подключиться")}>
          Подключиться
        </Button>
        {isCreateRoomOpen && (
          <CreateRoomModal
            open={isCreateRoomOpen}
            onOpenChange={setCreateRoomOpen}
            onSucces={createRoomHandle}
          />
        )}
      </div>
    </div>
  );
};

export default observer(Dashboard);
