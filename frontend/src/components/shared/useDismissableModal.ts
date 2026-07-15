import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from "react";
import { useDragControls, type PanInfo } from "framer-motion";
import { useMobileMotion } from "@/components/shared/ScrollReveal";

interface UseDismissableModalOptions {
  resetKey: string;
  imageCount: number;
  onClose: () => void;
}

export function useDismissableModal({ resetKey, imageCount, onClose }: UseDismissableModalOptions) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [closingBySwipe, setClosingBySwipe] = useState(false);
  const mobile = useMobileMotion();
  const dragControls = useDragControls();

  const changeImage = (step: number) => {
    setImageIndex((current) => (current + step + imageCount) % imageCount);
  };

  useEffect(() => {
    setImageIndex(0);
  }, [resetKey]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (imageCount > 1 && event.key === "ArrowLeft") {
        event.preventDefault();
        changeImage(-1);
      }
      if (imageCount > 1 && event.key === "ArrowRight") {
        event.preventDefault();
        changeImage(1);
      }
      if (event.key === "Tab") {
        const focusable = [...(modalRef.current?.querySelectorAll<HTMLElement>("button, input") || [])];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageCount, onClose]);

  const startDrag = (event: ReactPointerEvent) => {
    if (mobile) dragControls.start(event);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 700) {
      setClosingBySwipe(true);
      onClose();
    }
  };

  const onTouchStart = (event: ReactTouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event: ReactTouchEvent) => {
    if (touchStartX.current === null || imageCount < 2) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) > 48) changeImage(distance > 0 ? -1 : 1);
  };

  return {
    closeButtonRef,
    modalRef,
    imageIndex,
    setImageIndex,
    changeImage,
    closingBySwipe,
    mobile,
    dragControls,
    startDrag,
    handleDragEnd,
    onTouchStart,
    onTouchEnd,
  };
}
