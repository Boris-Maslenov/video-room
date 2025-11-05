import { FC, ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Pagination } from "swiper/modules";
import { getPeersInActiveSlide } from "../../utils/getPeersInActiveSlide";
import { ClientRemotePeer } from "../../stores/MediasoupClientStore";
import Participant from "../participant/Participant";

type PropsType = {
  children?: ReactNode;
  viewShema: Record<number, ClientRemotePeer[]>;
  onChangeOrUpdateSlide: (num: number) => void;
};

const MediaSlider: FC<PropsType> = ({ viewShema, onChangeOrUpdateSlide }) => {
  return (
    <Swiper
      speed={600}
      slidesPerView="auto"
      pagination={{ type: "bullets" }}
      mousewheel={true}
      modules={[Mousewheel, Pagination]}
      className="MediaSlider"
      wrapperClass="MediaSliderWrapper"
      direction="vertical"
      breakpoints={{
        578: {
          pagination: { type: "bullets" },
          direction: "vertical",
        },
      }}
      // onSlideChangeTransitionStart={(swiper) => {}}
      // onSlideChangeTransitionEnd={(swiper) => {}}
      onSlideChange={(s) => {
        // onChangeOrUpdateSlide(getPeersInActiveSlide(s.activeIndex));
        onChangeOrUpdateSlide(s.activeIndex);
      }}
      onSwiper={(swiper) => {
        // setMaxItemsInSlide(calcMaxItems(swiper.width));

        // const onResize = () => {
        //   setMaxItemsInSlide(calcMaxItems(swiper.width));
        // };

        // swiper.on("resize", onResize);
        swiper.once("destroy", () => {
          // swiper.off("resize", onResize);
        });
      }}
      onSlidesLengthChange={(s) => {
        // onChangeOrUpdateSlide(getPeersInActiveSlide(s.activeIndex));
        onChangeOrUpdateSlide(s.activeIndex);
      }}
    >
      {Object.values(viewShema).map((array, key) => (
        <SwiperSlide data-group-id={key} key={key} className="MediaSlide">
          {array.map((p) => (
            <Participant peer={p} key={p.id} />
          ))}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MediaSlider;
