"use client"

import React, { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from "lucide-react"

interface FbAdPreviewProps {
  pageName: string
  primaryText: string
  headline: string
  description: string
  ctaLabel?: string
  imageUrl: string
  targetLabel: string
  accentColor?: string
  className?: string
}

export function FbAdPreview({
  pageName,
  primaryText,
  headline,
  description,
  ctaLabel = "Learn More",
  imageUrl,
  targetLabel,
  accentColor = "#1877F2",
  className,
}: FbAdPreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const truncated = primaryText.length > 120 && !expanded

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-sm w-full", className)}>
      {/* Ad header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {pageName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{pageName}</p>
            <p className="text-xs text-gray-500">Sponsored · <span className="inline-flex items-center gap-0.5">🌐</span></p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1 -mt-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Primary text */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed">
          {truncated ? primaryText.slice(0, 120) + "..." : primaryText}
          {primaryText.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-gray-500 font-medium hover:underline text-xs"
            >
              {expanded ? "See less" : "See more"}
            </button>
          )}
        </p>
      </div>

      {/* Ad image */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={imageUrl}
          alt={headline}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Target badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
          {targetLabel}
        </div>
      </div>

      {/* Link card */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide truncate">{pageName.toLowerCase()}.com</p>
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{headline}</p>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
        <button
          className="flex-shrink-0 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-md transition-colors"
        >
          {ctaLabel}
        </button>
      </div>

      {/* Reaction bar */}
      <div className="flex items-center justify-around px-4 py-2 border-t border-gray-100">
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
          <ThumbsUp className="w-4 h-4" /> Like
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
          <MessageCircle className="w-4 h-4" /> Comment
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  )
}
