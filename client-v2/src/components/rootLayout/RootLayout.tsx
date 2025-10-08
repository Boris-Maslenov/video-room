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
    socketStore.addListener("peer:closed", mediaStore.deleteRemotePeer);
    socketStore.addListener("peer:ready", mediaStore.addRemotePeer);
  }, []);
  console.log(errorStore.errorsStack);

  return (
    <>
      {!isJoined ? <Dashboard roomId={roomId} /> : <Room />}

      {errorStore.errorsStack.length > 0 && (
        <Modal
          title="Ошибка"
          onOpenChange={(open) => {
            console.log(open);
            errorStore.popError();
          }}
          open={errorStore.errorsStack.length > 0}
          onSucces={() => {}}
          disabledSuccesButton={false}
        >
          {errorStore.errorsStack.at(-1)?.message}
        </Modal>
      )}
    </>
  );
};

export default observer(RootLayout);
