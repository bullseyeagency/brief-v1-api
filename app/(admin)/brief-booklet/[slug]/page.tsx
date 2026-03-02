'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { CreativeBrief, Deliverables, BriefImages } from '@/lib/types';

interface PageProps {
  params: { slug: string };
}

interface BriefData {
  id: string;
  source_url: string;
  brief: CreativeBrief | null;
  deliverables: Deliverables | null;
  images: BriefImages | null;
  provider: string;
  model: string;
  created_at: string;
  generation_time_ms?: number;
  status: 'processing' | 'completed' | 'failed';
}

export default function BriefMagazinePage({ params }: PageProps) {
  const slug = params.slug;
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSheet, setCurrentSheet] = useState(0);

  useEffect(() => {
    if (!slug) return;

    async function fetchBrief() {
      try {
        const response = await fetch(`/api/brief/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('not-found');
          } else {
            throw new Error('Failed to load brief');
          }
          return;
        }

        const data = await response.json();
        setBriefData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading brief:', err);
        setError('Failed to load brief');
        setLoading(false);
      }
    }

    fetchBrief();
  }, [slug]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSheet < 4) {
        setCurrentSheet(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentSheet > 0) {
        setCurrentSheet(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSheet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error === 'not-found') {
    notFound();
  }

  if (error || !briefData?.brief) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const brief = briefData.brief;
  const images = briefData.images;
  const businessName = briefData.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

  // Build 5 sheets (10 pages)
  const sheets = images ? [
    { front: images.cover, back: images.pages.brandTruth },
    { front: images.pages.marketContext, back: images.pages.problem },
    { front: images.pages.transformation, back: images.pages.proofPillars },
    { front: images.pages.offer, back: images.pages.messaging },
    { front: images.pages.creativeDirection, back: images.backCover },
  ] : [];

  return (
    <>
      <style jsx global>{`
        :root {
          --page-width: min(90vw, 600px);
          --page-height: calc(var(--page-width) * 1.4);
        }

        /* 3D Book Mechanics */
        .comic-scene {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          perspective: 3500px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }

        .book {
          position: relative;
          width: var(--page-width);
          height: var(--page-height);
          transform-style: preserve-3d;
          transition: transform 0.5s ease;
        }

        .book.opened {
          transform: translateX(25%);
        }

        @media (min-width: 1000px) {
          .book.opened {
            transform: translateX(calc(var(--page-width) / 2));
          }
        }

        .paper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transform-origin: left center;
          transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .paper:nth-child(1) { z-index: 5; }
        .paper:nth-child(2) { z-index: 4; }
        .paper:nth-child(3) { z-index: 3; }
        .paper:nth-child(4) { z-index: 2; }
        .paper:nth-child(5) { z-index: 1; }

        .paper.flipped {
          z-index: 10 !important;
        }

        .paper.flipped {
          transform: rotateY(-180deg);
        }

        .front,
        .back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
          background: white;
          box-sizing: border-box;
        }

        .front {
          padding-left: 6px;
          box-shadow: inset 25px 0 40px -20px rgba(0, 0, 0, 0.6);
        }

        .back {
          transform: rotateY(180deg);
          padding-right: 6px;
          box-shadow: inset -25px 0 40px -20px rgba(0, 0, 0, 0.6);
        }

        /* Cover styling */
        .paper:first-child {
          box-shadow: 25px 25px 50px rgba(0, 0, 0, 0.8);
        }

        .paper:first-child .front {
          padding-left: 0;
          box-shadow: none;
        }

        /* Spine effect */
        .paper:first-child .front::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 14px;
          background: linear-gradient(to right, #0a0a0a, #333 20%, #666 30%, #333 50%, #0a0a0a 100%);
          border-right: 1px solid #000;
          z-index: 25;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
        }

        /* Fold crease */
        .paper:first-child .front::after {
          content: '';
          position: absolute;
          left: 14px;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(to right, rgba(0, 0, 0, 0.7), transparent);
          z-index: 25;
        }

        .page-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: white;
        }

        .paper:first-child .front .page-image {
          object-fit: cover !important;
          padding-left: 14px;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .comic-scene {
            perspective: 2000px;
            padding: 10px;
          }

          .book.opened {
            transform: translateX(100%);
          }
        }

        /* Page counter */
        .page-counter {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 14px;
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        /* Navigation hint */
        .nav-hint {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          z-index: 1000;
          text-align: center;
        }
      `}</style>

      <div className="min-h-screen bg-gray-900">
        {/* Back Navigation */}
        <div className="fixed top-4 left-4 z-50">
          <a
            href="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/30 hover:bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </a>
        </div>

        {/* Magazine Container */}
        <div className="comic-scene">
          <div className={`book ${currentSheet > 0 ? 'opened' : ''}`}>
            {sheets.map((sheet, i) => (
              <div
                key={i}
                className={`paper ${i < currentSheet ? 'flipped' : ''}`}
                onClick={() => {
                  if (i === currentSheet && currentSheet < 4) {
                    setCurrentSheet(currentSheet + 1);
                  } else if (i === currentSheet - 1) {
                    setCurrentSheet(currentSheet - 1);
                  }
                }}
              >
                {/* Front Page */}
                <div className="front">
                  {sheet.front ? (
                    <img src={sheet.front} alt={`Page ${i * 2 + 1}`} className="page-image" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-400">No image</p>
                    </div>
                  )}
                </div>

                {/* Back Page */}
                <div className="back">
                  {sheet.back ? (
                    <img src={sheet.back} alt={`Page ${i * 2 + 2}`} className="page-image" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-400">No image</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Page Counter */}
        <div className="page-counter">
          Page {currentSheet * 2 + (currentSheet > 0 ? 1 : 1)} of 10
        </div>

        {/* Navigation Hint */}
        <div className="nav-hint">
          Click pages to turn • Use arrow keys • {currentSheet === 0 ? 'Click to start →' : currentSheet === 4 ? '← Click to go back' : '← Click left or right →'}
        </div>

        {/* No Images Message */}
        {!images && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500/90 text-black px-6 py-4 rounded-lg z-50">
            <p className="font-semibold">This brief doesn't have magazine images yet.</p>
            <p className="text-sm mt-1">Generate a new brief with images enabled to see the magazine format.</p>
          </div>
        )}
      </div>
    </>
  );
}
