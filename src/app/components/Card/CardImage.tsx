import Image, { StaticImageData } from "next/image";
import { useState, useCallback, useRef } from "react";
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
  const loadStartTime = useRef(Date.now());
  const hasTracked = useRef(false);

  const handleLoad = useCallback(() => {
    if (!imageLoaded) {
      setImageLoaded(true);
    }
    // Only track once per component instance
    if (!hasTracked.current && typeof src === 'string') {
      hasTracked.current = true;
      setTimeout(() => {
        const fromCache = serviceWorkerMonitor.detectCacheHit(src);
        serviceWorkerMonitor.trackImageLoad(src, loadStartTime.current, fromCache);
      }, 10);
    }
  }, [imageLoaded, src]);

  const handleError = useCallback(() => {
    if (!imageLoaded) {
      setImageLoaded(true);
    }
    if (!hasTracked.current && typeof src === 'string') {
      hasTracked.current = true;
      setTimeout(() => {
        const fromCache = serviceWorkerMonitor.detectCacheHit(src);
        serviceWorkerMonitor.trackImageLoad(src, loadStartTime.current, fromCache);
      }, 10);
    }
  }, [imageLoaded, src]);

  return (
    <>
      <Image
        className={className}
        style={{ 
          width: '100%', 
          height: '100%', 
          pointerEvents: "none"
        }}
        fill
        src={src}
        alt={alt}
        unoptimized
        onLoad={handleLoad}
        onError={handleError}
        loading="eager"
        priority={true}
      />
      {!imageLoaded && (
        <div 
          className="card-image-loading w-full h-full rounded absolute inset-0 bg-gray-200 animate-pulse" 
        />
      )}
    </>
  );
}