import { useState, useEffect } from "react";
import { debaunce } from "../utils/debounce";

export const useUpdateSimplebar = (): number => {
  const [windowKey, setWindowKey] = useState(0);

  useEffect(() => {
    const resizeDebaunce = debaunce(() => setWindowKey((prev) => ++prev), 300);

    window.addEventListener("resize", resizeDebaunce);
    return () => window.removeEventListener("resize", resizeDebaunce);
  }, []);

  return windowKey;
};
