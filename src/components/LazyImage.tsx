import { useState } from "react";
import { useFadeInAnimation } from "../util/hooks/general";

interface LazyImageProps {
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: Record<string, string | undefined>;
  onClick?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  loading = "lazy",
  width,
  height,
  className = "",
  style,
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const animationClasses = useFadeInAnimation();

  return (
    <div
      className={`relative ${animationClasses} ${onClick ? "cursor-pointer" : ""} w-full h-full`}
      style={{ width: width || "100%", height: height || "100%" }}
      onClick={onClick}
    >
      <img
        src={src}
        loading={loading}
        alt={alt}
        className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-all duration-300 object-cover w-full h-full`}
        onLoad={() => setIsLoaded(true)}
        style={style}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
    </div>
  );
};

export default LazyImage;
