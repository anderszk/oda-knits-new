import { motion, useReducedMotion, useScroll } from "framer-motion";
import { useRef } from "react";
import { assetUrl } from "../api";
import ScrollReveal, { useMobileMotion, useScrollRevealStyle } from "./ScrollReveal";

const cardPaths = [
  { x: -56, y: 26, rotate: -1.4 },
  { x: 42, y: 34, rotate: 1.1 },
  { x: 52, y: -10, rotate: 1.6 },
  { x: -36, y: 44, rotate: -1 },
  { x: -44, y: -14, rotate: 1 },
  { x: 50, y: 18, rotate: -1.3 },
];

function chunkProjects(projects) {
  const chunks = [];
  for (let index = 0; index < projects.length; index += 6) {
    chunks.push(projects.slice(index, index + 6));
  }
  return chunks;
}

export default function WorkGallery({ projects, onSelect }) {
  const gridRef = useRef(null);
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
        {projectGroups.map((group, groupIndex) => (
          <div className={`work-mosaic work-mosaic--count-${group.length} ${groupIndex % 2 ? "work-mosaic--mirror" : ""}`} key={group.map((item) => item.id || item.title).join("-")}>
            {group.map((item, slot) => (
              <WorkCard groupSize={group.length} item={item} index={groupIndex * 6 + slot} key={item.id || item.title} mobile={mobile} onSelect={onSelect} progress={scrollYProgress} reduceMotion={reduceMotion} slot={slot} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkCard({ groupSize, item, index, mobile, onSelect, progress, reduceMotion, slot }) {
  const path = cardPaths[index % cardPaths.length];
  const style = useScrollRevealStyle(progress, {
    from: { x: path.x, y: path.y },
    rotate: path.rotate,
    scale: 0.96,
    mobile,
    reduceMotion,
  });
  const colors = item.colors || [];
  const isWip = String(item.year || "").trim().toLowerCase() === "wip";
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
      className="work-card group relative h-full cursor-pointer overflow-hidden rounded-lg border border-ink/15 bg-white p-0 text-left focus-visible:outline-[3px] focus-visible:outline-offset-3 focus-visible:outline-rose"
      onClick={() => onSelect(item)}
      style={style}
      whileTap={{ scale: 0.985 }}
    >
      <div className="h-full overflow-hidden bg-mint">
        <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]" src={assetUrl(item.image)} alt="" />
        <span className="absolute top-3 right-3 rounded-full border border-ink bg-cream px-2 py-1 text-[0.72rem] font-extrabold">{isWip ? "WIP" : item.year}</span>
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
