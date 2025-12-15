import { FC } from "react";
import Dashboard from "../dashboard/Dashboard";
import { useParams } from "../../hooks/useParams";
import { useErrorStore, useMediaSoupStore } from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";
import Room from "../room/Room";
import { ROOM_QUERY_KEY } from "../../config";
import Modal from "../shared/modal/Modal";
import Loader from "../shared/loader/Loader";

const RootLayout: FC = () => {
  const mediaStore = useMediaSoupStore();
  const errorStore = useErrorStore();
  const { sessionState } = mediaStore;
  const [roomId] = useParams(ROOM_QUERY_KEY);

  if (sessionState === "connecting") {
    return <Loader />;
  }

  return (
    <>
      {sessionState === "idle" ? <Dashboard roomId={roomId} /> : <Room />}

      {errorStore.errorsStack.length > 0 && (
        <Modal
          title="Ошибка"
          onOpen={() => {
            errorStore.popError();
          }}
          open={errorStore.errorsStack.length > 0}
        >
          {errorStore.errorsStack.at(-1)?.message}
        </Modal>
      )}
    </>
  );
};

export default observer(RootLayout);
