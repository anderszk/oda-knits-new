import { useEffect, useRef, useState } from "react";
import { useDragControls } from "framer-motion";
import { useMobileMotion } from "@/components/shared/ScrollReveal";

export function useDismissableModal({ resetKey, imageCount, onClose }) {
  const closeButtonRef = useRef(null);
  const modalRef = useRef(null);
  const touchStartX = useRef(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [closingBySwipe, setClosingBySwipe] = useState(false);
  const mobile = useMobileMotion();
  const dragControls = useDragControls();

  const changeImage = (step) => {
    setImageIndex((current) => (current + step + imageCount) % imageCount);
  };

  useEffect(() => {
    setImageIndex(0);
  }, [resetKey]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const onKeyDown = (event) => {
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
        const focusable = [...(modalRef.current?.querySelectorAll("button, input") || [])];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
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
  }, [imageCount, onClose]);

  const startDrag = (event) => {
    if (mobile) dragControls.start(event);
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.y > 110 || info.velocity.y > 700) {
      setClosingBySwipe(true);
      onClose();
    }
  };

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event) => {
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
