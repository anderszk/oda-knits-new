import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { apiClient } from "@/api";
import ScrollReveal, { useMobileMotion, useScrollRevealStyle } from "@/components/shared/ScrollReveal";
import { isWip, type Project } from "@/models/project";

interface MosaicSlot {
  col: [number, number];
  row: [number, number];
}

// Column/row spans mirror the `.work-mosaic--count-N` grid-area rules in styles.css
// (12-col / up-to-8-row grid), so each tile can enter from whichever edge of the
// mosaic it actually sits against, converging toward the center as it settles.
const MOSAIC_LAYOUT: Record<number, MosaicSlot[]> = {
  1: [{ col: [1, 13], row: [1, 7] }],
  2: [
    { col: [1, 7], row: [1, 7] },
    { col: [7, 13], row: [1, 7] },
  ],
  3: [
    { col: [1, 7], row: [1, 9] },
    { col: [7, 13], row: [1, 5] },
    { col: [7, 13], row: [5, 9] },
  ],
  4: [
    { col: [1, 7], row: [1, 5] },
    { col: [7, 13], row: [1, 5] },
    { col: [1, 7], row: [5, 9] },
    { col: [7, 13], row: [5, 9] },
  ],
  5: [
    { col: [1, 6], row: [1, 9] },
    { col: [6, 10], row: [1, 5] },
    { col: [10, 13], row: [1, 5] },
    { col: [6, 9], row: [5, 9] },
    { col: [9, 13], row: [5, 9] },
  ],
  6: [
    { col: [1, 6], row: [1, 9] },
    { col: [6, 10], row: [1, 5] },
    { col: [10, 13], row: [1, 3] },
    { col: [10, 13], row: [3, 5] },
    { col: [6, 9], row: [5, 9] },
    { col: [9, 13], row: [5, 9] },
  ],
};

function mirrorRange([start, end]: [number, number]): [number, number] {
  return [14 - end, 14 - start];
}

interface CardEntrance {
  x: number;
  y: number;
  rotate: number;
}

function cardEntrance(groupSize: number, mirror: boolean, slot: number): CardEntrance {
  const layout = MOSAIC_LAYOUT[groupSize]?.[slot];
  if (!layout) return { x: 0, y: 34, rotate: 0 };
  const col = mirror ? mirrorRange(layout.col) : layout.col;
  const colCenter = (col[0] + col[1]) / 2;
  const rowCenter = (layout.row[0] + layout.row[1]) / 2;
  const gridCenterRow = (groupSize <= 2 ? 6 : 8) / 2 + 1;
  const xDir = Math.sign(colCenter - 7);
  const yDir = Math.sign(rowCenter - gridCenterRow) || 1;
  return {
    x: xDir * (26 + Math.abs(colCenter - 7) * 5),
    y: yDir * (20 + Math.abs(rowCenter - gridCenterRow) * 6),
    rotate: xDir ? xDir * 1.3 : (slot % 2 ? 1 : -1) * 0.8,
  };
}

function chunkProjects(projects: Project[]): Project[][] {
  const chunks: Project[][] = [];
  for (let index = 0; index < projects.length; index += 6) {
    chunks.push(projects.slice(index, index + 6));
  }
  return chunks;
}

