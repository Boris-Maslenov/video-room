import { FC } from "react";
import Button from "../button/Button";

const DefaultDialogActions: FC<{
  onOpen: (open: boolean) => void;
  onSucces: () => void;
  disabledSuccesButton?: boolean;
}> = ({ onOpen, onSucces, disabledSuccesButton = false }) => {
  return (
    <div className="DialogActions">
      <Button onClick={() => onOpen(false)} variant="outline" size="large">
        Отменить
      </Button>
      <Button onClick={onSucces} disabled={disabledSuccesButton} size="large">
        Подтвердить
      </Button>
    </div>
  );
};

export default DefaultDialogActions;
