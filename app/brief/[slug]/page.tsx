'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Loader2, Target, Lightbulb, Shield, Award } from 'lucide-react';
import { CreativeBrief, Deliverables, BriefImages, FacebookCampaign } from '@/lib/types';
import { TextGradientScroll } from '@/components/21st/TextGradientScroll';
import { Typewriter } from '@/components/21st/Typewriter';
import { SectionHeader } from '@/components/SectionHeader';
import { BrandFoundationFlow } from '@/components/BrandFoundationFlow';
import { MarketContextTimeline } from '@/components/MarketContextTimeline';
import { CustomerAvatarsElegant } from '@/components/CustomerAvatarsElegant';
import { CallToActionElegant } from '@/components/CallToActionElegant';
import { ProofPillarsElegant } from '@/components/ProofPillarsElegant';
import { CreativeDirectionElegant } from '@/components/CreativeDirectionElegant';

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

export default function BriefPage({ params }: PageProps) {
  const slug = params.slug;
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);

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

  // Poll for status updates if processing
  useEffect(() => {
    if (!slug || !briefData || briefData.status !== 'processing') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/brief/${slug}/status`);
        if (response.ok) {
          const status = await response.json();
          setLastPolledAt(new Date());

          setBriefData((prev) => prev ? {
            ...prev,
            status: status.status,
            progress: status.progress,
            current_task: status.currentTask,
            logs: status.logs,
            error_message: status.errorMessage,
          } : null);

          // Stop polling if completed or failed
          if (status.status === 'completed' || status.status === 'failed') {
            // Reload full brief data
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
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [slug, briefData?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  if (error === 'not-found') {
    notFound();
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!briefData) {
    return null;
  }

  // Show processing UI
  if (briefData.status === 'processing') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 border border-gray-200">
            {/* Progress Header */}
            <div className="flex items-center gap-4 mb-6">
              <Loader2 className="w-8 h-8 text-black animate-spin" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-black">
                  {briefData.current_task || 'Processing...'}
                </h2>
                <p className="text-sm text-gray-600">Processing {briefData.source_url}</p>
              </div>
              <span className="text-2xl font-bold text-black">{briefData.progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-700 to-black transition-all duration-500 ease-out"
                  style={{ width: `${briefData.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Crawling</span>
                <span>Brief Generation</span>
                <span>Deliverables</span>
              </div>
            </div>

            {/* Task Log Window */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                <span className="text-sm font-medium text-gray-700">Task Log</span>
              </div>
              <div className="bg-black p-4 h-48 overflow-auto font-mono text-sm">
                {briefData.logs.map((log, i) => (
                  <div key={i} className="text-green-400">
                    {log}
                  </div>
                ))}
                {briefData.logs.length === 0 && (
                  <span className="text-gray-500">Starting...</span>
                )}
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                Est. remaining: ~{briefData.progress < 40 ? '60' : briefData.progress < 75 ? '30' : '10'}s
              </span>
              {lastPolledAt && (
                <span className="text-gray-400">
                  Last checked: {lastPolledAt.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show failed state
  if (briefData.status === 'failed') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Generation Failed</h1>
            <p className="text-gray-700 mb-4">{briefData.error_message || 'An error occurred while generating the brief.'}</p>
            <a href="/" className="text-black hover:underline font-medium">
              Try creating a new brief
            </a>
          </div>
        </div>
      </div>
    );
  }

  const brief = briefData.brief;

  if (!brief) {
    return null;
  }

  const domain = extractDomain(briefData.source_url);

  // Resolve facebook campaigns — only use array format; skip legacy string
  const facebookCampaigns: FacebookCampaign[] | null =
    Array.isArray(briefData.deliverables?.facebookCampaigns)
      ? (briefData.deliverables!.facebookCampaigns as FacebookCampaign[])
      : null;

  // Show completed brief
  return (
    <main className="min-h-screen bg-white">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-6">
        <span className="text-sm font-medium text-gray-700 flex-1">{domain}</span>
        <a
          href={`/api/brief/${slug}/pdf`}
          download
          className="bg-black text-white text-sm font-medium px-4 py-2 rounded hover:bg-gray-900 transition-colors"
        >
          Download PDF
        </a>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-14" />

      {/* Typewriter Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-white overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_50%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <div className="text-3xl md:text-5xl lg:text-6xl font-medium text-black leading-relaxed whitespace-pre-line">
            <Typewriter
              text={[
                "This is your creative brief. Built from your brand, your market, and how people actually decide.",
                "We studied your business, your audience, and your positioning. Read it as a map, not a pitch.",
                "Let's begin..."
              ]}
              speed={30}
              loop={false}
              className="inline"
              cursorClassName="text-blue-500"
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-black/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-black/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Website Summary Section */}
      {briefData.deliverables?.websiteSummary && (
        <section className="w-full bg-white py-32">
          <div className="container mx-auto max-w-4xl px-4">
            <SectionHeader
              title="Website Summary"
              subtitle="(High-level positioning snapshot)"
              description="This summary condenses the brand's positioning into a single narrative. It can be used as a reference for stakeholders or as alignment material before launching campaigns."
              align="center"
              className="mb-16"
            />
            <div className="space-y-12">
              {briefData.deliverables.websiteSummary
                .split(/\n\n+/)
                .map((paragraph, i) => (
                  <TextGradientScroll
                    key={i}
                    text={paragraph.trim()}
                    type="word"
                    textOpacity="soft"
                    className="text-lg md:text-2xl font-normal leading-relaxed text-black"
                  />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Foundation - Flowing Typography */}
      <section className="bg-[#fafafa] py-20">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <SectionHeader
            title="Brand Foundation"
            subtitle="(Core identity pillars)"
            description="The three fundamental truths that define what this brand stands for, what it promises, and what makes it uniquely different in the market."
          />
        </div>
        <BrandFoundationFlow
          brandTruth={brief.brandTruth}
          brandPromise={brief.brandPromise}
          uniqueTruth={brief.uniqueTruth}
        />
      </section>

      {/* Market Context - Timeline */}
      <MarketContextTimeline
        marketContext={brief.marketContext}
        competitiveLandscape={brief.competitiveLandscape}
        marketTension={brief.marketTension}
      />

      {/* Audience Avatars - Elegant Editorial */}
      {brief.avatars && brief.avatars.length > 0 && (
        <CustomerAvatarsElegant
          avatars={brief.avatars}
          businessName={domain}
          existingImages={briefData.images?.avatars}
          readOnly={true}
        />
      )}

      {/* Proof Pillars - Elegant Editorial */}
      {brief.proofPillars && brief.proofPillars.length > 0 && (
        <ProofPillarsElegant pillars={brief.proofPillars} />
      )}

      {/* Call to Action - Elegant Editorial */}
      <CallToActionElegant
        callToAction={brief.callToAction}
        offer={brief.offer}
        conversionPath={brief.conversionPath}
      />

      {/* Creative Direction - Elegant Editorial */}
      <CreativeDirectionElegant
        creativeDirections={brief.creativeDirections}
        visualStyle={brief.visualStyle}
        narrativeApproach={brief.narrativeApproach}
      />

      {/* Marketing Campaigns Section — real data from deliverables */}
      {facebookCampaigns && facebookCampaigns.length > 0 && (
        <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto mb-12">
            <SectionHeader
              title="Marketing Campaigns"
              subtitle="(Funnel-aligned activation strategy)"
              description="Campaign frameworks aligned to your brand positioning. Each campaign includes objective, target audience, primary message, and call to action."
              align="center"
            />
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facebookCampaigns.map((campaign, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900 leading-snug">
                    {campaign.campaignName}
                  </h3>
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                    {campaign.targetAvatar}
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                  {campaign.objective}
                </p>
                {campaign.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{campaign.description}</p>
                )}
                {campaign.primaryText && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-semibold">Primary Message</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{campaign.primaryText}</p>
                  </div>
                )}
                {campaign.headline && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-semibold">Headline</p>
                    <p className="text-sm font-medium text-gray-800">{campaign.headline}</p>
                  </div>
                )}
                {campaign.visualDirection && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-semibold">Visual Direction</p>
                    <p className="text-sm text-gray-600 italic leading-relaxed">{campaign.visualDirection}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 30-Second TV Commercial Section — script only, no video player */}
      {briefData.deliverables?.tvCommercial30s && (
        <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-black text-white">
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              title="30-Second Commercial"
              subtitle="(Broadcast-ready script)"
              description="A fully scripted commercial designed for TV, YouTube, or social media. Each scene is timed, sequenced, and aligned with the brand's transformation narrative."
              align="center"
              className="[&>*]:text-white [&>h2]:text-white [&>p]:text-gray-300"
            />

            {/* Script panel — full width */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-h-[600px] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Script
              </h3>
              <div className="space-y-6 text-sm">
                {(() => {
                  const commercial = briefData.deliverables!.tvCommercial30s;
                  if (typeof commercial === 'string') {
                    return (
                      <pre className="whitespace-pre-wrap leading-relaxed text-gray-300 font-sans">
                        {commercial}
                      </pre>
                    );
                  }
                  const script = commercial as Record<string, string>;
                  return (
                    <>
                      {script?.openingHook && (
                        <div>
                          <h4 className="font-bold text-blue-400 mb-2">Opening Hook (0-5s)</h4>
                          <p className="text-gray-300 leading-relaxed">{script.openingHook}</p>
                        </div>
                      )}
                      {script?.brandIntroduction && (
                        <div>
                          <h4 className="font-bold text-green-400 mb-2">Brand Introduction (5-8s)</h4>
                          <p className="text-gray-300 leading-relaxed">{script.brandIntroduction}</p>
                        </div>
                      )}
                      {script?.problemEstablishment && (
                        <div>
                          <h4 className="font-bold text-yellow-400 mb-2">Problem Establishment (8-12s)</h4>
                          <p className="text-gray-300 leading-relaxed">{script.problemEstablishment}</p>
                        </div>
                      )}
                      {script?.transformation && (
                        <div>
                          <h4 className="font-bold text-purple-400 mb-2">Transformation (12-20s)</h4>
                          <p className="text-gray-300 leading-relaxed">{script.transformation}</p>
                        </div>
                      )}
                      {script?.proofMoment && (
                        <div>
                          <h4 className="font-bold text-pink-400 mb-2">Proof Moment (20-25s)</h4>
                          <p className="text-gray-300 leading-relaxed">{script.proofMoment}</p>
                        </div>
                      )}
                      {script?.ctaAndResolution && (
                        <div>
                          <h4 className="font-bold text-red-400 mb-2">CTA & Resolution (25-30s)</h4>
                          <p className="text-gray-300 leading-relaxed">{script.ctaAndResolution}</p>
                        </div>
                      )}
                      {script?.visualDirections && (
                        <div className="pt-4 border-t border-white/10">
                          <h4 className="font-bold text-cyan-400 mb-2">Visual Directions</h4>
                          <p className="text-gray-300 leading-relaxed">{script.visualDirections}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 bg-black text-white border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            Generated {new Date(briefData.created_at).toLocaleDateString()}
          </p>
          <p className="text-gray-500 text-sm mt-2">Powered by Brief v1 API • {briefData.provider} • {briefData.model}</p>
        </div>
      </footer>
    </main>
  );
}
