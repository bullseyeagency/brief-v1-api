"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface Feature {
  step: string
  title?: string
  content: string
  image: string
}

interface FeatureStepsProps {
  features: Feature[]
  className?: string
  title?: string
}

export function FeatureSteps({ features, className, title = "The Story" }: FeatureStepsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  const setRef = useCallback((el: HTMLDivElement | null, index: number) => {
    stepRefs.current[index] = el
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    stepRefs.current.forEach((el, index) => {
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index)
          }
        },
        {
          rootMargin: "-35% 0px -35% 0px",
          threshold: 0,
        }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [features.length])

  return (
    <div className={cn("w-full bg-white", className)}>
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-12 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black">
          {title}
        </h2>
      </div>

      {/* Mobile layout: stacked */}
      <div className="md:hidden max-w-2xl mx-auto px-6 pb-24 space-y-16">
        {features.map((feature, index) => (
          <div key={index} className="space-y-6">
            {/* Image — natural ratio */}
            <div className="w-full rounded-xl overflow-hidden bg-gray-50">
              <Image
                src={feature.image}
                alt={feature.title || feature.step}
                width={1000}
                height={700}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
            {/* Text */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                {index + 1}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  {feature.step}
                </p>
                <h3 className="text-xl font-semibold text-black mb-2">
                  {feature.title || feature.step}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop layout: sticky image + scrollable steps */}
      <div className="hidden md:block max-w-7xl mx-auto px-12">
        <div className="grid grid-cols-2 gap-16 items-start">

          {/* Left: scrollable steps */}
          <div className="py-8">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={(el) => setRef(el, index)}
                className="min-h-[70vh] flex items-center py-12"
              >
                <motion.div
                  animate={{ opacity: index === activeIndex ? 1 : 0.25 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-6"
                >
                  {/* Step indicator */}
                  <div className="flex-shrink-0 pt-1">
                    <motion.div
                      animate={{
                        backgroundColor: index === activeIndex ? "#000" : "#e5e7eb",
                        color: index === activeIndex ? "#fff" : "#9ca3af",
                        scale: index === activeIndex ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    >
                      {index < activeIndex ? "✓" : index + 1}
                    </motion.div>
                    {/* Vertical connector */}
                    {index < features.length - 1 && (
                      <div className="w-px h-full bg-gray-200 mx-auto mt-3" style={{ minHeight: "2rem" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                      {feature.step}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-semibold text-black mb-4">
                      {feature.title || feature.step}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-prose">
                      {feature.content}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Right: sticky image panel */}
          <div className="sticky top-24 py-8">
            <div className="relative w-full rounded-2xl bg-gray-50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="w-full"
                >
                  <Image
                    src={features[activeIndex].image}
                    alt={features[activeIndex].title || features[activeIndex].step}
                    width={1000}
                    height={700}
                    className="w-full h-auto rounded-2xl"
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>

              {/* Step label overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  {features.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ width: i === activeIndex ? 24 : 6, backgroundColor: i === activeIndex ? "#000" : "#d1d5db" }}
                      transition={{ duration: 0.3 }}
                      className="h-1.5 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
