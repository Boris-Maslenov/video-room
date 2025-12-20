import { Tooltip as RadixTooltip } from "radix-ui";
import { FC, ReactNode } from "react";
import "./Tooltip.styles.scss";

type PropsType = {
  children: ReactNode;
  message: string;
};

const VRTooltip: FC<PropsType> = ({ children, message }) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <div>{children}</div>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className="TooltipContent" sideOffset={5}>
            {message}
            <RadixTooltip.Arrow className="TooltipArrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default VRTooltip;
