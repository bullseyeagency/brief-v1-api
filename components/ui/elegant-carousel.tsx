'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SlideData {
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  imageUrl: string;
}

interface ElegantCarouselProps {
  slides: SlideData[];
}

const SLIDE_DURATION = 6000;

export default function ElegantCarousel({ slides }: ElegantCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
    }, 50);
    autoAdvanceRef.current = setTimeout(() => {
      goTo((prev: number) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
  }, [clearTimers, slides.length]);

  const goTo = useCallback(
    (indexOrUpdater: number | ((prev: number) => number)) => {
      setIsTransitioning(true);
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next =
            typeof indexOrUpdater === 'function'
              ? indexOrUpdater(prev)
              : indexOrUpdater;
          return next;
        });
        setIsTransitioning(false);
        setTimeout(() => setIsVisible(true), 50);
      }, 600);
    },
    []
  );

  // Kick off visibility and progress on mount
  useEffect(() => {
    if (slides.length === 0) return;
    const t = setTimeout(() => setIsVisible(true), 100);
    startProgress();
    return () => {
      clearTimeout(t);
      clearTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart progress whenever index changes
  useEffect(() => {
    if (slides.length === 0) return;
    startProgress();
    return clearTimers;
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrev = () => {
    goTo((prev: number) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    goTo((prev: number) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? handleNext() : handlePrev();
    }
    touchStartX.current = null;
  };

  if (slides.length === 0) return null;

  const slide = slides[currentIndex];
  const visibleClass = isVisible && !isTransitioning ? 'visible' : isTransitioning ? 'transitioning' : '';

  return (
    <div
      className="carousel-wrapper"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background wash */}
      <div
        className="carousel-bg-wash"
        style={{
          background: `radial-gradient(ellipse at 60% 50%, ${slide.accent}18 0%, transparent 70%)`,
        }}
      />

      <div className="carousel-inner">
        {/* Content side */}
        <div className="carousel-content">
          <div className="carousel-content-inner">
            {/* Collection number */}
            <div className={`carousel-collection-num ${visibleClass}`}>
              <span className="carousel-num-line" />
              <span className="carousel-num-text">
                {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </div>

            {/* Title */}
            <h2 className={`carousel-title ${visibleClass}`}>
              {slide.title}
            </h2>

            {/* Subtitle */}
            <p
              className={`carousel-subtitle ${visibleClass}`}
              style={{ color: slide.accent }}
            >
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className={`carousel-description ${visibleClass}`}>
              {slide.description}
            </p>

            {/* Arrow navigation */}
            <div className="carousel-nav-arrows">
              <button
                className="carousel-arrow-btn"
                onClick={handlePrev}
                aria-label="Previous slide"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className="carousel-arrow-btn"
                onClick={handleNext}
                aria-label="Next slide"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Image side */}
        <div className="carousel-image-container">
          {/* Frame corners */}
          <div
            className="carousel-frame-corner carousel-frame-corner--tl"
            style={{ borderColor: `${slide.accent}50` }}
          />
          <div
            className="carousel-frame-corner carousel-frame-corner--br"
            style={{ borderColor: `${slide.accent}50` }}
          />

          <div className={`carousel-image-frame ${visibleClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="carousel-image"
            />
            <div
              className="carousel-image-overlay"
              style={{
                background: `linear-gradient(135deg, ${slide.accent}12 0%, transparent 60%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="carousel-progress-bar">
        {slides.map((s, i) => (
          <button
            key={i}
            className={`carousel-progress-item ${i === currentIndex ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
          >
            <div className="carousel-progress-track">
              <div
                className="carousel-progress-fill"
                style={{
                  width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%',
                  background: i === currentIndex ? slide.accent : undefined,
                }}
              />
            </div>
            <span className="carousel-progress-label">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
