'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Loader2, ArrowLeft, Target, Lightbulb, Shield, User, TrendingUp, Award, Zap } from 'lucide-react';
import { CreativeBrief, Deliverables } from '@/lib/types';
import { ContainerScroll } from '@/components/21st/ContainerScroll';
import DisplayCards from '@/components/21st/DisplayCards';
import AccordionFeature from '@/components/21st/AccordionFeature';
import { TestimonialSlider } from '@/components/21st/TestimonialSlider';
import { TestimonialCards } from '@/components/21st/TestimonialCards';
import RadialOrbitalTimeline from '@/components/21st/RadialOrbitalTimeline';
import { MagicText } from '@/components/21st/MagicText';
import { TextGradientScroll } from '@/components/21st/TextGradientScroll';
import { MarqueeAnimation } from '@/components/21st/MarqueeAnimation';
import VideoPlayer from '@/components/21st/VideoPlayer';
import { CtaSection } from '@/components/21st/CtaSection';
import { WavePath } from '@/components/21st/WavePath';
import { CreativeCampaigns } from '@/components/21st/CreativeCampaigns';
import { Typewriter } from '@/components/21st/Typewriter';
import { SectionHeader } from '@/components/SectionHeader';
import { BrandFoundationFlow } from '@/components/BrandFoundationFlow';
import { MarketContextTimeline } from '@/components/MarketContextTimeline';
import { CustomerAvatarsElegant } from '@/components/CustomerAvatarsElegant';
import { CallToActionElegant } from '@/components/CallToActionElegant';
import { ProofPillarsElegant } from '@/components/ProofPillarsElegant';
import { CreativeDirectionElegant } from '@/components/CreativeDirectionElegant';
import { DeliverablesElegant } from '@/components/DeliverablesElegant';

interface PageProps {
  params: { slug: string };
}

