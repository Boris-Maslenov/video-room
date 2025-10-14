import { FC } from "react";
import { Switch } from "radix-ui";
import "./Switch.styles.scss";

const VRSwitch: FC<Switch.SwitchProps> = ({ ...radixProps }) => (
  <div className="Switch">
    <Switch.Root className="SwitchRoot" {...radixProps}>
      <Switch.Thumb className="SwitchThumb" />
    </Switch.Root>
  </div>
);

export default VRSwitch;
