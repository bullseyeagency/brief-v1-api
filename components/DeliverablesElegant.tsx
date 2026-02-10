"use client";

interface Headline {
  text: string;
  rationale: string;
}

interface Hook {
  text: string;
  format: string;
  context: string;
}

interface Scene {
  visual: string;
  voiceover: string;
}

interface AdScript {
  duration: string;
  platform: string;
  scenes?: Scene[];
  notes: string;
}

interface DeliverablesElegantProps {
  headlines?: Headline[];
  hooks?: Hook[];
  adScripts?: AdScript[];
}

export function DeliverablesElegant({ headlines, hooks, adScripts }: DeliverablesElegantProps) {
  return (
    <div className="relative bg-white py-40 overflow-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Title Section */}
        <div className="mb-32 max-w-3xl">
          <span className="font-sans text-[10px] uppercase tracking-[0.6em] text-slate-400 block mb-6 font-semibold">
            Ready To Deploy
          </span>
          <h2 className="font-sans text-6xl md:text-8xl font-light text-slate-900 leading-tight tracking-tighter mb-6">
            Creative <span className="font-serif italic font-normal text-slate-400">Deliverables.</span>
          </h2>
          <p className="font-sans text-lg text-slate-600 font-light leading-relaxed">
            Campaign-ready headlines, hooks, and scripts built directly from the brief to give your team immediate starting points.
          </p>
        </div>

        {/* Headlines */}
        {headlines && headlines.length > 0 && (
          <div className="mb-32">
            <div className="mb-12">
              <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                01
              </span>
              <h3 className="font-serif text-4xl text-slate-900 italic">Headlines</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {headlines.map((headline, i) => (
                <div
                  key={i}
                  className="group relative bg-slate-50 rounded-2xl p-10 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-500"
                >
                  {/* Number badge */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-white">{i + 1}</span>
                  </div>

                  {/* Headline text */}
                  <p className="font-serif text-3xl text-slate-900 leading-tight mb-6 pt-4">
                    {headline.text}
                  </p>

                  {/* Rationale */}
                  <div className="relative pl-6 border-l-2 border-slate-300">
                    <span className="font-sans text-[8px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                      Rationale
                    </span>
                    <p className="font-sans text-sm text-slate-600 leading-relaxed">
                      {headline.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hooks */}
        {hooks && hooks.length > 0 && (
          <div className="mb-32">
            <div className="mb-12">
              <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                02
              </span>
              <h3 className="font-serif text-4xl text-slate-900 italic">Hooks</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {hooks.map((hook, i) => (
                <div
                  key={i}
                  className="group relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-10 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-500"
                >
                  {/* Format badge */}
                  <div className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg mb-6">
                    {hook.format}
                  </div>

                  {/* Hook text */}
                  <p className="font-sans text-2xl text-slate-900 font-medium leading-tight mb-6">
                    {hook.text}
                  </p>

                  {/* Context */}
                  <div className="relative pl-6 border-l-2 border-slate-300">
                    <span className="font-sans text-[8px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                      Context
                    </span>
                    <p className="font-sans text-sm text-slate-600 leading-relaxed">
                      {hook.context}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ad Scripts */}
        {adScripts && adScripts.length > 0 && (
          <div>
            <div className="mb-12">
              <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                03
              </span>
              <h3 className="font-serif text-4xl text-slate-900 italic">Ad Scripts</h3>
            </div>

            <div className="space-y-12">
              {adScripts.map((script, i) => (
                <div
                  key={i}
                  className="relative bg-slate-900 rounded-3xl p-12 overflow-hidden"
                >
                  {/* Decorative gradient */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl"></div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <span className="inline-block px-4 py-2 bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg">
                      {script.duration}
                    </span>
                    <span className="inline-block px-4 py-2 bg-white/10 text-white text-xs font-semibold uppercase tracking-wider rounded-lg">
                      {script.platform}
                    </span>
                  </div>

                  {/* Scenes */}
                  {script.scenes && (
                    <div className="space-y-8 mb-8 relative z-10">
                      {script.scenes.map((scene, j) => (
                        <div key={j} className="relative pl-10">
                          {/* Scene number */}
                          <div className="absolute left-0 top-0 w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{j + 1}</span>
                          </div>

                          <div className="space-y-3">
                            {/* Visual */}
                            <div>
                              <span className="font-sans text-[8px] uppercase tracking-[0.5em] text-gray-500 block mb-2">
                                Visual
                              </span>
                              <p className="font-sans text-base text-gray-300 leading-relaxed">
                                {scene.visual}
                              </p>
                            </div>

                            {/* Voiceover */}
                            <div className="bg-white/5 rounded-lg p-4 border-l-2 border-amber-600">
                              <span className="font-sans text-[8px] uppercase tracking-[0.5em] text-gray-500 block mb-2">
                                Voiceover
                              </span>
                              <p className="font-serif text-lg text-white italic leading-relaxed">
                                "{scene.voiceover}"
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="relative z-10 pt-6 border-t border-white/10">
                    <span className="font-sans text-[8px] uppercase tracking-[0.5em] text-gray-500 block mb-2">
                      Notes
                    </span>
                    <p className="font-sans text-sm text-gray-400 italic leading-relaxed">
                      {script.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
