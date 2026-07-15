interface ImageCarouselNavProps {
  imageIndex: number;
  imageCount: number;
  onChange: (step: number) => void;
}

export default function ImageCarouselNav({ imageIndex, imageCount, onChange }: ImageCarouselNavProps) {
  if (imageCount < 2) return null;
  const arrowClass = "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ink bg-cream/90 text-ink hover:bg-[#f6dc74] focus-visible:bg-[#f6dc74] max-[620px]:size-8";
  return (
    <>
      <button className={`${arrowClass} left-3`} type="button" onClick={() => onChange(-1)} aria-label="Previous image">
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        </svg>
      </button>
      <button className={`${arrowClass} right-3`} type="button" onClick={() => onChange(1)} aria-label="Next image">
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        </svg>
      </button>
      <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-extrabold text-cream" aria-live="polite">{imageIndex + 1} / {imageCount}</div>
    </>
  );
}
