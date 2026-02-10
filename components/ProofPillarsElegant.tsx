"use client";

interface ProofPillar {
  claim: string;
  evidence: string;
}

interface ProofPillarsElegantProps {
  pillars: ProofPillar[];
}

export function ProofPillarsElegant({ pillars }: ProofPillarsElegantProps) {
  return (
    <div className="relative bg-gradient-to-b from-[#1a1a1a] to-black py-40 overflow-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .pillar-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pillar-card:hover {
          transform: translateY(-8px);
        }
        .pillar-number {
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-700 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Title Section */}
        <div className="mb-32 text-center max-w-3xl mx-auto">
          <span className="font-sans text-[10px] uppercase tracking-[0.6em] text-amber-600 block mb-6 font-semibold">
            The Evidence
          </span>
          <h2 className="font-sans text-6xl md:text-8xl font-light text-white leading-tight tracking-tighter mb-6">
            Proof <span className="font-serif italic font-normal text-amber-500">Pillars.</span>
          </h2>
          <p className="font-sans text-lg text-gray-400 font-light leading-relaxed">
            Five supporting claims backed by concrete evidence that establish credibility and demonstrate results.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="pillar-card group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-amber-500/30"
            >
              {/* Pillar Number */}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <span className="text-3xl font-bold text-white">{(index + 1).toString().padStart(2, '0')}</span>
              </div>

              {/* Content */}
              <div className="mt-8">
                {/* Claim */}
                <h3 className="font-serif text-2xl text-white mb-6 leading-tight italic">
                  {pillar.claim}
                </h3>

                {/* Evidence */}
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-amber-500/50 to-transparent"></div>
                  <div className="pl-6">
                    <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-gray-500 block mb-3">
                      Evidence
                    </span>
                    <p className="font-sans text-base text-gray-300 leading-relaxed font-light">
                      {pillar.evidence}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative corner accent */}
              <div className="absolute bottom-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r border-b border-amber-500/20 group-hover:border-amber-500/50 transition-colors duration-500"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
