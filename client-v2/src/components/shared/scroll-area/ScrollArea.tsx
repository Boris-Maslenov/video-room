import { FC } from "react";
import { ScrollArea as RadixScrollArea } from "radix-ui";
import "./ScrollArea.styles.scss";

type PropsTypes = {
  children: React.ReactNode;
};

const ScrollArea: FC<PropsTypes> = ({ children }) => {
  return (
    <RadixScrollArea.Root className="ScrollAreaRoot">
      <RadixScrollArea.Viewport className="ScrollAreaViewport">
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        className="ScrollAreaScrollbar"
        orientation="vertical"
      >
        <RadixScrollArea.Thumb className="ScrollAreaThumb" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Scrollbar
        className="ScrollAreaScrollbar"
        orientation="horizontal"
      >
        <RadixScrollArea.Thumb className="ScrollAreaThumb" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner className="ScrollAreaCorner" />
    </RadixScrollArea.Root>
  );
};

export default ScrollArea;
