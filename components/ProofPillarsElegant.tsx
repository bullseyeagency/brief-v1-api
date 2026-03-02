"use client";

interface ProofPillar {
  claim: string;
  evidenceType: string;
  evidence: string;
  usageGuidance?: string;
}

interface ProofPillarsElegantProps {
  pillars: (ProofPillar | string)[];
}

export function ProofPillarsElegant({ pillars }: ProofPillarsElegantProps) {
  // Format evidence type for display
  const formatEvidenceType = (type: string) => {
    const typeMap: Record<string, string> = {
      'testimonial': 'Verification / Client',
      'statistic': 'Verification / Data',
      'case-study': 'Verification / Case Study',
      'certification': 'Verification / Certification',
      'demonstration': 'Verification / Demonstration',
    };
    return typeMap[type] || 'Verification';
  };

  // Normalize a pillar — legacy briefs may have stored pillars as raw strings
  const normalizePillar = (pillar: ProofPillar | string): ProofPillar | null => {
    if (typeof pillar === 'string') {
      // Attempt to parse structured text like "Claim:\n...\nEvidence:\n...\nUsage Guidance:\n..."
      const claimMatch = pillar.match(/Claim:\s*\n?([\s\S]*?)(?:\n\nEvidence:|$)/i);
      const evidenceMatch = pillar.match(/Evidence:\s*\n?([\s\S]*?)(?:\n\nUsage Guidance:|$)/i);
      const usageMatch = pillar.match(/Usage Guidance:\s*\n?([\s\S]*?)$/i);
      if (claimMatch || evidenceMatch) {
        return {
          claim: (claimMatch?.[1] ?? '').trim(),
          evidenceType: 'demonstration',
          evidence: (evidenceMatch?.[1] ?? pillar).trim(),
          usageGuidance: (usageMatch?.[1] ?? '').trim(),
        };
      }
      return null;
    }
    return pillar;
  };

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300;1,600&family=Montserrat:wght@200;700&display=swap');

        .evidence-container {
          padding: 150px 10%;
          max-width: 1400px;
          margin: 0 auto;
          background-color: #ffffff;
          color: #0a0a0a;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(4rem, 12vw, 9rem);
          font-style: italic;
          line-height: 0.8;
          margin: 0 0 100px 0;
          letter-spacing: -0.05em;
          color: #0a0a0a;
        }

        .pillar-row {
          display: flex;
          flex-wrap: wrap;
          position: relative;
          margin-bottom: 200px;
          align-items: flex-start;
        }

        .big-num {
          position: absolute;
          font-family: 'Montserrat', sans-serif;
          font-size: 15vw;
          font-weight: 700;
          color: #f2f2f2;
          z-index: 0;
          top: -50px;
          left: -50px;
          line-height: 1;
        }

        .claim-side {
          flex: 1;
          min-width: 300px;
          padding-right: 50px;
          position: relative;
          z-index: 1;
        }

        .claim-side h3 {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1;
          margin: 0;
          letter-spacing: -0.03em;
          color: #0a0a0a;
        }

        .claim-side p {
          font-family: 'Montserrat', sans-serif;
          color: #888;
          font-size: 0.9rem;
          margin-top: 0;
          margin-bottom: 20px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .evidence-side {
          flex: 1;
          min-width: 300px;
          margin-top: 40px;
          position: relative;
          z-index: 1;
        }

        .evidence-quote {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-style: italic;
          line-height: 1.1;
          color: #0a0a0a;
          border-left: 2px solid #0a0a0a;
          padding-left: 40px;
          margin-bottom: 24px;
        }

        .usage-guidance {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 200;
          color: #555;
          letter-spacing: 0.05em;
          padding-left: 42px;
          line-height: 1.6;
        }

        .usage-guidance strong {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.75rem;
          display: block;
          margin-bottom: 4px;
          color: #888;
        }

        .pillar-row:nth-child(even) {
          padding-left: 15%;
        }

        .pillar-row:nth-child(odd) .evidence-side {
          margin-top: 80px;
        }

        @media (max-width: 768px) {
          .evidence-container {
            padding: 80px 5%;
          }
          .pillar-row {
            margin-bottom: 100px;
            padding-left: 0 !important;
          }
          .claim-side {
            padding-right: 20px;
          }
          .claim-side h3 {
            font-size: 1.8rem;
          }
          .evidence-quote {
            font-size: 1.8rem;
            padding-left: 20px;
          }
          .usage-guidance {
            padding-left: 22px;
          }
          .big-num {
            font-size: 30vw;
            top: -20px;
          }
        }
      `}</style>

      <section className="evidence-container">
        <h1 className="hero-title">The Proof.</h1>

        {pillars.map((rawPillar, index) => {
          const pillar = normalizePillar(rawPillar);
          if (!pillar) return null;
          return (
            <div key={index} className="pillar-row">
              <span className="big-num">{(index + 1).toString().padStart(2, '0')}</span>
              <div className="claim-side">
                <p>{formatEvidenceType(pillar.evidenceType)}</p>
                <h3>{pillar.claim}</h3>
              </div>
              <div className="evidence-side">
                <div className="evidence-quote">
                  "{pillar.evidence}"
                </div>
                {pillar.usageGuidance && (
                  <div className="usage-guidance">
                    <strong>Usage Guidance</strong>
                    {pillar.usageGuidance}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
