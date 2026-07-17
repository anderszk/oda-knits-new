import AboutCharmScene from "./AboutCharmScene";
import ScrollReveal from "@/components/shared/ScrollReveal";
import portrait from "@/img/me.jpg";
import { aboutDetailTiles, type AboutContent } from "@/models/content";

interface AboutProps {
  about: AboutContent | null;
}

export default function About({ about }: AboutProps) {
  const detailTiles = aboutDetailTiles(about);
  const body = Array.isArray(about?.body) ? about.body : [about?.body];

  return (
    <section
      className="relative overflow-hidden border-y border-ink/10 bg-oat px-[clamp(1rem,4vw,4rem)] py-24 max-[620px]:px-4 max-[620px]:py-16"
      id="about"
    >
      <div className="relative mx-auto grid max-w-[88rem] grid-cols-[minmax(12rem,.68fr)_minmax(21rem,1.22fr)_minmax(15rem,.7fr)] items-center gap-12 max-[1050px]:grid-cols-[minmax(13rem,.8fr)_minmax(20rem,1.2fr)] max-[900px]:grid-cols-1">
        <ScrollReveal className="relative max-[900px]:max-w-sm" rotate={-1}>
          <span
            className="absolute -top-6 -left-4 h-full w-full rounded-lg border-2 border-rose/55 max-[620px]:top-1 max-[620px]:-left-2"
            aria-hidden="true"
          />
          <div className="relative rounded-lg bg-cream p-3 shadow-[18px_18px_0_rgba(154,66,100,.14)] max-[620px]:shadow-[9px_9px_0_rgba(154,66,100,.14)]">
            <img
              className="aspect-4/5 w-full rounded-md border border-ink/15 object-cover object-[center_56%]"
              src={portrait}
              alt="Oda wearing a hand-knit sweater by the coast"
            />
          </div>
          <span className="mt-8 block text-center font-display text-sm max-[620px]:mt-4">
            maker / knitter / color collector
          </span>
        </ScrollReveal>

        <ScrollReveal className="relative border-y border-ink/15 py-8">
          <p className="mb-3 text-xs font-extrabold uppercase text-wine">
            About me
          </p>
          <strong className="mb-4 block font-display text-2xl text-wine">
            {about?.name}
          </strong>
          <h2 className="mb-5 font-display text-[3.35rem] leading-[0.94] max-[900px]:text-5xl max-[620px]:text-[2.65rem] max-[380px]:text-[2.35rem]">
            {about?.headline}
          </h2>
          <div className="max-w-[42rem] text-[1.02rem] leading-[1.68] text-[#5d5861]">
            {body
              .filter(Boolean)
              .map((paragraph) => (
                <p className="mb-3" key={paragraph}>
                  {paragraph}
                </p>
              ))}
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {detailTiles.map((detail) => (
              <div
                className="rounded-lg border border-ink/10 bg-cream/70 px-4 py-3 shadow-[0_10px_24px_rgba(61,48,70,.05)]"
                key={detail.label}
              >
                <span className="mb-1 block text-[0.68rem] font-extrabold uppercase text-[#786e7d]">
                  {detail.label}
                </span>
                <strong className="block font-display text-[1.05rem] leading-tight text-wine">
                  {detail.value}
                </strong>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal
          className="-mt-8 p-3 max-[1050px]:col-span-2 max-[900px]:col-span-1 max-[900px]:mt-0 max-[620px]:p-0"
          from={{ x: 32, y: 20 }}
          rotate={1}
        >
          <AboutCharmScene />
          <div className="px-2 pt-3 pb-1 text-center">
            <strong className="block font-display text-xl">Aileen</strong>
            <span className="text-sm text-[#6d6476]">
              Tap Aileen for a tiny wave.
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
