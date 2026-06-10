"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeroCarouselSlide = {
  src: string;
  alt: string;
};

type HeroCarouselProps = {
  slides: HeroCarouselSlide[];
  prevLabel: string;
  nextLabel: string;
  goToSlideLabel: string;
};

const AUTOPLAY_MS = 5000;

export function HeroCarousel({
  slides,
  prevLabel,
  nextLabel,
  goToSlideLabel,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slideCount = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setActiveIndex((index + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (slideCount <= 1 || paused) return;

    const timer = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [goNext, paused, slideCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  if (slideCount === 0) return null;

  return (
    <div
      className="gradient p-1 rounded-lg"
      data-testid="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="relative aspect-square overflow-hidden rounded-md bg-muted"
        aria-roledescription="carousel"
        aria-label={slides[activeIndex]?.alt}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={index !== activeIndex}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        ))}

        {slideCount > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
              onClick={goPrev}
              aria-label={prevLabel}
              data-testid="hero-carousel-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
              onClick={goNext}
              aria-label={nextLabel}
              data-testid="hero-carousel-next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    index === activeIndex
                      ? "bg-white shadow-sm"
                      : "bg-white/50 hover:bg-white/75"
                  )}
                  onClick={() => goTo(index)}
                  aria-label={`${goToSlideLabel} ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  data-testid={`hero-carousel-dot-${index}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