interface BriefData {
  id: string;
  source_url: string;
  brief: CreativeBrief | null;
  deliverables: Deliverables | null;
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

export default function BriefPage({ params }: PageProps) {
  const slug = params.slug;
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }, 10000); // Poll every 10 seconds

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
            <p className="text-center text-sm text-gray-600 mt-4">
              Estimated time remaining: ~
              {briefData.progress < 40 ? '60' : briefData.progress < 75 ? '30' : '10'} seconds
            </p>
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

  // Prepare data for 21st.dev components

  // Brand Foundation Cards
  const brandCards = [
    {
      title: "Brand Truth",
      description: brief.brandTruth,
      icon: <Target className="size-4 text-blue-300" />,
      titleClassName: "text-blue-500",
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      title: "Brand Promise",
      description: brief.brandPromise,
      icon: <Shield className="size-4 text-green-300" />,
      titleClassName: "text-green-500",
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      title: "Unique Truth",
      description: brief.uniqueTruth,
      icon: <Lightbulb className="size-4 text-purple-300" />,
      titleClassName: "text-purple-500",
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  // Market Context Accordion Features
  const marketFeatures = [
    {
      id: 1,
      title: "Market Landscape",
      description: brief.marketContext,
    },
    {
      id: 2,
      title: "Competitive Landscape",
      description: brief.competitiveLandscape,
    },
    {
      id: 3,
      title: "Market Tension",
      description: brief.marketTension,
    },
  ];

  // Avatars for Testimonial Slider
  const avatarReviews = brief.avatars?.map((avatar, i) => ({
    id: i,
    name: avatar.name,
    affiliation: `${avatar.type === 'primary' ? 'Primary Hero' : avatar.type === 'secondary' ? 'Secondary Mirror' : 'Tertiary Aspirational'} • Age ${avatar.age}`,
    quote: avatar.desire,
    imageSrc: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.name}`,
    thumbnailSrc: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.name}`,
  })) || [];

  // Proof Pillars for Radial Timeline
  const proofTimeline = brief.proofPillars?.map((pillar, i) => ({
    id: i + 1,
    title: pillar.claim,
    content: pillar.evidence,
    icon: Award,
    relatedIds: [],
    status: 'completed' as const,
    energy: 85,
  })) || [];

  // Show completed brief with 21st.dev components
  return (
    <main className="min-h-screen bg-white">
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

      {/* Back Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <a
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </a>
      </div>


      {/* Website Summary Section - Text Gradient Scroll */}
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
            <TextGradientScroll
              text={briefData.deliverables.websiteSummary}
              type="word"
              textOpacity="soft"
              className="text-lg md:text-2xl font-normal leading-relaxed text-black"
            />
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
          businessName={briefData.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
        />
      )}

      {/* Proof Pillars - Elegant Editorial */}
      {brief.proofPillars && brief.proofPillars.length > 0 && (
        <ProofPillarsElegant pillars={brief.proofPillars} />
      )}

      {/* Call to Action - Elegant Editorial */}
      {/* <CallToActionElegant
        callToAction={brief.callToAction}
        offer={brief.offer}
        conversionPath={brief.conversionPath}
      /> */}

      {/* Creative Direction - Elegant Editorial */}
      {/* <CreativeDirectionElegant
        creativeDirections={brief.creativeDirections}
        visualStyle={brief.visualStyle}
        narrativeApproach={brief.narrativeApproach}
      /> */}

      {/* Marketing Campaigns Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto mb-12">
          <SectionHeader
            title="Marketing Campaigns"
            subtitle="(Funnel-aligned activation strategy)"
            description="Three campaign frameworks aligned to awareness, consideration, and conversion stages. Each stage includes objective, description, and tactical recommendations."
            align="center"
          />
        </div>
        <CreativeCampaigns
          campaigns={[
            {
              name: "Awareness",
              icon: <Target className="w-6 h-6 text-white" />,
              objective: "Brand Discovery",
              description: "Reach new audiences and establish brand presence in the market.",
              tactics: [
                "Video storytelling campaigns featuring real customers",
                "Influencer partnerships and UGC content",
                "Social media brand awareness ads",
                "SEO-optimized content marketing",
              ],
              popular: false,
              color: "from-blue-500 to-blue-600",
            },
            {
              name: "Consideration",
              icon: <Zap className="w-6 h-6 text-white" />,
              objective: "Build Trust & Engagement",
              description: "Convert interest into active consideration through proof and value demonstration.",
              tactics: [
                "Product demo videos and tutorials",
                "Customer testimonial campaigns",
                "Retargeting with social proof",
                "Email nurture sequences",
              ],
              popular: true,
              color: "from-amber-500 to-amber-600",
            },
            {
              name: "Conversion",
              icon: <TrendingUp className="w-6 h-6 text-white" />,
              objective: "Drive Sales",
              description: "Convert qualified leads into customers with compelling offers and clear CTAs.",
              tactics: [
                "Limited-time promotional campaigns",
                "Abandoned cart recovery emails",
                "Direct response ads with offers",
                "Landing page optimization tests",
              ],
              popular: false,
              color: "from-green-500 to-green-600",
            },
          ]}
        />
      </section>

      {/* 30-Second TV Commercial Section */}
      {briefData.deliverables?.tvCommercial30s && (
        <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-black text-white">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              title="30-Second Commercial"
              subtitle="(Broadcast-ready script & execution)"
              description="A fully scripted commercial designed for TV, YouTube, or social media. Each scene is timed, sequenced, and aligned with the brand's transformation narrative."
              align="center"
              className="[&>*]:text-white [&>h2]:text-white [&>p]:text-gray-300"
            />

            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Video Player */}
              <div>
                <VideoPlayer
                  src="/api/video-proxy?url=https://generativelanguage.googleapis.com/v1beta/files/72aysbwx5qrr:download?alt=media"
                  poster="https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&h=450&fit=crop"
                />
                <p className="text-sm text-gray-500 mt-4 text-center italic">
                  * Generated using Veo 3.1 AI
                </p>
              </div>

              {/* Script */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-h-[600px] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Script
                </h3>
                <div className="space-y-6 text-sm">
                  {typeof briefData.deliverables.tvCommercial30s === 'string' ? (
                    <pre className="whitespace-pre-wrap leading-relaxed text-gray-300 font-sans">
                      {briefData.deliverables.tvCommercial30s}
                    </pre>
                  ) : (
                    <>
                      {briefData.deliverables.tvCommercial30s.openingHook && (
                        <div>
                          <h4 className="font-bold text-blue-400 mb-2">Opening Hook (0-5s)</h4>
                          <p className="text-gray-300 leading-relaxed">{briefData.deliverables.tvCommercial30s.openingHook}</p>
                        </div>
                      )}
                      {briefData.deliverables.tvCommercial30s.brandIntroduction && (
                        <div>
                          <h4 className="font-bold text-green-400 mb-2">Brand Introduction (5-8s)</h4>
                          <p className="text-gray-300 leading-relaxed">{briefData.deliverables.tvCommercial30s.brandIntroduction}</p>
                        </div>
                      )}
                      {briefData.deliverables.tvCommercial30s.problemEstablishment && (
                        <div>
                          <h4 className="font-bold text-yellow-400 mb-2">Problem Establishment (8-12s)</h4>
                          <p className="text-gray-300 leading-relaxed">{briefData.deliverables.tvCommercial30s.problemEstablishment}</p>
                        </div>
                      )}
                      {briefData.deliverables.tvCommercial30s.transformation && (
                        <div>
                          <h4 className="font-bold text-purple-400 mb-2">Transformation (12-20s)</h4>
                          <p className="text-gray-300 leading-relaxed">{briefData.deliverables.tvCommercial30s.transformation}</p>
                        </div>
                      )}
                      {briefData.deliverables.tvCommercial30s.proofMoment && (
                        <div>
                          <h4 className="font-bold text-pink-400 mb-2">Proof Moment (20-25s)</h4>
                          <p className="text-gray-300 leading-relaxed">{briefData.deliverables.tvCommercial30s.proofMoment}</p>
                        </div>
                      )}
                      {briefData.deliverables.tvCommercial30s.ctaAndResolution && (
                        <div>
                          <h4 className="font-bold text-red-400 mb-2">CTA & Resolution (25-30s)</h4>
                          <p className="text-gray-300 leading-relaxed">{briefData.deliverables.tvCommercial30s.ctaAndResolution}</p>
                        </div>
                      )}
                      {briefData.deliverables.tvCommercial30s.visualDirections && (
                        <div className="pt-4 border-t border-white/10">
                          <h4 className="font-bold text-cyan-400 mb-2">Visual Directions</h4>
                          <p className="text-gray-300 leading-relaxed">{briefData.deliverables.tvCommercial30s.visualDirections}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Deliverables - Elegant Editorial */}
      {briefData.deliverables && (
        <DeliverablesElegant
          headlines={briefData.deliverables.headlines}
          hooks={briefData.deliverables.hooks}
          adScripts={briefData.deliverables.adScripts}
        />
      )}

      {/* Footer */}
      <footer className="py-12 px-6 bg-black text-white border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            Generated {new Date(briefData.created_at).toLocaleDateString()}
            {briefData.generation_time_ms && ` • ${(briefData.generation_time_ms / 1000).toFixed(1)}s`}
          </p>
          <p className="text-gray-500 text-sm mt-2">Powered by Brief v1 API • {briefData.provider} • {briefData.model}</p>
        </div>
      </footer>
    </main>
  );
}
