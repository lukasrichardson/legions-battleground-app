import Image, { StaticImageData } from "next/image";
import { useState } from "react";
import { serviceWorkerMonitor } from "@/client/utils/serviceWorkerMonitor";

interface CardImageProps {
  src: string | StaticImageData;
  alt: string;
  className?: string;
}

export default function CardImage({ 
  src, 
  alt, 
  className
}: CardImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const handleLoad = () => {
    setImageLoaded(true);
    // Detect actual cache status using Performance API
    if (typeof src === 'string') {
      setTimeout(() => {
        const fromCache = serviceWorkerMonitor.detectCacheHit(src);
        serviceWorkerMonitor.trackImageLoad(src, loadStartTime, fromCache);
      }, 10); // Small delay to ensure Performance API entry is available
    }
  };

  const handleError = () => {
    setImageLoaded(true);
    if (typeof src === 'string') {
      setTimeout(() => {
        const fromCache = serviceWorkerMonitor.detectCacheHit(src);
        serviceWorkerMonitor.trackImageLoad(src, loadStartTime, fromCache);
      }, 10);
    }
  };

  return (
    <>
      <Image
        className={className}
        style={{ width: '100%', height: '100%', opacity: imageLoaded ? 1 : 0 }}
        fill
        src={src}
        alt={alt}
        unoptimized
        onLoad={handleLoad}
        onError={handleError}
      />
      {!imageLoaded && <div className="card-image-loading w-full h-full rounded" />}
    </>
  );
}