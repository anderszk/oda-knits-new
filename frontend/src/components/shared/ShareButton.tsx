import { useState } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
}

export default function ShareButton({ url, title, text, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        if ((error as DOMException)?.name !== "AbortError") console.error(error);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button
      type="button"
      className={`absolute top-3 right-14 z-30 flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-cream transition hover:bg-rose hover:text-ink focus-visible:bg-rose focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-cream max-[620px]:top-4 max-[620px]:right-12 max-[620px]:size-7 ${className}`}
      onClick={handleShare}
      aria-label={copied ? "Link copied" : "Share"}
      title={copied ? "Copied!" : "Share"}
    >
      {copied ? (
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16V4M12 4 7.5 8.5M12 4l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
