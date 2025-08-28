import "./Modal.scss";
import { type FC, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Button from "../button/Button";

interface ModalProps {
  title: string;
  openChange: (open: boolean) => void;
  onSucces: () => void;
  open: boolean;
  children?: ReactNode;
}

const Modal: FC<ModalProps> = ({
  openChange,
  open,
  title,
  children,
  onSucces,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Overlay className="DialogOverlay" />
      <Dialog.Content className="DialogContent">
        <Dialog.Title className="DialogTitle">{title}</Dialog.Title>
        {children}
        <div className="DialogActions">
          <Button onClick={onSucces}>OK</Button>
        </div>
        <Dialog.Close className="DialogClose">x</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default Modal;
