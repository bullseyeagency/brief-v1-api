"use client";

interface CreativeDirectionElegantProps {
  creativeDirections: string;
  visualStyle: string;
  narrativeApproach: string;
}

export function CreativeDirectionElegant({
  creativeDirections,
  visualStyle,
  narrativeApproach
}: CreativeDirectionElegantProps) {
  return (
    <div className="relative bg-[#fafafa] py-40 overflow-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,0,0,0.1),transparent_50%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Title Section */}
        <div className="mb-32 max-w-3xl">
          <span className="font-sans text-[10px] uppercase tracking-[0.6em] text-slate-400 block mb-6 font-semibold">
            The Execution
          </span>
          <h2 className="font-sans text-6xl md:text-8xl font-light text-slate-900 leading-tight tracking-tighter mb-6">
            Creative <span className="font-serif italic font-normal text-slate-400">Direction.</span>
          </h2>
          <p className="font-sans text-lg text-slate-600 font-light leading-relaxed">
            How this brand should look, feel, and sound across all touchpoints.
          </p>
        </div>

        {/* Art Direction & Execution */}
        <div className="mb-40">
          <div className="max-w-4xl">
            <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-6">
              Art Direction & Execution
            </span>
            <p className="font-sans text-2xl md:text-3xl text-slate-800 leading-relaxed font-light">
              {creativeDirections}
            </p>
          </div>
        </div>

        {/* Visual Style & Narrative - Staggered Layout */}
        <div className="space-y-32">
          {/* Visual Style */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-3 md:col-start-1">
              <div className="sticky top-24">
                <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                  01
                </span>
                <h3 className="font-serif text-3xl text-slate-900 italic">
                  Visual Style
                </h3>
              </div>
            </div>
            <div className="md:col-span-8 md:col-start-5">
              <div className="relative bg-white rounded-2xl p-12 shadow-sm border border-slate-200">
                {/* Decorative line */}
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-slate-900 via-slate-400 to-transparent"></div>

                <p className="font-sans text-xl md:text-2xl text-slate-700 leading-relaxed font-light">
                  {visualStyle}
                </p>
              </div>
            </div>
          </div>

          {/* Narrative Approach */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-8 md:col-start-1 order-2 md:order-1">
              <div className="relative bg-slate-900 rounded-2xl p-12 shadow-xl">
                {/* Decorative line */}
                <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-amber-500 via-amber-700 to-transparent"></div>

                <p className="font-sans text-xl md:text-2xl text-gray-200 leading-relaxed font-light">
                  {narrativeApproach}
                </p>
              </div>
            </div>
            <div className="md:col-span-3 md:col-start-10 order-1 md:order-2">
              <div className="sticky top-24 text-right">
                <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                  02
                </span>
                <h3 className="font-serif text-3xl text-slate-900 italic">
                  Narrative Approach
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
