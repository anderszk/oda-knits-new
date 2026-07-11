import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assetUrl } from "../api";

export default function ProjectModal({ project, onClose }) {
  const closeButton = useRef(null);
  const modal = useRef(null);
  const touchStartX = useRef(null);
  const colors = project.colors || [];
  const images = project.images?.length ? project.images : [project.image].filter(Boolean);
  const isWip = String(project.year || "").trim().toLowerCase() === "wip";
  const [imageIndex, setImageIndex] = useState(0);
  const arrowClass = "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ink bg-cream/90 text-ink hover:bg-[#f6dc74] focus-visible:bg-[#f6dc74] max-[620px]:size-8";
  const details = [
    ["Yarn", project.yarn],
    ["Fiber", project.fiber],
    ["Technique", project.technique],
    ["Needles", project.needles],
    ["Size", project.size],
    ["Making time", project.time],
  ].filter(([, value]) => value);

  useEffect(() => {
    setImageIndex(0);
  }, [project.id]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (images.length > 1 && event.key === "ArrowLeft") {
        event.preventDefault();
        setImageIndex((current) => (current - 1 + images.length) % images.length);
      }
      if (images.length > 1 && event.key === "ArrowRight") {
        event.preventDefault();
        setImageIndex((current) => (current + 1) % images.length);
      }
      if (event.key === "Tab") {
        const focusable = [...(modal.current?.querySelectorAll("button") || [])];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    closeButton.current?.focus();
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [images.length, onClose]);

  const changeImage = (step) => {
    setImageIndex((current) => (current + step + images.length) % images.length);
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current === null || images.length < 2) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) > 48) changeImage(distance > 0 ? -1 : 1);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241e29]/70 p-4 max-[620px]:items-end max-[620px]:p-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        ref={modal}
        className="relative grid max-h-[min(86vh,760px)] w-full max-w-[960px] grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] overflow-auto rounded-lg border border-ink/20 bg-cream max-[900px]:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] max-[620px]:h-[94svh] max-[620px]:max-h-[94svh] max-[620px]:grid-cols-1 max-[620px]:grid-rows-[auto_minmax(0,1fr)] max-[620px]:overflow-hidden max-[620px]:rounded-t-2xl max-[620px]:rounded-b-none max-[620px]:border-x-0 max-[620px]:border-b-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 330, damping: 30 }}
      >
        <span className="absolute top-2 left-1/2 z-20 hidden h-1 w-12 -translate-x-1/2 rounded-full bg-ink/25 max-[620px]:block" aria-hidden="true" />
        <button ref={closeButton} className="absolute top-3 right-3 z-20 flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-cream hover:bg-rose hover:text-ink focus-visible:bg-rose focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-cream max-[620px]:top-4 max-[620px]:size-7" onClick={onClose} aria-label="Close project" title="Close">
          <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
          </svg>
        </button>
        <div className="relative min-h-full overflow-hidden bg-mint max-[620px]:h-[39svh] max-[620px]:min-h-[17rem]" onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
          <AnimatePresence mode="wait">
            <motion.img
              className="block h-full min-h-[34rem] w-full object-cover max-[620px]:h-full max-[620px]:min-h-0"
              key={images[imageIndex]}
              src={assetUrl(images[imageIndex])}
              alt={`${project.title}, view ${imageIndex + 1} of ${images.length}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          </AnimatePresence>
          {project.year && <span className="absolute top-3 right-3 rounded-full border border-ink bg-cream px-2 py-1 text-[0.72rem] font-extrabold max-[620px]:top-auto max-[620px]:right-auto max-[620px]:bottom-3 max-[620px]:left-3">{isWip ? "Work in progress" : `Made in ${project.year}`}</span>}
          {images.length > 1 && (
            <>
              <button className={`${arrowClass} left-3`} type="button" onClick={() => changeImage(-1)} aria-label="Previous image">
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
                </svg>
              </button>
              <button className={`${arrowClass} right-3`} type="button" onClick={() => changeImage(1)} aria-label="Next image">
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
                </svg>
              </button>
              <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-extrabold text-cream" aria-live="polite">{imageIndex + 1} / {images.length}</div>
            </>
          )}
        </div>
        <div className="px-10 pt-14 pb-10 max-[900px]:px-6 max-[900px]:pt-14 max-[900px]:pb-6 max-[620px]:overflow-y-auto max-[620px]:px-4 max-[620px]:pt-0 max-[620px]:pb-8">
          <div className="max-[620px]:sticky max-[620px]:top-0 max-[620px]:z-10 max-[620px]:-mx-4 max-[620px]:border-b max-[620px]:border-ink/10 max-[620px]:bg-cream max-[620px]:px-4 max-[620px]:pt-5 max-[620px]:pb-4">
            <p className="mb-3 text-xs font-extrabold uppercase text-wine max-[620px]:mb-2">{project.category}</p>
            <h2 className="mb-4 font-display text-[3.3rem] leading-[0.96] max-[900px]:text-[2.7rem] max-[620px]:mb-2 max-[620px]:pr-8 max-[620px]:text-[2.1rem]" id="project-title">{project.title}</h2>
            <p className="text-[1.05rem] leading-relaxed text-[#665e6b] max-[620px]:line-clamp-3 max-[620px]:text-[0.98rem]">{project.description}</p>
          </div>
          {colors.length > 0 && (
            <div className="my-6 flex flex-wrap gap-2 max-[620px]:my-4" aria-label="Project colors">
              {colors.map((color) => (
                <span className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2 py-1 text-xs font-bold" key={color.name}>
                  <i className="size-4 rounded-full border border-ink/20" style={{ background: color.hex }} />{color.name}
                </span>
              ))}
            </div>
          )}
          {images.length > 1 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[620px]:mb-5" aria-label="Choose project image">
              {images.map((image, index) => (
                <button className={`size-13 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-transparent p-0 max-[620px]:size-14 ${index === imageIndex ? "border-wine" : "border-transparent"}`} type="button" key={image} onClick={() => setImageIndex(index)} aria-label={`Show image ${index + 1}`}>
                  <img className="size-full object-cover" src={assetUrl(image)} alt="" />
                </button>
              ))}
            </div>
          )}
          <dl className="m-0 grid grid-cols-2 border-t border-ink/15 max-[620px]:grid-cols-2 max-[620px]:gap-2 max-[620px]:border-0">
            {details.map(([label, value]) => (
              <div className="min-w-0 border-b border-ink/15 py-3 odd:pr-4 max-[620px]:rounded-lg max-[620px]:border max-[620px]:border-ink/10 max-[620px]:bg-white/60 max-[620px]:p-3" key={label}>
                <dt className="mb-1 text-[0.68rem] font-extrabold uppercase text-wine">{label}</dt>
                <dd className="m-0 text-sm leading-snug [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </motion.div>
  );
}
