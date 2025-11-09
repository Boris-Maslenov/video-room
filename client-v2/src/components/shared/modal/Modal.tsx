import "./Modal.scss";
import { type FC, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CloseIcon } from "../../icons";

export interface ModalProps {
  title?: string;
  onOpen: (open: boolean) => void;
  open: boolean;
  children?: ReactNode;
  description?: string;
}

const Modal: FC<ModalProps> = ({
  onOpen,
  open,
  title,
  children,
  description = "",
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpen}>
      <Dialog.Overlay className="DialogOverlay" />
      <Dialog.Content className="DialogContent">
        <Dialog.Title className="DialogTitle">{title}</Dialog.Title>
        <Dialog.Description>{description}</Dialog.Description>
        {children}
        <Dialog.Close className="DialogClose">
          <CloseIcon width="18px" height="18px" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default Modal;
