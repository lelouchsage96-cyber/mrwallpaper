import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InViewOpts = {
  rootMargin?: string;
  once?: boolean;
  disabled?: boolean;
};

export function useInView<T extends Element = HTMLElement>(opts: InViewOpts = {}) {
  const { rootMargin = "280px 80px", once = true, disabled = false } = opts;
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(disabled);
  const ref = useCallback((el: T | null) => setNode(el), []);

  useEffect(() => {
    if (disabled) {
      setInView(true);
      return;
    }
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        if (once) io.disconnect();
      },
      { root: null, rootMargin, threshold: 0 },
    );
    io.observe(node);
    const fallback = window.setTimeout(() => setInView(true), 250);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [disabled, node, once, rootMargin]);

  return { ref, inView };
}

export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  sizes,
  srcSet,
  priority,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  srcSet?: string;
  priority?: boolean;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);
  const href = failed && fallback ? fallback : src;
  const webp =
    href.endsWith(".webp")
      ? href
      : href.includes("/wallpapers/thumbs/")
        ? href.replace(/\.(jpe?g|png)$/i, ".webp")
        : href.replace(/-thumb\.jpe?g$/i, "-thumb.webp");
  const useWebp = href.includes("/wallpapers/thumbs/") || href.endsWith(".webp");

  return (
    <picture className="contents">
      {useWebp && !failed ? <source type="image/webp" srcSet={webp} /> : null}
      <img
        src={href}
        srcSet={!failed ? srcSet : undefined}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        onError={() => {
          if (fallback && !failed) setFailed(true);
        }}
        className={cn("bg-elevated", className)}
      />
    </picture>
  );
}

export function LazyMount({
  children,
  minHeight = 280,
  eager,
}: {
  children: ReactNode;
  minHeight?: number;
  eager?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({
    disabled: eager,
    rootMargin: "640px 0px",
  });
  return (
    <div ref={ref} style={inView ? undefined : { minHeight }}>
      {inView ? children : null}
    </div>
  );
}

export function InfiniteSentinel({
  onLoad,
  disabled,
}: {
  onLoad: () => void;
  disabled: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: false,
    disabled,
    rootMargin: "720px 0px",
  });
  const fn = useRef(onLoad);
  fn.current = onLoad;

  useEffect(() => {
    if (!inView || disabled) return;
    fn.current();
  }, [disabled, inView]);

  if (disabled) return null;
  return <div ref={ref} className="h-8" aria-hidden />;
}
