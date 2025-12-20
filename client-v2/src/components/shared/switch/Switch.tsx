import { FC } from "react";
import { Switch as RadixSwitch } from "radix-ui";
import "./Switch.styles.scss";

const Switch: FC<RadixSwitch.SwitchProps> = ({ ...radixProps }) => (
  <div className="Switch">
    <RadixSwitch.Root className="SwitchRoot" {...radixProps}>
      <RadixSwitch.Thumb className="SwitchThumb" />
    </RadixSwitch.Root>
  </div>
);

export default Switch;
