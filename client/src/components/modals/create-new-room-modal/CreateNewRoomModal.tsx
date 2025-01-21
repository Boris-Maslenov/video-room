import { FC } from "react";
import Modal from "../../reused/modal/Modal";
import Input from "../../reused/input/Input";
import Button from "../../reused/button/Button";
import useInputsState from "../../../hooks/useInputsState";


type PropsTypes = {
  isOpen: boolean;
  onClose: () => void;
  onSucces: () => void;
};

const CreateNewRoomModal: FC<PropsTypes> = ({ onSucces, ...props }) => {
  if (!props.isOpen) return <></>;

  const [value, setValue] = useInputsState();

  return (
    <Modal {...props}>
      <div className={"modal-header"}>
        <span style={{ fontSize: "32px", fontWeight: 400, lineHeight: 1 }}>
          Создание новой комнаты
        </span>
      </div>
      <div className={"modal-center"}>
        <Input
          name={"peerName"}
          value={value["peerName"] ?? ""}
          onChange={setValue}
          placeholder="Ваше имя..."
        />
      </div>
      <div className={"modal-footer"}>
        <Button
          onClick={() => {
            onSucces();
          }}
        >
          Создать комнату
        </Button>
      </div>
    </Modal>
  );
};

export default CreateNewRoomModal;
