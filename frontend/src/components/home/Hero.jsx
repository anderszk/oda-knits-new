import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import YarnScene from "./YarnScene";

export default function Hero() {
  const hero = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: hero,
    offset: ["start start", "end start"],
  });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [0.86, 0.76]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 55]);

  return (
    <section
      className="relative grid min-h-screen min-h-[100svh] items-center overflow-hidden bg-blush px-[clamp(1rem,4vw,4rem)] pt-36 pb-16 max-[900px]:min-h-[860px] max-[900px]:items-end max-[900px]:pt-28 max-[900px]:pb-28 max-[620px]:min-h-[100svh] max-[620px]:px-4 max-[620px]:pt-24 max-[620px]:pb-[5.5rem]"
      id="home"
      ref={hero}
    >
      <motion.div
        className="absolute top-8 right-0 bottom-0 left-[43%] z-0 origin-center max-[900px]:inset-[4rem_4rem_36%] max-[620px]:inset-[4.25rem_-2rem_43%]"
        style={reduceMotion ? undefined : { y: sceneY, scale: sceneScale }}
      >
        <YarnScene />
      </motion.div>
      <motion.div

        className="relative z-10 flex max-w-[34rem] flex-col items-start gap-[1.35rem] max-[900px]:max-w-xl max-[620px]:gap-4 top-2"
        style={reduceMotion ? undefined : { y: copyY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65 }}
      >
        <p className="m-0 text-xs font-extrabold uppercase text-wine">
          My personal knitwear studio
        </p>
        <h1 className="m-0 whitespace-nowrap font-display text-[7rem] leading-[0.96] max-[900px]:text-8xl max-[620px]:text-[3.25rem]">
          Oda Knits
          <span className="ml-[0.12em] text-star" aria-hidden="true">
            *
          </span>
        </h1>
        <p className="m-0 max-w-xl text-lg leading-relaxed text-[#625a67] max-[620px]:text-base">
          One-of-a-kind knits, made slowly in Oslo.
        </p>
        <a
          className="mt-1 inline-flex min-h-12 items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink focus-visible:-translate-y-0.5 focus-visible:bg-rose focus-visible:text-ink"
          href="#work"
        >
          View my work
        </a>
      </motion.div>
    </section>
  );
}
