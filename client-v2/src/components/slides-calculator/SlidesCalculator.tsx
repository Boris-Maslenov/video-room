import { FC, ReactNode, Children } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Pagination } from "swiper/modules";

type PropsType = {
  children?: ReactNode;
};

const MAX_SLIDES = 12;

const SlidesCalculator: FC<PropsType> = ({ children }) => {
  console.log("children", children);
  const elementsCount = Children.count(children);
  const childrenArray = Children.toArray(children);

  const getGroups = () => {
    if (elementsCount === 0) {
      return [];
    }

    const result = [];

    for (let i = 0; i < elementsCount; i += MAX_SLIDES) {
      result.push(childrenArray.slice(i, i + MAX_SLIDES));
    }

    return result;
  };

  return (
    <Swiper
      slidesPerView="auto"
      direction={"vertical"}
      mousewheel={true}
      pagination={{}}
      modules={[Mousewheel, Pagination]}
      className="MediaSlider"
      wrapperClass="MediaSliderWrapper"
    >
      {getGroups().map((array, key) => (
        <SwiperSlide key={key} className="MediaSlide" children={array} />
      ))}
    </Swiper>
  );
};

export default SlidesCalculator;
