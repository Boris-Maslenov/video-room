import { FC, useState, useRef, useEffect, useMemo } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { LinkIcon } from "../icons";
import HVPopover from "../shared/popover/Popover";

const iconSize = {
  width: "19px",
  height: "19px",
};

const CopyLink: FC = () => {
  const [copyResult, setCopyResult] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const url = useMemo(() => window.location.href, []);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showPopover = () => {
    setCopyResult(true);
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => setCopyResult(false), 5000);
  };

  return (
    <HVPopover
      hiddenClose
      open={copyResult}
      content={
        <>Ссылка на видеовстречу успешно скопирована! Передайте ее другу.</>
      }
    >
      <div>
        <CopyToClipboard
          text={url}
          onCopy={(_text, result) => {
            if (result) {
              showPopover();
            }
          }}
        >
          <button
            className="IconButton"
            type="button"
            title="Поделиться ссылкой на встречу"
          >
            <LinkIcon {...iconSize} />
          </button>
        </CopyToClipboard>
      </div>
    </HVPopover>
  );
};

export default CopyLink;
