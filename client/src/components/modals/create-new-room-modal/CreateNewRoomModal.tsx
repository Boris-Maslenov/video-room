import { FC, useState, ChangeEvent } from "react";
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
      <span style={{ fontSize: "32px", fontWeight: 400, lineHeight: 1 }}>
        Создание новой комнаты
      </span>
      <Input
        name={"peerName"}
        value={value["peerName"] ?? ""}
        onChange={setValue}
        placeholder="Как вас зовут?"
      />
      <Button
        onClick={() => {
          onSucces();
        }}
      >
        Создать комнату
      </Button>
    </Modal>
  );
};

export default CreateNewRoomModal;
