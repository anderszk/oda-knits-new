import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/api";
import ScrollReveal, { useScrollReveal } from "@/components/shared/ScrollReveal";
import type { InstagramPost } from "@/models/instagramPost";

const instagramUrl = "https://www.instagram.com/oda.knits_/";
const postPaths = [
  { x: -28, y: 22, rotate: -1 },
  { x: 14, y: 30, rotate: 0.8 },
  { x: 26, y: 18, rotate: -0.8 },
  { x: -12, y: 32, rotate: 1 },
];

export default function InstagramCarousel() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);

  useEffect(() => {
    apiClient
      .request<InstagramPost[]>("/api/instagram")
      .then((items) => {
        if (items.length) setPosts(items);
      })
      .catch(() => {});
  }, []);

  const visiblePosts = posts.slice(0, 4);

  if (!visiblePosts.length) return null;

  return (
    <section
      className="scroll-mt-6 border-y border-ink/10 bg-[#f3efe7] px-[clamp(1rem,4vw,4rem)] py-18 max-[620px]:scroll-mt-4 max-[620px]:px-4 max-[620px]:py-12"
      id="instagram"
    >
      <ScrollReveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold uppercase text-wine">
            Follow me on Instagram!
          </p>
          <h2 className="font-display text-[3.6rem] leading-none max-[900px]:text-5xl max-[620px]:text-[2.45rem]">
            Fresh from the feed
          </h2>
          <a className="mt-3 inline-flex rounded-full border border-ink/10 bg-cream px-3 py-1 text-sm font-extrabold text-wine transition hover:border-wine hover:bg-white" href={instagramUrl} target="_blank" rel="noreferrer">
            @oda.knits_
          </a>
        </div>
      </ScrollReveal>

      <div
        className="flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visiblePosts.map((post, index) => <InstagramPostCard index={index} key={post.id} post={post} />)}
      </div>
      <ScrollReveal className="mx-auto mt-5 w-fit" distance={20}>
        <a
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink bg-ink px-5 pt-2.5 pb-2 font-extrabold leading-none text-cream transition hover:bg-rose hover:text-ink"
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
        >
          View more on Instagram
          <svg className="size-4.5" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="17" cy="7" r="1.4" fill="currentColor" />
          </svg>
        </a>
      </ScrollReveal>
    </section>
  );
}

function InstagramPostCard({ index, post }: { index: number; post: InstagramPost }) {
  const path = postPaths[index % postPaths.length];
  const reveal = useScrollReveal<HTMLAnchorElement>({ from: { x: path.x, y: path.y }, rotate: path.rotate, scale: 0.97 });

  return (
    <motion.a
      className="group relative min-w-[62vw] snap-start overflow-hidden rounded-lg border border-ink/10 bg-cream shadow-[0_14px_30px_rgba(61,48,70,.10)] sm:min-w-[13rem] lg:min-w-[14rem]"
      href={post.permalink}
      ref={reveal.ref}
      rel="noreferrer"
      style={reveal.style}
      target="_blank"
    >
      <img
        className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        src={post.image}
        alt={post.caption || "Instagram post from Oda Knits"}
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-14 text-cream">
        <p className="line-clamp-2 text-sm font-bold leading-relaxed">
          {post.caption || "Open on Instagram"}
        </p>
      </div>
    </motion.a>
  );
}
