"use client";

interface BrandFoundationFlowProps {
  brandTruth: string;
  brandPromise: string;
  uniqueTruth: string;
}

export function BrandFoundationFlow({ brandTruth, brandPromise, uniqueTruth }: BrandFoundationFlowProps) {
  return (
    <div className="relative h-[180vh] max-w-6xl mx-auto px-4 pt-32 bg-[#fafafa]">
      <style jsx>{`
        @keyframes flowLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes revealText {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .path-trace {
          fill: none;
          stroke: #b89248;
          stroke-width: 1.2;
          stroke-dasharray: 1500;
          stroke-dashoffset: 1500;
          animation: flowLine 6s ease-in-out forwards;
          opacity: 0.6;
        }
        .point {
          opacity: 0;
          animation: revealText 1.2s forwards cubic-bezier(0.16, 1, 0.3, 1);
        }
        .point-1 { animation-delay: 0.5s; }
        .point-2 { animation-delay: 1.5s; }
        .point-3 { animation-delay: 2.5s; }
        .serif { font-family: 'Didot', 'Playfair Display', serif; }
      `}</style>

      {/* The Fluid Path */}
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[600px] h-full pointer-events-none z-0"
        viewBox="0 0 600 1500"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          className="path-trace"
          d="M300,0 C500,400 100,600 300,900 C500,1200 200,1400 300,1500"
        />
      </svg>

      {/* Typography Sections */}
      <div className="relative z-10 space-y-72">
        {/* Brand Truth */}
        <div className="point point-1 text-left pl-0 md:pl-[10%]">
          <span className="block font-sans uppercase tracking-[0.5em] text-[0.65rem] text-[#b89248] mb-5">
            Brand Truth
          </span>
          <span className="inline-block text-3xl md:text-5xl leading-tight max-w-md md:max-w-lg font-normal tracking-tight text-[#2d2d2d] serif">
            {brandTruth}
          </span>
        </div>

        {/* Brand Promise */}
        <div className="point point-2 text-right pr-0 md:pr-[10%]">
          <span className="block font-sans uppercase tracking-[0.5em] text-[0.65rem] text-[#b89248] mb-5">
            Brand Promise
          </span>
          <span className="inline-block text-3xl md:text-5xl leading-tight max-w-md md:max-w-lg font-normal tracking-tight text-[#2d2d2d] serif">
            {brandPromise}
          </span>
        </div>

        {/* Unique Truth */}
        <div className="point point-3 text-left pl-0 md:pl-[20%]">
          <span className="block font-sans uppercase tracking-[0.5em] text-[0.65rem] text-[#b89248] mb-5">
            Unique Truth
          </span>
          <span className="inline-block text-3xl md:text-5xl leading-tight max-w-md md:max-w-lg font-normal tracking-tight text-[#2d2d2d] serif">
            {uniqueTruth}
          </span>
        </div>
      </div>
    </div>
  );
}
