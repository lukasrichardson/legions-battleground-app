import Image, { StaticImageData } from "next/image";
import { useState } from "react";
export default function CardImage({ src, alt, className}: { src: string | StaticImageData; alt: string; className?: string; }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
    <Image
      className={className}
      style={{ width: '100%', height: '100%', opacity: imageLoaded ? 1 : 0 }}
      fill
      src={src}
      alt={alt}
      unoptimized
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageLoaded(true)}
      onLoadingComplete={() => setImageLoaded(true)}
    />
    {!imageLoaded && <div className="card-image-loading w-full h-full rounded" />}
    </>
  )
}