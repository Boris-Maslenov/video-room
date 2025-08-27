import "./Modal.scss";
import { type FC, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface ModalProps {
  title: string;
  openChange: (open: boolean) => void;
  open: boolean;
  children?: ReactNode;
}

const Modal: FC<ModalProps> = ({ openChange, open, title, children }) => {
  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Overlay className="DialogOverlay" />
      <Dialog.Content className="DialogContent">
        <Dialog.Title className="DialogTitle">{title}</Dialog.Title>
        <Dialog.Description className="DialogDescription">
          Make changes to your profile here. Click save when you're done.
        </Dialog.Description>
        {children}
        <div className="DialogActions">
          <button className="Button green">Save</button>
        </div>
        <Dialog.Close className="DialogClose">x</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default Modal;
