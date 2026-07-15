import { assetUrl } from "@/api";

export default function ImageThumbnailStrip({ images, activeIndex, onSelect, className, thumbClassName = "", label }) {
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
          <img className="size-full object-cover" src={assetUrl(image)} alt="" />
        </button>
      ))}
    </div>
  );
}
