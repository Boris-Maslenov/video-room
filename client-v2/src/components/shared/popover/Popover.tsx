import { FC } from "react";
import { Popover as RadixPopover } from "radix-ui";
import { ReactElement } from "react";
import "./Popover.styles.scss";

const HVPopover: FC<{
  children: ReactElement;
  content: ReactElement;
  hiddenClose?: boolean;
  open?: boolean;
}> = ({ children, content, hiddenClose = false, open }) => (
  <RadixPopover.Root open={open}>
    <RadixPopover.Trigger asChild>{children}</RadixPopover.Trigger>
    <RadixPopover.Portal>
      <RadixPopover.Content
        className="PopoverContent"
        sideOffset={10}
        avoidCollisions
        collisionPadding={{ left: 10 }}
        side="top"
      >
        <div className="PopoverContentInner">{content}</div>
        {!hiddenClose && (
          <RadixPopover.Close className="PopoverClose" aria-label="Close">
            x
          </RadixPopover.Close>
        )}
        <RadixPopover.Arrow className="PopoverArrow" />
      </RadixPopover.Content>
    </RadixPopover.Portal>
  </RadixPopover.Root>
);

export default HVPopover;
