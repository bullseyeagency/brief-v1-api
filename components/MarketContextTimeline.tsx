"use client";

interface MarketContextTimelineProps {
  marketContext: string;
  competitiveLandscape: string;
  marketTension: string;
}

export function MarketContextTimeline({
  marketContext,
  competitiveLandscape,
  marketTension,
}: MarketContextTimelineProps) {
  return (
    <div className="relative bg-[#fcfcfc] py-40 overflow-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .image-reveal {
          mask-image: linear-gradient(to bottom, black 80%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent);
        }
      `}</style>

      {/* Background Decorative Image */}
      <div className="absolute top-[10%] -right-20 w-1/2 opacity-20 pointer-events-none image-reveal">
        <img
          src="https://images.unsplash.com/photo-1507393534149-dd2f8f59b4b5?auto=format&fit=crop&q=80&w=1000"
          alt="Luxury Texture"
          className="grayscale object-cover h-[800px] w-full"
        />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Title Section */}
        <div className="mb-64 max-w-2xl">
          <span className="font-sans text-[10px] uppercase tracking-[0.6em] text-amber-700 block mb-6 font-semibold">
            The Landscape
          </span>
          <h2 className="font-sans text-6xl md:text-8xl font-light text-slate-900 leading-tight tracking-tighter">
            Market <span className="font-serif italic font-normal text-slate-400">Context.</span>
          </h2>
        </div>

        {/* Market Landscape - Text Left, Image Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center mb-80">
          <div className="md:col-span-5 order-2 md:order-1">
            <span className="font-sans text-[10px] uppercase tracking-widest text-slate-400 block mb-4">
              Strategic Insight
            </span>
            <h3 className="font-sans text-3xl font-light leading-snug text-slate-800">
              {marketContext}
            </h3>
          </div>

          <div className="md:col-span-6 md:col-start-7 order-1 md:order-2">
            <div className="relative aspect-[4/5] overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=1000"
                className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105"
                alt="Market Landscape"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border-l border-b border-amber-700/30"></div>
            </div>
          </div>
        </div>

        {/* Competitive Landscape - Image Left, Text Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start mb-80">
          <div className="md:col-span-7 relative">
            <div className="aspect-video overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1200"
                className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                alt="Competitive Landscape"
              />
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9 pt-12">
            <span className="font-sans text-[10px] uppercase tracking-widest text-slate-400 block mb-4">
              Competition
            </span>
            <h3 className="font-sans text-3xl font-light leading-snug text-slate-800">
              {competitiveLandscape}
            </h3>
          </div>
        </div>

        {/* Market Tension - Full Width */}
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-sans text-[10px] uppercase tracking-widest text-amber-700 block mb-4 font-semibold">
            The Opportunity
          </span>
          <h3 className="font-sans text-4xl md:text-5xl font-light leading-tight text-slate-900 mb-8">
            The <span className="font-serif italic">Tension</span>
          </h3>
          <p className="font-sans text-2xl md:text-3xl text-slate-700 leading-relaxed font-light">
            {marketTension}
          </p>
        </div>
      </div>
    </div>
  );
}
