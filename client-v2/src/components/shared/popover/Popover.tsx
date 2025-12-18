import { FC } from "react";
import { Popover } from "radix-ui";
import { ReactElement } from "react";
import "./Popover.styles.scss";

const HVPopover: FC<{
  children: ReactElement;
  content: ReactElement;
  hiddenClose?: boolean;
  open?: boolean;
}> = ({ children, content, hiddenClose = false, open }) => (
  <Popover.Root open={open}>
    <Popover.Trigger asChild>{children}</Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        className="PopoverContent"
        sideOffset={10}
        avoidCollisions
        collisionPadding={{ left: 10 }}
        side="top"
      >
        <div className="PopoverContentInner">{content}</div>
        {!hiddenClose && (
          <Popover.Close className="PopoverClose" aria-label="Close">
            x
          </Popover.Close>
        )}
        <Popover.Arrow className="PopoverArrow" />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

export default HVPopover;
