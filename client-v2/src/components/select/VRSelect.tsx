import { FC } from "react";
import { Select } from "radix-ui";
import "./VRSelect.styles.scss";

type PropsType = {
  options: Record<"label" | "value", string>[];
  placeholder?: string;
} & Select.SelectProps;

const VRSelect: FC<PropsType> = ({
  options,
  placeholder = "",
  ...radixProps
}) => {
  return (
    <div className="SelectWrapper">
      <Select.Root {...radixProps}>
        <Select.Trigger className="SelectTrigger">
          <Select.Value placeholder={placeholder} />
          <Select.Icon className="SelectIcon"></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="SelectContent" position="item-aligned">
            <Select.Viewport className="SelectViewport">
              {options.map((o, i) => (
                <Select.Item
                  key={i + (o?.value || "__empty__")}
                  className="SelectItem"
                  value={o?.value || "__empty__"}
                >
                  <Select.ItemText>{o.label || "__empty__"}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default VRSelect;