interface WorkGalleryProps {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export default function WorkGallery({ projects, onSelect }: WorkGalleryProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mobile = useMobileMotion();
  const projectGroups = chunkProjects(projects);
  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ["start end", "end start"],
  });

  return (
    <section className="bg-cream px-[clamp(1rem,4vw,4rem)] py-24 max-[620px]:px-4 max-[620px]:py-16" id="work">
      <ScrollReveal className="mb-10 flex items-end justify-between gap-12 max-[620px]:flex-col max-[620px]:items-start max-[620px]:gap-4">
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase text-wine">The knit archive</p>
          <h2 className="m-0 font-display text-[4.2rem] leading-[0.96] max-[900px]:text-5xl max-[620px]:text-[2.5rem] max-[380px]:text-[2.25rem]">Made loop by loop</h2>
        </div>
        <p className="mb-1 max-w-sm leading-relaxed text-[#6f6674]">Open a piece for yarn, technique, size, and color details.</p>
      </ScrollReveal>
      <div className="work-grid gap-[1.15rem] max-[620px]:gap-4" ref={gridRef}>
        {projectGroups.map((group, groupIndex) => {
          const mirror = Boolean(groupIndex % 2);
          return (
            <div className={`work-mosaic work-mosaic--count-${group.length} ${mirror ? "work-mosaic--mirror" : ""}`} key={group.map((item) => item.id || item.title).join("-")}>
              {group.map((item, slot) => (
                <WorkCard groupSize={group.length} item={item} key={item.id || item.title} mirror={mirror} mobile={mobile} onSelect={onSelect} progress={scrollYProgress} reduceMotion={reduceMotion} slot={slot} />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface WorkCardProps {
  groupSize: number;
  item: Project;
  mirror: boolean;
  mobile: boolean;
  onSelect: (project: Project) => void;
  progress: MotionValue<number>;
  reduceMotion: boolean | null;
  slot: number;
}

function WorkCard({ groupSize, item, mirror, mobile, onSelect, progress, reduceMotion, slot }: WorkCardProps) {
  const path = cardEntrance(groupSize, mirror, slot);
  const style = useScrollRevealStyle(progress, {
    from: { x: path.x, y: path.y },
    rotate: path.rotate,
    scale: 0.96,
    mobile,
    reduceMotion,
  });
  const hoverLift = useMotionValue(0);
  const zero = useMotionValue(0);
  const liftedY = useTransform([style?.y ?? zero, hoverLift], ([scrollY, lift]: number[]) => scrollY + lift);
  const cardStyle = style ? { ...style, y: liftedY } : undefined;
  const liftIn = () => !reduceMotion && animate(hoverLift, -7, { type: "spring", stiffness: 320, damping: 24 });
  const liftOut = () => !reduceMotion && animate(hoverLift, 0, { type: "spring", stiffness: 320, damping: 24 });
  const colors = item.colors || [];
  const wip = isWip(item.year);
  const compact = groupSize >= 5 && (slot === 2 || slot === 3);
  const tabletCompact = groupSize >= 5 && (slot === 1 || slot === 4);
  const copySize = compact
    ? "min-h-0 p-3 max-[620px]:min-h-[7.8rem] max-[620px]:p-4"
    : tabletCompact
      ? "min-h-[7.8rem] p-4 max-[900px]:min-h-0 max-[900px]:p-3 max-[620px]:min-h-[7.8rem] max-[620px]:p-4"
      : "min-h-[7.8rem] p-4";
  const detailVisibility = compact
    ? "hidden max-[620px]:block"
    : tabletCompact
      ? "block max-[900px]:hidden max-[620px]:block"
      : "block";
  const colorVisibility = compact
    ? "hidden max-[620px]:flex"
    : tabletCompact
      ? "flex max-[900px]:hidden max-[620px]:flex"
      : "flex";

  return (
    <motion.button
      type="button"
      className="work-card group relative h-full cursor-pointer overflow-hidden rounded-lg border border-ink/15 bg-white p-0 text-left shadow-[0_6px_16px_rgba(61,48,70,.06)] transition-shadow duration-300 hover:shadow-[0_20px_40px_rgba(61,48,70,.18)] focus-visible:outline-[3px] focus-visible:outline-offset-3 focus-visible:outline-rose"
      onClick={() => onSelect(item)}
      style={cardStyle}
      onHoverStart={liftIn}
      onHoverEnd={liftOut}
      whileTap={{ scale: 0.985 }}
    >
      <div className="h-full overflow-hidden bg-mint">
        <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]" src={apiClient.assetUrl(item.image)} alt="" />
        <span className="absolute top-3 right-3 rounded-full border border-ink bg-cream px-2 py-1 text-[0.72rem] font-extrabold">{wip ? "WIP" : item.year}</span>
      </div>
      <div className={`absolute inset-x-0 bottom-0 bg-cream/90 backdrop-blur-md ${copySize}`}>
        <p className={`mb-2 text-xs font-extrabold uppercase text-[#8f4965] ${detailVisibility}`}>{item.category}</p>
        <h3 className={`m-0 truncate font-display leading-none ${compact ? "pr-24 text-lg max-[620px]:pr-0 max-[620px]:text-2xl" : tabletCompact ? "text-2xl max-[900px]:pr-20 max-[900px]:text-lg max-[620px]:pr-0 max-[620px]:text-2xl" : "text-2xl"}`}>{item.title}</h3>
        <div className={`mt-3 gap-1.5 ${colorVisibility}`} aria-label={`Colors: ${colors.map((color) => color.name).join(", ")}`}>
          {colors.map((color) => <i className="block size-4 rounded-full border border-ink/25" key={color.name} style={{ background: color.hex }} />)}
        </div>
        <span className="absolute right-3.5 bottom-3 text-xs font-bold text-[#655d69] max-[620px]:static max-[620px]:mt-3 max-[620px]:block">View project <b className="text-base text-rose" aria-hidden="true">&#8599;</b></span>
      </div>
    </motion.button>
  );
}
