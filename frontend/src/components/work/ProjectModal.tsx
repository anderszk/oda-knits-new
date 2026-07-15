import { AnimatePresence, motion } from "framer-motion";
import { apiClient } from "@/api";
import ColorSwatchList from "@/components/shared/ColorSwatchList";
import ImageCarouselNav from "@/components/shared/ImageCarouselNav";
import ImageThumbnailStrip from "@/components/shared/ImageThumbnailStrip";
import ModalShell from "@/components/shared/ModalShell";
import ShareButton from "@/components/shared/ShareButton";
import { useDismissableModal } from "@/components/shared/useDismissableModal";
import { isWip, type Project } from "@/models/project";

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const colors = project.colors || [];
  const images = project.images?.length ? project.images : [project.image].filter(Boolean);
  const wip = isWip(project.year);
  const details: [string, string][] = [
    ["Yarn", project.yarn],
    ["Fiber", project.fiber],
    ["Technique", project.technique],
    ["Needles", project.needles],
    ["Size", project.size],
    ["Making time", project.time],
  ].filter(([, value]) => value) as [string, string][];

  const {
    closeButtonRef, modalRef, imageIndex, setImageIndex, changeImage,
    closingBySwipe, mobile, dragControls, startDrag, handleDragEnd,
    onTouchStart, onTouchEnd,
  } = useDismissableModal({ resetKey: project.id, imageCount: images.length, onClose });

  return (
    <ModalShell
      labelledBy="project-title"
      closeLabel="Close project"
      modalRef={modalRef}
      closeButtonRef={closeButtonRef}
      mobile={mobile}
      dragControls={dragControls}
      handleDragEnd={handleDragEnd}
      closingBySwipe={closingBySwipe}
      startDrag={startDrag}
      onClose={onClose}
      shareButton={<ShareButton url={window.location.href} title={project.title} text={project.description} />}
    >
      <div className="relative min-h-full overflow-hidden bg-mint max-[620px]:h-[39svh] max-[620px]:min-h-[17rem]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.img
            className="block h-full min-h-[34rem] w-full object-cover max-[620px]:h-full max-[620px]:min-h-0"
            key={images[imageIndex]}
            src={apiClient.assetUrl(images[imageIndex])}
            alt={`${project.title}, view ${imageIndex + 1} of ${images.length}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
        </AnimatePresence>
        {project.year && <span className="absolute top-3 right-3 rounded-full border border-ink bg-cream px-2 py-1 text-[0.72rem] font-extrabold max-[620px]:top-auto max-[620px]:right-auto max-[620px]:bottom-3 max-[620px]:left-3">{wip ? "Work in progress" : `Made in ${project.year}`}</span>}
        <ImageCarouselNav imageIndex={imageIndex} imageCount={images.length} onChange={changeImage} />
      </div>
      <div className="px-10 pt-14 pb-10 max-[900px]:px-6 max-[900px]:pt-14 max-[900px]:pb-6 max-[620px]:overflow-y-auto max-[620px]:px-4 max-[620px]:pt-0 max-[620px]:pb-8">
        <div className="max-[620px]:sticky max-[620px]:top-0 max-[620px]:z-10 max-[620px]:-mx-4 max-[620px]:border-b max-[620px]:border-ink/10 max-[620px]:bg-cream max-[620px]:px-4 max-[620px]:pt-5 max-[620px]:pb-4">
          <p className="mb-3 text-xs font-extrabold uppercase text-wine max-[620px]:mb-2">{project.category}</p>
          <h2 className="mb-4 font-display text-[3.3rem] leading-[0.96] max-[900px]:text-[2.7rem] max-[620px]:mb-2 max-[620px]:pr-8 max-[620px]:text-[2.1rem]" id="project-title">{project.title}</h2>
          <p className="text-[1.05rem] leading-relaxed text-[#665e6b] max-[620px]:line-clamp-3 max-[620px]:text-[0.98rem]">{project.description}</p>
        </div>
        <ColorSwatchList colors={colors} className="my-6 flex flex-wrap gap-2 max-[620px]:my-4" label="Project colors" />
        <ImageThumbnailStrip
          images={images}
          activeIndex={imageIndex}
          onSelect={setImageIndex}
          className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[620px]:mb-5"
          thumbClassName="max-[620px]:size-14"
          label="Choose project image"
        />
        <dl className="m-0 grid grid-cols-2 border-t border-ink/15 max-[620px]:grid-cols-2 max-[620px]:gap-2 max-[620px]:border-0">
          {details.map(([label, value]) => (
            <div className="min-w-0 border-b border-ink/15 py-3 odd:pr-4 max-[620px]:rounded-lg max-[620px]:border max-[620px]:border-ink/10 max-[620px]:bg-white/60 max-[620px]:p-3" key={label}>
              <dt className="mb-1 text-[0.68rem] font-extrabold uppercase text-wine">{label}</dt>
              <dd className="m-0 text-sm leading-snug [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ModalShell>
  );
}
