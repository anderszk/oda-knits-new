import { useState, type CSSProperties, type FormEvent } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/api";
import ScrollReveal, { useScrollReveal } from "@/components/shared/ScrollReveal";
import type { ContactInfo } from "@/models/content";

const defaultInfo: ContactInfo = {
  eyebrow: "Contact",
  heading: "Custom color, repair, or collaboration?",
  body: "Send a note and Oda Knits will reply with availability and next steps.",
  button: "Send note",
  success: "",
};

interface Palette {
  name: string;
  color: string;
  background: string;
  shadow: string;
  description: string;
}

const palettes: Palette[] = [
  { name: "Rose", color: "#d7658a", background: "#fff5f4", shadow: "rgba(215,101,138,.22)", description: "Soft and warm for sweet custom notes." },
  { name: "Lilac", color: "#bd5bd3", background: "#fbf2ff", shadow: "rgba(189,91,211,.2)", description: "Playful, bright, and a little dramatic." },
  { name: "Mint", color: "#8fcfbd", background: "#effaf6", shadow: "rgba(91,145,125,.22)", description: "Fresh and calm, like new yarn on the table." },
  { name: "Wine", color: "#9a4264", background: "#fff1f5", shadow: "rgba(154,66,100,.22)", description: "Rich and cozy for deeper color ideas." },
];

interface ContactProps {
  info?: ContactInfo | null;
}

export default function Contact({ info = defaultInfo }: ContactProps) {
  const content = info || defaultInfo;
  const [palette, setPalette] = useState(palettes[0]);
  const [status, setStatus] = useState({ sending: false, message: "", error: false });
  const formReveal = useScrollReveal<HTMLFormElement>();
  const fieldClass = "min-w-0 rounded-md border border-[#d9ccd6] bg-[#fffcf7] px-4 py-3 text-ink focus:border-wine focus:outline-2 focus:outline-rose/20";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ sending: true, message: "", error: false });
    try {
      const response = await apiClient.request<{ message: string }>("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      setStatus({ sending: false, message: response.message, error: false });
      form.reset();
    } catch {
      setStatus({ sending: false, message: "Your note could not be sent. Please try again.", error: true });
    }
  };

  return (
    <section className="relative grid min-h-[42rem] grid-cols-[.9fr_1fr] items-center gap-16 px-[clamp(1rem,4vw,4rem)] py-20 transition-colors duration-300 max-[900px]:grid-cols-1 max-[900px]:gap-12 max-[620px]:min-h-0 max-[620px]:px-4 max-[620px]:py-14" id="contact" style={{ background: palette.background }}>
      <ScrollReveal className="relative">
        <p className="mb-3 text-xs font-extrabold uppercase" style={{ color: palette.color }}>{content.eyebrow}</p>
        <h2 className="mb-4 font-display text-[4.2rem] leading-[0.96] max-[900px]:text-5xl max-[620px]:text-[2.5rem] max-[380px]:text-[2.25rem]">{content.heading}</h2>
        <p className="max-w-xl text-lg leading-relaxed text-[#625a67] max-[620px]:text-base">{content.body}</p>
        <div className="mt-8 flex flex-wrap gap-2" aria-label="Preview contact color palette">
          {palettes.map((item) => (
            <button className={`grid min-h-10 w-16 cursor-pointer place-items-center rounded-full transition hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${palette.name === item.name ? "bg-cream/70 ring-2 ring-ink/20" : ""}`} key={item.name} type="button" onClick={() => setPalette(item)} onMouseEnter={() => setPalette(item)} aria-label={`Preview ${item.name} palette`}>
              <span className="h-3 w-14 rounded-full border border-ink/15" style={{ background: item.color }} />
            </button>
          ))}
        </div>
        <div className="mt-3 grid max-w-sm gap-1.5 text-sm">
          <div className="flex flex-wrap items-center gap-2 font-extrabold">
          <span style={{ color: palette.color }}>{palette.name}</span>
          <code className="rounded-full border border-ink/10 bg-cream px-2 py-0.5 font-mono text-xs text-[#625a67]">{palette.color}</code>
        </div>
        <p className="m-0 leading-relaxed text-[#625a67]">{palette.description}</p>
      </div>
      </ScrollReveal>
      <motion.form className="relative grid gap-4 rounded-lg border-2 border-ink/10 bg-cream p-8 shadow-[14px_14px_0_var(--palette-shadow)] max-[620px]:p-5 max-[620px]:shadow-[7px_7px_0_var(--palette-shadow)]" style={{ "--palette-shadow": palette.shadow, ...formReveal.style } as CSSProperties} onSubmit={submit} ref={formReveal.ref}>
        <label className="grid gap-2 text-sm font-extrabold text-[#4e4658]">Name<input className={fieldClass} name="name" minLength={2} required /></label>
        <label className="grid gap-2 text-sm font-extrabold text-[#4e4658]">Email<input className={fieldClass} name="email" type="email" required /></label>
        <label className="hidden">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <label className="grid gap-2 text-sm font-extrabold text-[#4e4658]">Message<textarea className={`${fieldClass} resize-y`} name="message" rows={5} minLength={10} required /></label>
        <button className="mt-1.5 inline-flex min-h-12 w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:text-ink focus-visible:-translate-y-0.5 focus-visible:text-ink disabled:cursor-wait disabled:opacity-60 disabled:transform-none" type="submit" disabled={status.sending} onMouseEnter={(event) => { event.currentTarget.style.background = palette.color; }} onMouseLeave={(event) => { event.currentTarget.style.background = ""; }}>
          {status.sending ? "Sending..." : (
            <>
              {content.button}
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        {status.message && <p className={`m-0 font-extrabold ${status.error ? "text-[#a33b53]" : "text-[#28735c]"}`} role="status">{status.message}</p>}
      </motion.form>
    </section>
  );
}
