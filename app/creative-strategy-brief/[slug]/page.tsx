'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Loader2, Phone, Share2, RefreshCw } from 'lucide-react';
import { CreativeBrief, Deliverables, BriefImages } from '@/lib/types';
import { TextGradientScroll } from '@/components/21st/TextGradientScroll';
import { Typewriter } from '@/components/21st/Typewriter';
import { SectionHeader } from '@/components/SectionHeader';
import ElegantCarousel from '@/components/ui/elegant-carousel';
import type { SlideData } from '@/components/ui/elegant-carousel';
import { FeatureSteps, Feature } from '@/components/ui/feature-section';
import { FbAdPreview } from '@/components/ui/fb-ad-preview';
import { Storyboard } from '@/components/ui/storyboard';

interface PageProps {
  params: { slug: string };
}

/**
 * Splits a block of text into readable paragraphs.
 * Tries double-newlines first; if the text has none, splits by sentence
 * and groups every 2 sentences into a paragraph.
 */
function splitIntoParagraphs(text: string): string[] {
  // Try existing paragraph breaks first
  const byNewlines = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (byNewlines.length > 1) return byNewlines;

  // Fall back: split into sentences and group 2 per paragraph
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(' '));
  }
  return paragraphs.length > 0 ? paragraphs : [text];
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
  progress: number;
  current_task?: string;
  logs: string[];
  error_message?: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

const AVATAR_ACCENTS = ['#C4956A', '#8BA7B8', '#7A9E7E'];
const FB_AD_ACCENTS = ['#1877F2', '#E91E8C', '#FF6B35'];

