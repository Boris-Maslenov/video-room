import "./Loader.styles.scss";
import { FC } from "react";
import { DotsAnimateIcon } from "../../icons";

const Loader: FC = () => (
  <div className="Loader">
    <DotsAnimateIcon width="50px" height="50px" />
  </div>
);

export default Loader;
