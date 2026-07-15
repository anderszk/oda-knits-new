import { forwardRef } from "react";

interface ModalCloseButtonProps {
  label: string;
  onClick: () => void;
}

const ModalCloseButton = forwardRef<HTMLButtonElement, ModalCloseButtonProps>(function ModalCloseButton({ label, onClick }, ref) {
  return (
    <button
      ref={ref}
      className="absolute top-3 right-3 z-30 flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-cream hover:bg-rose hover:text-ink focus-visible:bg-rose focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-cream max-[620px]:top-4 max-[620px]:size-7"
      onClick={onClick}
      aria-label={label}
      title="Close"
    >
      <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      </svg>
    </button>
  );
});

export default ModalCloseButton;
