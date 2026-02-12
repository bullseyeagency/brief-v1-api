"use client";

import { useState, useEffect } from 'react';
import { Avatar } from '@/lib/types';

interface CustomerAvatarsElegantProps {
  avatars: Avatar[] | [Avatar, Avatar, Avatar];
  businessName?: string;
  existingImages?: [string, string, string] | null;
}

export function CustomerAvatarsElegant({ avatars, businessName = 'Business', existingImages }: CustomerAvatarsElegantProps) {
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

  // Load existing images on mount
  useEffect(() => {
    if (existingImages) {
      const imageMap: Record<number, string> = {};
      existingImages.forEach((url, index) => {
        if (url) imageMap[index] = url;
      });
      setGeneratedImages(imageMap);
    }
  }, [existingImages]);

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'primary': return 'Primary Hero';
      case 'secondary': return 'Secondary Mirror';
      case 'tertiary': return 'Tertiary Aspirational';
      default: return type;
    }
  };

  const handleGenerateImage = async (avatar: Avatar, index: number) => {
    try {
      setLoadingStates(prev => ({ ...prev, [index]: true }));

      const response = await fetch('/api/generate-avatar-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar,
          businessName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImages(prev => ({ ...prev, [index]: data.imageUrl }));
    } catch (error) {
      console.error('Error generating avatar image:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setLoadingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  // Filter out avatars without complete data
  const validAvatars = avatars.filter(avatar => avatar.name && avatar.age);

  return (
    <div className="relative bg-white py-24 overflow-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      <div className="max-w-7xl mx-auto px-8">
        {/* Title Section */}
        <div className="mb-16 text-center">
          <h2 className="font-sans text-5xl md:text-7xl font-bold text-slate-900 uppercase tracking-tight">
            {businessName} <span className="text-slate-400">CASTING</span>
          </h2>
          <div className="mt-4 h-1 w-32 bg-slate-900 mx-auto"></div>
        </div>

        {/* 3 Column Casting Grid */}
        <div className={`grid grid-cols-1 ${validAvatars.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : validAvatars.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'} gap-8 lg:gap-12`}>
          {validAvatars.map((avatar, index) => {
            // Find original index for image mapping
            const originalIndex = avatars.findIndex(a => a === avatar);
            return (
              <div key={originalIndex} className="flex flex-col">
              {/* Portrait */}
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 border-2 border-slate-900">
                {loadingStates[originalIndex] ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                      <span className="font-sans text-xs text-slate-600">Generating...</span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={generatedImages[originalIndex] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.name}`}
                    alt={avatar.name}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>

              {/* Character Sheet */}
              <div className="bg-slate-50 border-2 border-t-0 border-slate-900 p-6 space-y-6">
                {/* Name & Role */}
                <div className="border-b border-slate-300 pb-4">
                  <h3 className="font-sans text-2xl font-bold text-slate-900 uppercase tracking-tight mb-1">
                    {avatar.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-sans text-slate-600 font-medium">Age {avatar.age}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-sans text-slate-500 uppercase tracking-wider text-xs font-semibold">
                      {getTypeLabel(avatar.type)}
                    </span>
                  </div>
                </div>

                {/* Current State */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.3em] text-slate-900 block mb-2 font-bold">
                    Current State
                  </label>
                  <p className="font-sans text-sm text-slate-700 leading-relaxed">
                    {avatar.currentState}
                  </p>
                </div>

                {/* Desire */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.3em] text-slate-900 block mb-2 font-bold">
                    Desire
                  </label>
                  <p className="font-serif text-base text-slate-900 leading-relaxed italic">
                    {avatar.desire}
                  </p>
                </div>

                {/* Conflict */}
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-[0.3em] text-slate-900 block mb-2 font-bold">
                    Conflict
                  </label>
                  <p className="font-sans text-sm text-slate-700 leading-relaxed">
                    {avatar.conflict}
                  </p>
                </div>

                {/* Transformation */}
                <div className="bg-white border border-slate-300 p-4 -mx-2">
                  <label className="font-sans text-[10px] uppercase tracking-[0.3em] text-slate-900 block mb-2 font-bold">
                    Transformation
                  </label>
                  <p className="font-sans text-sm text-slate-800 leading-relaxed font-medium">
                    {avatar.transformation}
                  </p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={() => handleGenerateImage(avatar, originalIndex)}
                  disabled={loadingStates[originalIndex]}
                  className="w-full mt-4 font-sans text-xs bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider py-3 font-bold border-2 border-slate-900"
                >
                  {generatedImages[originalIndex] ? 'Regenerate Portrait' : 'Generate Portrait'}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
