import { FC } from "react";
import Modal from "../../reused/modal/Modal";
import Input from "../../reused/input/Input";
import Button from "../../reused/button/Button";
import useInputsState from "../../../hooks/useInputsState";

type PropsTypes = {
  isOpen: boolean;
  onClose: () => void;
  onSucces: <T extends string>(a: T) => void;
};

const JointToRoomModal: FC<PropsTypes> = ({ onSucces, onClose, ...props }) => {
  if (!props.isOpen) return <></>;

  const [value, setValue] = useInputsState();
  const isDisable = (value["peerName"]?.trim() ?? "").length <= 2;

  return (
    <Modal onClose={onClose} {...props}>
      <div className={"modal-header"}>
        <span style={{ fontSize: "32px", fontWeight: 400, lineHeight: 1 }}>
          Присоединиться к комнате
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
          disabled={isDisable}
          onClick={() => {
            onSucces(value["peerName"]);
            onClose();
          }}
        >
          Войти
        </Button>
      </div>
    </Modal>
  );
};

export default JointToRoomModal;
