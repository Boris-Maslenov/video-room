import { FC, useEffect } from "react";
import Dashboard from "../dashboard/Dashboard";
import { useParams } from "../../hooks/useParams";
import {
  useErrorStore,
  useMediaSoupStore,
  useSocketStore,
} from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";
import Room from "../room/Room";
import { ROOM_QUERY_KEY } from "../../config";
import Modal from "../shared/modal/Modal";

const RootLayout: FC = () => {
  const mediaStore = useMediaSoupStore();
  const socketStore = useSocketStore();
  const errorStore = useErrorStore();
  const { isJoined } = mediaStore;
  const [roomId] = useParams(ROOM_QUERY_KEY);

  useEffect(() => {
    socketStore.addListener("peer:closed", (a) =>
      mediaStore.deleteRemotePeer(a)
    );
    socketStore.addListener("peer:ready", (a) => {
      console.log("peer:ready");
      mediaStore.addRemotePeer(a);
    });
    socketStore.addListener("peer:camOf", (a, b) =>
      mediaStore.deleteConsumerFromRemotePeer(a, b)
    );
    socketStore.addListener("peer:camOn", (a, b) =>
      mediaStore.addConsumerToRemotePeer(a, b)
    );
    socketStore.addListener("peer:screenOn", (remotePeerId, producerId) => {
      mediaStore.startRemoteScreenShare(remotePeerId, producerId);
    });
    socketStore.addListener("peer:screenOf", (remotePeerId, producerId) => {
      mediaStore.stopRemoteScreenShare(remotePeerId, producerId);
    });
  }, []);

  return (
    <>
      {!isJoined ? <Dashboard roomId={roomId} /> : <Room />}

      {errorStore.errorsStack.length > 0 && (
        <Modal
          title="Ошибка"
          onOpen={(open) => {
            console.log(open);
            errorStore.popError();
          }}
          open={errorStore.errorsStack.length > 0}
          onSucces={() => {}}
        >
          {errorStore.errorsStack.at(-1)?.message}
        </Modal>
      )}
    </>
  );
};

export default observer(RootLayout);
