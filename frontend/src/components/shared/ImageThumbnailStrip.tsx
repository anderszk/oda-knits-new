import { apiClient } from "@/api";

interface ImageThumbnailStripProps {
  images: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  thumbClassName?: string;
  label?: string;
}

export default function ImageThumbnailStrip({ images, activeIndex, onSelect, className, thumbClassName = "", label }: ImageThumbnailStripProps) {
  if (images.length < 2) return null;
  return (
    <div className={className} aria-label={label}>
      {images.map((image, index) => (
        <button
          className={`size-13 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-transparent p-0 ${thumbClassName} ${index === activeIndex ? "border-wine" : "border-transparent"}`}
          type="button"
          key={image}
          onClick={() => onSelect(index)}
          aria-label={`Show image ${index + 1}`}
        >
          <img className="size-full object-cover" src={apiClient.assetUrl(image)} alt="" />
        </button>
      ))}
    </div>
  );
}
