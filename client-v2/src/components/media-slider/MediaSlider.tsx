import { FC, ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Pagination } from "swiper/modules";
import { ClientPeer } from "../../stores/MediasoupClientStore";
import Participant from "../participant/Participant";

type PropsType = {
  children?: ReactNode;
  viewShema: Record<number, ClientPeer[]>;
  onChangeOrUpdateSlide: (num: number) => void;
  onResize: (width: number, height: number) => void;
};

const MediaSlider: FC<PropsType> = ({
  viewShema,
  onChangeOrUpdateSlide,
  onResize,
}) => {
  return (
    <Swiper
      speed={600}
      slidesPerView="auto"
      pagination={{ type: "bullets" }}
      spaceBetween={10}
      mousewheel={true}
      modules={[Mousewheel, Pagination]}
      className="MediaSlider"
      wrapperClass="MediaSliderWrapper"
      direction="vertical"
      breakpoints={{
        578: {
          spaceBetween: 0,
        },
      }}
      onSlideChange={(s) => {
        onChangeOrUpdateSlide(s.activeIndex);
      }}
      onSwiper={(swiper) => {
        const onResizeFn = () => {
          onResize(swiper.width, swiper.height);
        };
        swiper.on("resize", onResizeFn);
        swiper.once("destroy", () => {
          swiper.off("resize", onResizeFn);
        });
      }}
      onSlidesLengthChange={(s) => {
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
