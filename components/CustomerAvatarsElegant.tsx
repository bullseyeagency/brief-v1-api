"use client";

import { useState } from 'react';

interface Avatar {
  name: string;
  age: number;
  type: 'primary' | 'secondary' | 'tertiary';
  currentState: string;
  desire: string;
  conflict: string;
  transformation: string;
  background?: string;
  values: string[];
  decisionFactors: string[];
}

interface CustomerAvatarsElegantProps {
  avatars: Avatar[];
  businessName?: string;
}

export function CustomerAvatarsElegant({ avatars, businessName = 'Business' }: CustomerAvatarsElegantProps) {
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

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

  return (
    <div className="relative bg-white py-32 overflow-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      <div className="max-w-7xl mx-auto px-8">
        {/* Title Section */}
        <div className="mb-32 max-w-3xl">
          <span className="font-sans text-[10px] uppercase tracking-[0.6em] text-slate-400 block mb-6 font-semibold">
            The Audience
          </span>
          <h2 className="font-sans text-6xl md:text-8xl font-light text-slate-900 leading-tight tracking-tighter">
            Customer <span className="font-serif italic font-normal text-slate-400">Avatars.</span>
          </h2>
          <p className="font-sans text-lg text-slate-600 mt-6 font-light leading-relaxed">
            Three dimensional personas representing the transformation journey from current state to desired future.
          </p>
        </div>

        {/* Avatar Grid */}
        <div className="space-y-48">
          {avatars.map((avatar, index) => {
            const isEven = index % 2 === 0;

            return (
              <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-16 items-start ${isEven ? '' : 'md:flex-row-reverse'}`}>
                {/* Avatar Portrait */}
                <div className={`md:col-span-4 ${isEven ? 'md:col-start-1' : 'md:col-start-9'} ${isEven ? 'order-1' : 'order-2'}`}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 group">
                    {loadingStates[index] ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                          <span className="font-sans text-xs text-slate-600">Generating image...</span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={generatedImages[index] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.name}`}
                        alt={avatar.name}
                        className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105"
                      />
                    )}
                    {/* Decorative frame */}
                    <div className="absolute inset-0 border border-slate-200/50"></div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 border-r border-b border-slate-300/30"></div>
                  </div>

                  {/* Avatar Meta */}
                  <div className="mt-8">
                    <h3 className="font-serif text-4xl text-slate-900 mb-2">{avatar.name}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-sans text-slate-600">Age {avatar.age}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-sans text-slate-400 uppercase tracking-wider text-xs">
                        {getTypeLabel(avatar.type)}
                      </span>
                    </div>

                    {/* Generate Image Button */}
                    <button
                      onClick={() => handleGenerateImage(avatar, index)}
                      disabled={loadingStates[index]}
                      className="mt-4 font-sans text-xs text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                      {generatedImages[index] ? 'Regenerate Image' : 'Generate Image'}
                    </button>
                  </div>
                </div>

                {/* Avatar Story */}
                <div className={`md:col-span-7 ${isEven ? 'md:col-start-6 order-2' : 'md:col-start-1 order-1'} space-y-10 pt-8`}>
                  {/* Current State */}
                  <div>
                    <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-3">
                      Current State
                    </span>
                    <p className="font-sans text-xl text-slate-700 leading-relaxed font-light">
                      {avatar.currentState}
                    </p>
                  </div>

                  {/* Desire */}
                  <div>
                    <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-3">
                      Desire
                    </span>
                    <p className="font-serif text-2xl text-slate-900 leading-relaxed italic">
                      {avatar.desire}
                    </p>
                  </div>

                  {/* Conflict */}
                  <div>
                    <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-3">
                      Conflict
                    </span>
                    <p className="font-sans text-xl text-slate-700 leading-relaxed font-light">
                      {avatar.conflict}
                    </p>
                  </div>

                  {/* Transformation */}
                  <div className="bg-slate-50 -mx-6 px-6 py-8 border-l-2 border-slate-300">
                    <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-600 block mb-3 font-semibold">
                      Transformation
                    </span>
                    <p className="font-sans text-xl text-slate-800 leading-relaxed font-normal">
                      {avatar.transformation}
                    </p>
                  </div>

                  {/* Values & Decision Factors */}
                  {(avatar.values || avatar.decisionFactors) && (
                    <div className="grid md:grid-cols-2 gap-8 pt-4">
                      {/* Values */}
                      {avatar.values && avatar.values.length > 0 && (
                        <div>
                          <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-4">
                            Values
                          </span>
                          <ul className="space-y-2">
                            {avatar.values.map((value, i) => (
                              <li key={i} className="font-sans text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-slate-300 mt-1">—</span>
                                <span>{value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Decision Factors */}
                      {avatar.decisionFactors && avatar.decisionFactors.length > 0 && (
                        <div>
                          <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-4">
                            Decision Factors
                          </span>
                          <ul className="space-y-2">
                            {avatar.decisionFactors.map((factor, i) => (
                              <li key={i} className="font-sans text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-slate-300 mt-1">—</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
