import { Tooltip } from "radix-ui";
import { FC, ReactNode } from "react";
import "./Tooltip.styles.scss";

type PropsType = {
  children: ReactNode;
  message: string;
};

const VRTooltip: FC<PropsType> = ({ children, message }) => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div>{children}</div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="TooltipContent" sideOffset={5}>
            {message}
            <Tooltip.Arrow className="TooltipArrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default VRTooltip;
