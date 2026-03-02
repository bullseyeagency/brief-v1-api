"use client"

import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface StoryboardFrame {
  label: string
  sectionName: string
  duration: string
  purpose: string
  voiceoverOrText: string
  imageUrl: string
}

interface StoryboardProps {
  frames: StoryboardFrame[]
  title?: string
  className?: string
}

export function Storyboard({ frames, title = "TV / YouTube Commercial", className }: StoryboardProps) {
  return (
    <div className={cn("w-full bg-[#0a0a0a] py-24 px-6 md:px-12", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/30 mb-3">Deliverable</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
        </div>

        {/* Storyboard panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {frames.map((frame, index) => (
            <div key={index} className="flex flex-col">
              {/* Frame number + label */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/50 text-xs font-mono">
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{frame.label}</p>
                  <p className="text-white font-medium text-sm">{frame.sectionName}</p>
                </div>
                <span className="ml-auto text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded">
                  {frame.duration}
                </span>
              </div>

              {/* Landscape image frame */}
              <div className="relative w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-4">
                <Image
                  src={frame.imageUrl}
                  alt={frame.sectionName}
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                  unoptimized
                />
                {/* Cinematic letterbox bars */}
                <div className="absolute top-0 left-0 right-0 h-[6%] bg-black/80" />
                <div className="absolute bottom-0 left-0 right-0 h-[6%] bg-black/80" />
              </div>

              {/* Purpose */}
              <p className="text-xs uppercase tracking-widest text-white/30 mb-2">{frame.purpose}</p>

              {/* Voiceover / text */}
              <blockquote className="border-l-2 border-white/20 pl-4">
                <p className="text-white/70 text-sm leading-relaxed italic">
                  &ldquo;{frame.voiceoverOrText}&rdquo;
                </p>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
