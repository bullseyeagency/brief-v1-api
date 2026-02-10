'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';

interface StarWarsCrawlProps {
  title: string;
  text: string;
}

export function StarWarsCrawl({ title, text }: StarWarsCrawlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] md:h-[800px] overflow-hidden bg-black"
      style={{
        perspective: '400px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Crawling text */}
      <motion.div
        className="absolute bottom-0 left-1/2 w-full max-w-3xl text-center text-yellow-400"
        style={{
          transformOrigin: '50% 100%',
          transform: 'translateX(-50%)',
        }}
        initial={{
          y: '100%',
          rotateX: 25,
          scale: 2,
        }}
        animate={{
          y: '-200%',
          rotateX: 25,
          scale: 0.3,
        }}
        transition={{
          duration: 60,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-wider">
          {title}
        </h2>
        <div className="text-lg md:text-2xl leading-relaxed space-y-6 px-4">
          {text.split('\n\n').map((paragraph, i) => (
            <p key={i} className="mb-6">
              {paragraph}
            </p>
          ))}
        </div>
      </motion.div>

      {/* Fade overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />

      {/* Fade overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent z-10" />
    </div>
  );
}
