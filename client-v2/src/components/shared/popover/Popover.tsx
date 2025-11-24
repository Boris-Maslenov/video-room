import { FC } from "react";
import { Popover } from "radix-ui";
import { ReactElement } from "react";
import "./Popover.styles.scss";

const HVPopover: FC<{ children: ReactElement; content: ReactElement }> = ({
  children,
  content,
}) => (
  <Popover.Root>
    <Popover.Trigger asChild>{children}</Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className="PopoverContent" sideOffset={5} side="top">
        <div className="PopoverContentInner">{content}</div>
        <Popover.Close className="PopoverClose" aria-label="Close">
          x
        </Popover.Close>
        <Popover.Arrow className="PopoverArrow" />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

export default HVPopover;
