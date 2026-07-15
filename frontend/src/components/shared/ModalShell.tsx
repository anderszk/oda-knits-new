import { motion, type DragControls, type PanInfo } from "framer-motion";
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import ModalCloseButton from "@/components/shared/ModalCloseButton";

interface ModalShellProps {
  labelledBy: string;
  closeLabel: string;
  modalRef: RefObject<HTMLDivElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  mobile: boolean;
  dragControls: DragControls;
  handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  closingBySwipe: boolean;
  startDrag: (event: ReactPointerEvent) => void;
  onClose: () => void;
  shareButton?: ReactNode;
  children: ReactNode;
}

export default function ModalShell({
  labelledBy,
  closeLabel,
  modalRef,
  closeButtonRef,
  mobile,
  dragControls,
  handleDragEnd,
  closingBySwipe,
  startDrag,
  onClose,
  shareButton,
  children,
}: ModalShellProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241e29]/70 p-4 max-[620px]:items-end max-[620px]:p-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        ref={modalRef}
        className="relative grid max-h-[min(86vh,760px)] w-full max-w-[960px] grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] overflow-auto rounded-lg border border-ink/20 bg-cream max-[900px]:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] max-[620px]:h-[94svh] max-[620px]:max-h-[94svh] max-[620px]:grid-cols-1 max-[620px]:grid-rows-[auto_minmax(0,1fr)] max-[620px]:overflow-hidden max-[620px]:rounded-t-2xl max-[620px]:rounded-b-none max-[620px]:border-x-0 max-[620px]:border-b-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        drag={mobile ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={closingBySwipe ? { opacity: 0, y: 420 } : { opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 330, damping: 30 }}
      >
        <div className="absolute inset-x-0 top-0 z-20 hidden h-7 touch-none max-[620px]:block" onPointerDown={startDrag}>
          <span className="absolute top-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-ink/25" aria-hidden="true" />
        </div>
        {shareButton}
        <ModalCloseButton ref={closeButtonRef} onClick={onClose} label={closeLabel} />
        {children}
      </motion.div>
    </motion.div>
  );
}
