import {
  useDevicesStore,
  useMediaSoupStore,
} from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";
import Participant from "../participant/Participant";
import { ClientRemotePeer } from "../../stores/MediasoupClientStore";
import ActionPanel, { ActionTypes } from "../action-panel/ActionPanel";
import "./Room.styles.scss";

const Room = () => {
  const devicesStore = useDevicesStore();
  const mediaSoupStore = useMediaSoupStore();
  const remotePeers = mediaSoupStore.remotePeers;

  const getSelfPeer = (): ClientRemotePeer => {
    return {
      id: mediaSoupStore.peerId ?? "",
      roomId: mediaSoupStore.roomId ?? "",
      name: mediaSoupStore.peerName ?? "",
      producerIds: [mediaSoupStore.videoProducer, mediaSoupStore.audioProducer]
        .filter(Boolean)
        .map((p) => p!.id),
      socketId: "",
      isJoined: mediaSoupStore.isJoined,
      status: "online",
      consumers: [],
      mediaStream: devicesStore.stream ?? new MediaStream(),
    };
  };

  const handlePanelAction = (action: ActionTypes) => {
    switch (action) {
      case "mic": {
        const old = devicesStore.micOn;
        devicesStore.toggleMic(!old);
        break;
      }
      case "cam": {
        const old = devicesStore.camOn;
        devicesStore.toggleCam(!old);
        break;
      }
      case "screen": {
        break;
      }
      case "exit": {
        mediaSoupStore.endCall();
        break;
      }
      default: {
        console.log("unnown action");
      }
    }
  };

  return (
    <div className="Room">
      <div className="MediaCanvas">
        <Participant peer={getSelfPeer()} />
        {remotePeers.map((p) => (
          <Participant key={p.id} peer={p} />
        ))}
      </div>

      <ActionPanel
        onPanelAction={handlePanelAction}
        micState={devicesStore.micOn}
        camState={devicesStore.camOn}
      />
    </div>
  );
};

export default observer(Room);
