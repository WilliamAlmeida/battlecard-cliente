import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  width?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, width = 'w-64', children }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; placeBelow?: boolean } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  // delays (ms)
  const delayShow = 500; // increased delay per user request
  const delayHide = 100;
  const fadeDuration = 180; // ms for fade-out before unmount

  const clearTimers = () => {
    if (showTimer.current) window.clearTimeout(showTimer.current);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  };

  const show = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (mounted) {
      // already mounted — just animate in
      showTimer.current = window.setTimeout(() => setVisible(true), 0);
      return;
    }
    showTimer.current = window.setTimeout(() => {
      setMounted(true);
      // after mount, compute position on next frame and animate
      requestAnimationFrame(() => setVisible(true));
    }, delayShow);
  };

  const hide = () => {
    if (showTimer.current) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    setVisible(false);
    // unmount after fadeDuration
    hideTimer.current = window.setTimeout(() => setMounted(false), fadeDuration + 50);
    setPos(null);
  };

  useEffect(() => {
    if (!mounted) return;
    if (!tipRef.current || !wrapperRef.current) return;
    const tip = tipRef.current;
    const wrap = wrapperRef.current.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    let left = wrap.left + wrap.width / 2 - tipRect.width / 2;
    let top = wrap.top - tipRect.height - 8;
    let placeBelow = false;
    if (top < 8) {
      top = wrap.bottom + 8;
      placeBelow = true;
    }
    const margin = 8;
    if (left < margin) left = margin;
    if (left + tipRect.width + margin > window.innerWidth) left = window.innerWidth - tipRect.width - margin;

    setPos({ left: Math.round(left), top: Math.round(top), placeBelow });
  }, [mounted, visible]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const tooltipNode = (
    <div
      ref={tipRef}
      style={pos ? { position: 'fixed', left: pos.left + 'px', top: pos.top + 'px' } : { position: 'fixed', left: '-9999px', top: '-9999px' }}
      className={`z-50 ${width}`}
    >
      <div
        className={`pointer-events-auto bg-black/90 text-white text-xs p-3 rounded-lg shadow-lg border border-white/10 transform transition-all duration-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
        style={{ transitionProperty: 'opacity, transform' }}
      >
        {content}
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={wrapperRef}
        className="inline-block"
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={hide}
        onBlur={hide}
      >
        {children}
      </span>
      {mounted && ReactDOM.createPortal(tooltipNode, document.body)}
    </>
  );
};

export default Tooltip;
