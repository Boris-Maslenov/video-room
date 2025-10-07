import Dashboard from "../dashboard/Dashboard";
import { useParams } from "../../hooks/useParams";
import {
  useMediaSoupStore,
  useSocketStore,
} from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";
import Room from "../room/Room";
import { ROOM_QUERY_KEY } from "../../config";
import { useEffect } from "react";

const RootLayout = () => {
  const mediaStore = useMediaSoupStore();
  const socketStore = useSocketStore();
  const { isJoined } = mediaStore;
  const [roomId] = useParams(ROOM_QUERY_KEY);

  useEffect(() => {
    socketStore.addListener("peer:closed", mediaStore.deleteRemotePeer);
    socketStore.addListener("peer:ready", mediaStore.addRemotePeer);
  }, []);

  return !isJoined ? <Dashboard roomId={roomId} /> : <Room />;
};

export default observer(RootLayout);
