import { FC, ReactNode, Children, useState } from "react";
import { Swiper, SwiperSlide, SwiperClass } from "swiper/react";
import { Mousewheel, Pagination } from "swiper/modules";
import { getPeersInActiveSlide } from "../../utils/getPeersInActiveSlide";

type PropsType = {
  children?: ReactNode;
  onChangeOrUpdateSlide: (num: string[]) => void;
};

const MAX_ITEMS = 2;

const getGroups = (
  elemCount: number,
  children: ReactNode[],
  maxItems = MAX_ITEMS
) => {
  if (elemCount === 0) return [];

  const result = [];
  for (let i = 0; i < elemCount; i += maxItems) {
    result.push(children.slice(i, i + maxItems));
  }
  return result;
};

const calcMaxItems = (width: number, height: number): number => {
  if (width <= 538) {
    return 3;
  }

  return MAX_ITEMS;
};

const MediaSlider: FC<PropsType> = ({ children, onChangeOrUpdateSlide }) => {
  console.log("SlidesCalculator");
  const [maxItemsInSlide, setMaxItemsInSlide] = useState(MAX_ITEMS);
  const elementsCount = Children.count(children);
  const childrenArray = Children.toArray(children);

  return (
    <Swiper
      speed={1000}
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
      onSlideChangeTransitionStart={(swiper) => {
        console.log("🚀 Начало перелистывания");
        console.log("Активный индекс:", swiper.activeIndex, swiper);
      }}
      onSlideChangeTransitionEnd={(swiper) => {
        console.log("✅ Перелистывание завершено");
        console.log("Новый активный слайд:", swiper.activeIndex, swiper);
      }}
      onSlideChange={(s) => {
        console.log("🚀 onSlideChange", s);
        onChangeOrUpdateSlide(getPeersInActiveSlide(s.activeIndex));
      }}
      onSwiper={(swiper) => {
        setMaxItemsInSlide(calcMaxItems(swiper.width, swiper.height));

        const onResize = () => {
          setMaxItemsInSlide(calcMaxItems(swiper.width, swiper.height));
        };

        swiper.on("resize", onResize);
        swiper.once("destroy", () => {
          swiper.off("resize", onResize);
        });
      }}
      onSlidesLengthChange={(s) => {
        onChangeOrUpdateSlide(getPeersInActiveSlide(s.activeIndex));
      }}
    >
      {getGroups(elementsCount, childrenArray, maxItemsInSlide).map(
        (array, key) => (
          <SwiperSlide
            data-group-id={key}
            key={key}
            className="MediaSlide"
            children={array}
          />
        )
      )}
    </Swiper>
  );
};

export default MediaSlider;