export default function CreativeStrategyBriefPage({ params }: PageProps) {
  const slug = params.slug;
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [lastProgressAt, setLastProgressAt] = useState<number>(Date.now());
  const [isStuck, setIsStuck] = useState(false);
  const [editorialSummary, setEditorialSummary] = useState<string | null>(null);
  const [editorialLoading, setEditorialLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch initial brief data
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

  // Poll for status updates while processing
  useEffect(() => {
    if (!slug || !briefData || briefData.status !== 'processing') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/brief/${slug}/status`);
        if (response.ok) {
          const status = await response.json();
          setLastPolledAt(new Date());

          setBriefData((prev) => {
            if (!prev) return null;

            // Track whether progress changed to detect stuck state
            if (status.progress !== prev.progress) {
              setLastProgressAt(Date.now());
              setIsStuck(false);
            } else if (Date.now() - lastProgressAt > 3 * 60 * 1000) {
              setIsStuck(true);
            }

            return {
              ...prev,
              status: status.status,
              progress: status.progress,
              current_task: status.currentTask,
              logs: status.logs,
              error_message: status.errorMessage,
            };
          });

          if (status.status === 'completed' || status.status === 'failed') {
            const fullResponse = await fetch(`/api/brief/${slug}`);
            if (fullResponse.ok) {
              const fullData = await fullResponse.json();
              setBriefData(fullData);
            }
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [slug, briefData?.status, lastProgressAt]);

  // Fetch editorial rewrite of websiteSummary once brief is completed
  useEffect(() => {
    if (!briefData?.deliverables?.websiteSummary || briefData.status !== 'completed') return;

    setEditorialLoading(true);
    fetch('/api/editorial-rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: briefData.deliverables.websiteSummary,
        context: briefData.source_url,
      }),
    })
      .then((r) => r.json())
      .then((data) => setEditorialSummary(data.rewritten || briefData.deliverables!.websiteSummary))
      .catch(() => setEditorialSummary(briefData.deliverables!.websiteSummary))
      .finally(() => setEditorialLoading(false));
  }, [briefData?.status]);

  // Initial loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error === 'not-found') {
    notFound();
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!briefData) {
    return null;
  }

  // Processing state
  if (briefData.status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          {isStuck ? (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 min-w-0">
                <div className="text-center">
                  <p className="text-white font-medium mb-2">Taking longer than expected</p>
                  <p className="text-gray-500 text-sm mb-6">The generation may have stalled. You can try again.</p>
                  <a href="/" className="text-white border border-white/20 rounded-lg px-5 py-2.5 text-sm hover:bg-white/5 transition-colors">
                    Start over
                  </a>
                </div>
              </div>
              <span className="text-2xl font-bold text-white tabular-nums">
                {briefData.progress}%
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-8">
              <Loader2 className="w-7 h-7 text-white animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {briefData.current_task || 'Processing...'}
                </p>
                <p className="text-gray-500 text-sm truncate">{briefData.source_url}</p>
              </div>
              <span className="text-2xl font-bold text-white tabular-nums">
                {briefData.progress}%
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white transition-all duration-500 ease-out rounded-full"
              style={{ width: `${briefData.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-10">
            <span>Crawling</span>
            <span>Brief Generation</span>
            <span>Deliverables</span>
          </div>

          {/* Task log */}
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                Task Log
              </span>
            </div>
            <div className="p-4 h-40 overflow-auto font-mono text-sm">
              {briefData.logs.length === 0 ? (
                <span className="text-gray-600">Starting...</span>
              ) : (
                briefData.logs.map((log, i) => (
                  <div key={i} className="text-green-400">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer meta */}
          <div className="flex justify-between mt-4 text-xs text-gray-600">
            <span>
              Est. remaining: ~
              {briefData.progress < 40 ? '60' : briefData.progress < 75 ? '30' : '10'}s
            </span>
            {lastPolledAt && (
              <span>
                Last checked:{' '}
                {lastPolledAt.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (briefData.status === 'failed') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-red-950/30 border border-red-900/50 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Generation Failed</h1>
          <p className="text-gray-400 mb-6">
            {briefData.error_message || 'An error occurred while generating the brief.'}
          </p>
          <a href="/" className="text-white hover:underline font-medium text-sm">
            Try creating a new brief
          </a>
        </div>
      </div>
    );
  }

  const brief = briefData.brief;

  if (!brief) {
    return null;
  }

  const domain = extractDomain(briefData.source_url);

  // Build carousel slides from avatars
  const avatarSlides: SlideData[] =
    brief.avatars?.map((avatar, i) => {
      const typeLabel =
        avatar.type === 'primary'
          ? 'Primary Hero'
          : avatar.type === 'secondary'
          ? 'Secondary Mirror'
          : 'Tertiary Aspirational';

      return {
        title: avatar.name,
        subtitle: `${typeLabel} \u2022 Age ${avatar.age}`,
        description: `${avatar.desire}. ${avatar.transformation}`,
        accent: AVATAR_ACCENTS[i % AVATAR_ACCENTS.length],
        imageUrl:
          briefData.images?.avatars?.[i] ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatar.name)}`,
      };
    }) ?? [];

  // Build FeatureSteps data from brief sections
  const SECTION_FALLBACKS = {
    marketContext: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&h=500&fit=crop',
    problem: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&h=500&fit=crop',
    transformation: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&h=500&fit=crop',
    offer: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1000&h=500&fit=crop',
    nextSteps: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&h=500&fit=crop',
  };

  const briefFeatures: Feature[] = [
    {
      step: 'Market Context',
      title: 'The Market You\'re In',
      content: brief.marketContext,
      image: briefData.images?.pages?.marketContext || SECTION_FALLBACKS.marketContext,
    },
    {
      step: 'The Problem',
      title: 'What Customers Are Struggling With',
      content: `${brief.humanProblem} ${brief.emotionalTension}`.trim(),
      image: briefData.images?.pages?.problem || SECTION_FALLBACKS.problem,
    },
    {
      step: 'Transformation',
      title: 'The Shift You Make Possible',
      content: brief.transformation,
      image: briefData.images?.pages?.transformation || SECTION_FALLBACKS.transformation,
    },
    {
      step: 'The Offer',
      title: 'What You\'re Putting Forward',
      content: brief.offer,
      image: briefData.images?.pages?.offer || SECTION_FALLBACKS.offer,
    },
    {
      step: 'Next Steps',
      title: 'How to Take Action',
      content: `${brief.conversionPath} ${brief.callToAction}`.trim(),
      image: briefData.images?.backCover || SECTION_FALLBACKS.nextSteps,
    },
  ];

  // Build Facebook campaign cards data
  const facebookCampaigns = Array.isArray(briefData.deliverables?.facebookCampaigns)
    ? briefData.deliverables!.facebookCampaigns
    : [];

  // Build storyboard frames data
  const storyboardFrames = briefData.deliverables?.video8s
    ? [
        {
          label: 'Scene 1',
          sectionName: 'Recognition',
          duration: briefData.deliverables.video8s.recognition.duration,
          purpose: briefData.deliverables.video8s.recognition.purpose,
          voiceoverOrText: briefData.deliverables.video8s.recognition.voiceoverOrText,
          imageUrl: briefData.images?.storyboardFrames?.[0] || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1280&h=720&fit=crop',
        },
        {
          label: 'Scene 2',
          sectionName: 'Proof in Context',
          duration: briefData.deliverables.video8s.proofInContext.duration,
          purpose: briefData.deliverables.video8s.proofInContext.purpose,
          voiceoverOrText: briefData.deliverables.video8s.proofInContext.voiceoverOrText,
          imageUrl: briefData.images?.storyboardFrames?.[1] || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1280&h=720&fit=crop',
        },
        {
          label: 'Scene 3',
          sectionName: 'Belief Lock',
          duration: briefData.deliverables.video8s.beliefLock.duration,
          purpose: briefData.deliverables.video8s.beliefLock.purpose,
          voiceoverOrText: briefData.deliverables.video8s.beliefLock.voiceoverOrText,
          imageUrl: briefData.images?.storyboardFrames?.[2] || 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=1280&h=720&fit=crop',
        },
      ]
    : [];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* ── Section 1: Hero ───────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.04),transparent_60%)]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Domain label */}
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/30 mb-10">
            {domain}
          </p>

          {/* Typewriter */}
          <div className="text-3xl md:text-5xl lg:text-6xl font-light text-white leading-relaxed">
            <Typewriter
              text={[
                'This is your creative strategy brief.',
                'Built from your brand, your market, and your audience.',
                'Read it as a map.',
              ]}
              speed={30}
              loop={false}
              className="inline"
              cursorClassName="text-white/40"
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border border-white/20 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/30 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Section 2: Website Summary ───────────────────────── */}
      {briefData.deliverables?.websiteSummary && (
        <section className="w-full bg-white py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <SectionHeader
              title="Website Summary"
              subtitle="(Positioning snapshot)"
              align="center"
              className="mb-16"
            />
            <div className="space-y-10">
              {editorialLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 bg-gray-100 rounded w-full" />
                  <div className="h-6 bg-gray-100 rounded w-5/6" />
                  <div className="h-6 bg-gray-100 rounded w-4/6" />
                </div>
              ) : (
                splitIntoParagraphs(editorialSummary ?? briefData.deliverables.websiteSummary).map(
                  (paragraph, i) => (
                    <TextGradientScroll
                      key={i}
                      text={paragraph}
                      type="word"
                      textOpacity="soft"
                      className="text-xl md:text-2xl font-normal leading-relaxed text-black"
                    />
                  )
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 3: Avatar Carousel ───────────────────────── */}
      {avatarSlides.length > 0 && (
        <ElegantCarousel slides={avatarSlides} />
      )}

      {/* ── Section 4: Brand Journey ─────────────────────────── */}
      <FeatureSteps
        features={briefFeatures}
        title="The Story Behind the Brief"
      />

      {/* ── Section 5: Facebook Campaigns ────────────────────── */}
      {facebookCampaigns.length > 0 && (
        <section className="w-full bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 mb-3">Deliverable</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black">Facebook Campaigns</h2>
              <p className="text-gray-500 mt-3 text-lg">One campaign per audience segment</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
              {facebookCampaigns.slice(0, 3).map((campaign, i) => (
                <FbAdPreview
                  key={i}
                  pageName={domain}
                  primaryText={campaign.primaryText}
                  headline={campaign.headline}
                  description={campaign.description}
                  ctaLabel={brief.callToAction?.split(' ').slice(0, 3).join(' ') || 'Learn More'}
                  imageUrl={briefData.images?.facebookImages?.[i] || briefData.images?.avatars?.[i] || `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&h=600&fit=crop`}
                  targetLabel={campaign.targetAvatar}
                  accentColor={FB_AD_ACCENTS[i]}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 6: TV/YouTube Commercial ─────────────────── */}
      {storyboardFrames.length > 0 && (
        <Storyboard frames={storyboardFrames} />
      )}

      {/* ── Section 7: CTA ────────────────────────────────────── */}
      <section className="w-full bg-[#0a0a0a] py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/20 mb-10">
            Bullseye Agency
          </p>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-white leading-tight">
            This is what we see from the outside.
            <br />
            The real work starts when we get inside.
          </h2>

          {/* Subline */}
          <p className="text-gray-500 text-lg mt-6 max-w-xl mx-auto">
            One crawl. No conversation. This is what we built.
            <br />
            Imagine what we&apos;d create if we actually worked together.
          </p>

          {/* Three action cards */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch max-w-2xl mx-auto mt-16">
            {/* Option 1: Book a strategy call */}
            <a
              href="mailto:hello@bullseyeagency.com?subject=Strategy Call Request&body=I reviewed my creative brief and would like to book a call."
              className="flex-1 min-w-[180px] border border-white/20 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer no-underline"
            >
              <Phone className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-sm">Book a Strategy Call</span>
              <span className="text-gray-500 text-xs">30 min — no pitch, just strategy</span>
            </a>

            {/* Option 2: Share with team */}
            <button
              onClick={handleCopyLink}
              className="flex-1 min-w-[180px] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer bg-transparent"
            >
              <Share2 className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-sm">
                {copied ? 'Copied!' : 'Share with My Team'}
              </span>
              <span className="text-gray-500 text-xs">Copy the link to this brief</span>
            </button>

            {/* Option 3: Request revisions */}
            <a
              href="mailto:hello@bullseyeagency.com?subject=Brief Revision Request&body=I reviewed my creative brief and have some feedback..."
              className="flex-1 min-w-[180px] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer no-underline"
            >
              <RefreshCw className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-sm">Request Revisions</span>
              <span className="text-gray-500 text-xs">Tell us what to adjust</span>
            </a>
          </div>

          {/* Bottom line */}
          <div className="mt-16">
            <div className="w-px h-8 bg-white/10 mx-auto" />
            <p className="text-xs text-gray-600 text-center mt-4">
              &copy; Bullseye Agency &middot; briefs.dalyandco.com
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
