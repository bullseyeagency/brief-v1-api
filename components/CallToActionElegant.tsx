"use client";

interface CallToActionElegantProps {
  callToAction: string;
  offer: string;
  conversionPath: string;
}

export function CallToActionElegant({ callToAction, offer, conversionPath }: CallToActionElegantProps) {
  return (
    <div className="relative bg-[#1a1a1a] py-40 overflow-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .text-shimmer {
          background: linear-gradient(90deg, #ffffff 0%, #d4af37 50%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          to {
            background-position: 200% center;
          }
        }
      `}</style>

      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto px-8 relative z-10">
        {/* Small heading */}
        <div className="mb-12 text-center">
          <span className="font-sans text-[10px] uppercase tracking-[0.6em] text-amber-600 block font-semibold">
            The Invitation
          </span>
        </div>

        {/* Main CTA */}
        <div className="text-center mb-20">
          <h2 className="font-serif text-5xl md:text-7xl font-semibold text-white leading-tight mb-8 text-shimmer">
            {callToAction}
          </h2>
          <p className="font-sans text-2xl md:text-3xl text-gray-400 font-light leading-relaxed max-w-3xl mx-auto">
            {offer}
          </p>
        </div>

        {/* Conversion Path */}
        <div className="relative">
          {/* Decorative line */}
          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-amber-700/50 to-transparent"></div>

          <div className="pl-12 pr-4">
            <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-gray-500 block mb-6">
              Conversion Path
            </span>
            <p className="font-sans text-xl md:text-2xl text-gray-300 leading-relaxed font-light">
              {conversionPath}
            </p>
          </div>

          {/* Decorative accent */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 border border-amber-700/50 rotate-45"></div>
        </div>
      </div>
    </div>
  );
}
