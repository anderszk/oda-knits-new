import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export function useMobileMotion(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 620px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return mobile;
}

interface Offset {
  x?: number;
  y?: number;
}

interface ScrollRevealOptions {
  distance?: number;
  from?: Offset;
  out?: Offset;
  rotate?: number;
  scale?: number;
}

interface ScrollRevealStyle {
  opacity: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  distance = 34,
  from = { x: 0, y: distance },
  out,
  rotate = 0,
  scale = 0.96,
}: ScrollRevealOptions = {}): { ref: RefObject<T | null>; style: ScrollRevealStyle | undefined } {
  const ref = useRef<T>(null);
  const reduceMotion = useReducedMotion();
  const mobile = useMobileMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return {
    ref,
    style: useScrollRevealStyle(scrollYProgress, {
      from,
      out,
      rotate,
      scale,
      reduceMotion,
      mobile,
    }),
  };
}

interface ScrollRevealStyleOptions {
  from?: Offset;
  out?: Offset;
  rotate?: number;
  scale?: number;
  reduceMotion?: boolean | null;
  mobile?: boolean;
}

export function useScrollRevealStyle(
  progress: MotionValue<number>,
  {
    from = { x: 0, y: 34 },
    out,
    rotate = 0,
    scale = 0.96,
    reduceMotion,
    mobile,
  }: ScrollRevealStyleOptions = {},
): ScrollRevealStyle | undefined {
  const mobileY = Math.min(Math.abs(from.y || 14), 14) * Math.sign(from.y || 1);
  const enter = mobile ? { x: 0, y: mobileY } : from;
  const exit = mobile
    ? { x: 0, y: -14 }
    : out || { x: -(from.x || 0), y: -Math.abs(from.y || 34) };
  const range = [0, 0.3, 0.7, 1];
  const opacity = useTransform(
    progress,
    range,
    mobile ? [0.96, 1, 1, 0.96] : [0.82, 1, 1, 0.9],
  );
  const x = useTransform(progress, range, [enter.x || 0, 0, 0, exit.x || 0]);
  const y = useTransform(progress, range, [enter.y || 0, 0, 0, exit.y || 0]);
  const rotateValue = useTransform(
    progress,
    range,
    mobile ? [0, 0, 0, 0] : [rotate, 0, 0, -rotate],
  );
  const scaleValue = useTransform(
    progress,
    range,
    mobile ? [0.99, 1, 1, 0.99] : [scale, 1, 1, scale],
  );

  return reduceMotion
    ? undefined
    : { opacity, x, y, rotate: rotateValue, scale: scaleValue };
}

interface ScrollRevealProps extends ScrollRevealOptions, Omit<HTMLMotionProps<"div">, keyof ScrollRevealOptions | "ref" | "style"> {
  children: ReactNode;
  className?: string;
}

export default function ScrollReveal({
  children,
  className = "",
  distance,
  from,
  out,
  rotate,
  scale,
  ...props
}: ScrollRevealProps) {
  const reveal = useScrollReveal({ distance, from, out, rotate, scale });

  return (
    <motion.div
      className={className}
      ref={reveal.ref}
      style={reveal.style}
      {...props}
    >
      {children}
    </motion.div>
  );
}
