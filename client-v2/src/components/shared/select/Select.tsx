import { FC } from "react";
import { Select as RadixSelect } from "radix-ui";
import "./Select.styles.scss";

type PropsType = {
  options: Record<"label" | "value", string>[];
  placeholder?: string;
} & RadixSelect.SelectProps;

const Select: FC<PropsType> = ({
  options,
  placeholder = "",
  ...radixProps
}) => {
  return (
    <div className="SelectWrapper">
      <RadixSelect.Root {...radixProps}>
        <RadixSelect.Trigger className="SelectTrigger">
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className="SelectIcon"></RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="SelectContent"
            position="item-aligned"
          >
            <RadixSelect.Viewport className="SelectViewport">
              {options.map((o, i) => (
                <RadixSelect.Item
                  key={i + (o?.value || "__empty__")}
                  className="SelectItem"
                  value={o?.value || "__empty__"}
                >
                  <RadixSelect.ItemText>
                    {o.label || "__empty__"}
                  </RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
};

export default Select;
