import { useEffect, useRef, useCallback } from "react";

const LONG_PRESS_DELAY = 600;

type UseLongPressOptions = {
  onLongPress: () => void;
  onClick?: () => void;
  delayMs?: number;
};

export const useLongPress = ({
  onLongPress,
  onClick,
  delayMs = LONG_PRESS_DELAY,
}: UseLongPressOptions) => {
  const timerRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);

  const start = useCallback(
    (_: React.MouseEvent | React.TouchEvent) => {
      longPressedRef.current = false;

      timerRef.current = window.setTimeout(() => {
        longPressedRef.current = true;
        onLongPress();
      }, delayMs);
    },
    [delayMs]
  );

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!longPressedRef.current && onClick) {
      onClick();
    }
  }, []);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: clear,
    onClick: handleClick,
  };
};
