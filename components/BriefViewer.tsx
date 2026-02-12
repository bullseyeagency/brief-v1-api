'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Shield, Target, Lightbulb, Heart, MessageSquare, Palette, FlaskConical, Image as ImageIcon } from 'lucide-react';
import { CreativeBrief, Avatar, ProofPillar } from '@/lib/types';

interface BriefViewerProps {
  brief: CreativeBrief;
  businessName?: string;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>
      {open && <div className="p-6 bg-white">{children}</div>}
    </div>
  );
}

function AvatarCard({
  avatar,
  index,
  businessName,
  generatedImage,
  isLoading,
  onGenerateImage
}: {
  avatar: Avatar;
  index: number;
  businessName: string;
  generatedImage?: string;
  isLoading: boolean;
  onGenerateImage: () => void;
}) {
  const typeLabels = {
    primary: 'Primary Hero Avatar',
    secondary: 'Secondary Mirror Avatar',
    tertiary: 'Tertiary Aspirational Avatar',
  };

  const typeColors = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
    tertiary: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      {/* Image Display */}
      <div className="mb-4">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="text-xs text-gray-600">Generating...</span>
              </div>
            </div>
          ) : generatedImage ? (
            <img src={generatedImage} alt={avatar.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>
        <button
          onClick={onGenerateImage}
          disabled={isLoading}
          className="w-full text-xs text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-1"
        >
          {generatedImage ? 'Regenerate Image' : 'Generate Image'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-xs font-medium px-2 py-1 rounded ${typeColors[avatar.type]}`}>
            {typeLabels[avatar.type]}
          </span>
          <h4 className="text-lg font-semibold text-gray-900 mt-2">{avatar.name}, {avatar.age}</h4>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">Background:</span>
          <p className="text-gray-600">{avatar.background}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Current State:</span>
          <p className="text-gray-600">{avatar.currentState}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Desire:</span>
          <p className="text-gray-600">{avatar.desire}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Conflict:</span>
          <p className="text-gray-600">{avatar.conflict}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Transformation:</span>
          <p className="text-gray-600">{avatar.transformation}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Moral Arc:</span>
          <p className="text-gray-600">{avatar.moralArc}</p>
        </div>

        {avatar.featureBenefits && avatar.featureBenefits.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <span className="font-medium text-gray-700">Feature &gt; Benefit &gt; WIIFM:</span>
            <ul className="mt-2 space-y-2">
              {avatar.featureBenefits.map((fb, i) => (
                <li key={i} className="text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-medium">{fb.feature}</span> → {fb.benefit} → <em>{fb.wiifm}</em>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100">
          <span className="font-medium text-gray-700">Cinematic Image Prompt:</span>
          <p className="text-gray-600 italic bg-gray-50 p-2 rounded mt-1">{avatar.cinematicImagePrompt}</p>
        </div>
      </div>
    </div>
  );
}

function SectionImageDisplay({
  sectionName,
  generatedImage,
  isLoading,
  onGenerateImage
}: {
  sectionName: string;
  generatedImage?: string;
  isLoading: boolean;
  onGenerateImage: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="relative aspect-square max-w-md mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-700 font-medium">Generating {sectionName} image...</span>
            </div>
          </div>
        ) : generatedImage ? (
          <img
            src={generatedImage}
            alt={sectionName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mb-3" />
            <span className="text-sm text-gray-400">No image generated yet</span>
          </div>
        )}
      </div>
      <div className="text-center mt-3">
        <button
          onClick={onGenerateImage}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          <ImageIcon className="w-4 h-4" />
          {generatedImage ? 'Regenerate Image' : 'Generate Image'}
        </button>
      </div>
    </div>
  );
}

function ProofPillarCard({ pillar, index }: { pillar: ProofPillar; index: number }) {
  const evidenceTypeColors: Record<string, string> = {
    'testimonial': 'bg-green-100 text-green-800',
    'statistic': 'bg-blue-100 text-blue-800',
    'case-study': 'bg-purple-100 text-purple-800',
    'certification': 'bg-amber-100 text-amber-800',
    'demonstration': 'bg-pink-100 text-pink-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
          {index + 1}
        </span>
        <span className={`text-xs font-medium px-2 py-1 rounded ${evidenceTypeColors[pillar.evidenceType] || 'bg-gray-100 text-gray-800'}`}>
          {pillar.evidenceType}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Claim:</span>
          <p className="text-gray-900">{pillar.claim}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Evidence:</span>
          <p className="text-gray-600 bg-gray-50 p-2 rounded">{pillar.evidence}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Usage Guidance:</span>
          <p className="text-gray-600 italic">{pillar.usageGuidance}</p>
        </div>
      </div>
    </div>
  );
}

export default function BriefViewer({ brief, businessName = 'Business' }: BriefViewerProps) {
  // State for avatar images
  const [avatarImages, setAvatarImages] = useState<Record<number, string>>({});
  const [avatarLoading, setAvatarLoading] = useState<Record<number, boolean>>({});

  // State for section images
  const [sectionImages, setSectionImages] = useState<Record<string, string>>({});
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});

  // Get image model from settings
  const getImageModel = () => {
    try {
      const savedSettings = localStorage.getItem('creative_brief_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.imageModel?.model || 'gemini-3-pro-image-preview';
      }
    } catch (error) {
      console.error('Error reading settings:', error);
    }
    return 'gemini-3-pro-image-preview';
  };

  // Generate avatar image
  const handleGenerateAvatarImage = async (avatar: Avatar, index: number) => {
    try {
      setAvatarLoading(prev => ({ ...prev, [index]: true }));

      const model = getImageModel();
      console.log('[BriefViewer] Using image model:', model);

      const response = await fetch('/api/generate-avatar-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar, businessName, model }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      const data = await response.json();
      setAvatarImages(prev => ({ ...prev, [index]: data.imageUrl }));
    } catch (error) {
      console.error('Error generating avatar image:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setAvatarLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  // Generate section image
  const handleGenerateSectionImage = async (sectionType: string) => {
    try {
      setSectionLoading(prev => ({ ...prev, [sectionType]: true }));

      const model = getImageModel();
      console.log('[BriefViewer] Using image model:', model);

      const response = await fetch('/api/generate-section-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType, brief, model }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      const data = await response.json();
      setSectionImages(prev => ({ ...prev, [sectionType]: data.imageUrl }));
    } catch (error) {
      console.error('Error generating section image:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Brand Truth */}
      <Section title="Brand Truth & Promise" icon={<Target className="w-5 h-5 text-primary" />} defaultOpen>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <SectionImageDisplay
            sectionName="Brand Truth"
            generatedImage={sectionImages.brandTruth}
            isLoading={sectionLoading.brandTruth || false}
            onGenerateImage={() => handleGenerateSectionImage('brandTruth')}
          />
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Brand Truth</h4>
              <p className="text-gray-900">{brief.brandTruth}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Brand Promise</h4>
              <p className="text-gray-900">{brief.brandPromise}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Unique Truth</h4>
              <p className="text-gray-900">{brief.uniqueTruth}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Market Context */}
      <Section title="Market Context" icon={<Lightbulb className="w-5 h-5 text-primary" />}>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <SectionImageDisplay
            sectionName="Market Context"
            generatedImage={sectionImages.marketContext}
            isLoading={sectionLoading.marketContext || false}
            onGenerateImage={() => handleGenerateSectionImage('marketContext')}
          />
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Market Context</h4>
              <p className="text-gray-900">{brief.marketContext}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Competitive Landscape</h4>
              <p className="text-gray-900">{brief.competitiveLandscape}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Market Tension</h4>
              <p className="text-gray-900">{brief.marketTension}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Avatars */}
      <Section title="Avatars (3)" icon={<User className="w-5 h-5 text-primary" />} defaultOpen>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {brief.avatars.map((avatar, i) => (
            <AvatarCard
              key={i}
              avatar={avatar}
              index={i}
              businessName={businessName}
              generatedImage={avatarImages[i]}
              isLoading={avatarLoading[i] || false}
              onGenerateImage={() => handleGenerateAvatarImage(avatar, i)}
            />
          ))}
        </div>
      </Section>

      {/* Problem & Tension */}
      <Section title="Problem & Tension" icon={<Heart className="w-5 h-5 text-primary" />}>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <SectionImageDisplay
            sectionName="Problem"
            generatedImage={sectionImages.problem}
            isLoading={sectionLoading.problem || false}
            onGenerateImage={() => handleGenerateSectionImage('problem')}
          />
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Human Problem</h4>
              <p className="text-gray-900">{brief.humanProblem}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Emotional Tension</h4>
              <p className="text-gray-900">{brief.emotionalTension}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Transformation */}
      <Section title="Transformation" icon={<Lightbulb className="w-5 h-5 text-primary" />}>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <SectionImageDisplay
              sectionName="Transformation"
              generatedImage={sectionImages.transformation}
              isLoading={sectionLoading.transformation || false}
              onGenerateImage={() => handleGenerateSectionImage('transformation')}
            />
            <div>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">Before State</h4>
                  <p className="text-red-900 text-sm">{brief.beforeState}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">After State</h4>
                  <p className="text-green-900 text-sm">{brief.afterState}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Transformation Journey</h4>
            <p className="text-blue-900">{brief.transformation}</p>
          </div>
        </div>
      </Section>

      {/* Proof Pillars */}
      <Section title="Proof Pillars (5)" icon={<Shield className="w-5 h-5 text-primary" />} defaultOpen>
        <div className="space-y-6">
          <SectionImageDisplay
            sectionName="Proof Pillars"
            generatedImage={sectionImages.proofPillars}
            isLoading={sectionLoading.proofPillars || false}
            onGenerateImage={() => handleGenerateSectionImage('proofPillars')}
          />
          <div className="space-y-4">
            {brief.proofPillars.map((pillar, i) => (
              <ProofPillarCard key={i} pillar={pillar} index={i} />
            ))}
          </div>
        </div>
      </Section>

      {/* Offer & Conversion */}
      <Section title="Offer & Conversion Path" icon={<Target className="w-5 h-5 text-primary" />}>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Offer</h4>
            <p className="text-gray-900">{brief.offer}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Conversion Path</h4>
            <p className="text-gray-900">{brief.conversionPath}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Call to Action</h4>
            <p className="text-gray-900 font-semibold text-lg">{brief.callToAction}</p>
          </div>
        </div>
      </Section>

      {/* Messaging Rules */}
      <Section title="Messaging Rules" icon={<MessageSquare className="w-5 h-5 text-primary" />}>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Messaging Rules</h4>
            <ul className="list-disc list-inside space-y-1">
              {brief.messagingRules.map((rule, i) => (
                <li key={i} className="text-gray-600">{rule}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Tone Guidelines</h4>
            <ul className="list-disc list-inside space-y-1">
              {brief.toneGuidelines.map((tone, i) => (
                <li key={i} className="text-gray-600">{tone}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Forbidden Phrases</h4>
            <div className="flex flex-wrap gap-2">
              {brief.forbiddenPhrases.map((phrase, i) => (
                <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">{phrase}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Creative Directions */}
      <Section title="Creative Directions" icon={<Palette className="w-5 h-5 text-primary" />}>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Creative Directions</h4>
            <p className="text-gray-900">{brief.creativeDirections}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Visual Style</h4>
            <p className="text-gray-900">{brief.visualStyle}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Narrative Approach</h4>
            <p className="text-gray-900">{brief.narrativeApproach}</p>
          </div>
        </div>
      </Section>

      {/* Testing Plan */}
      <Section title="Testing Plan" icon={<FlaskConical className="w-5 h-5 text-primary" />}>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Testing Plan</h4>
            <p className="text-gray-900">{brief.testingPlan}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Hypotheses</h4>
            <ul className="list-disc list-inside space-y-1">
              {brief.hypotheses.map((h, i) => (
                <li key={i} className="text-gray-600">{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Metrics</h4>
            <div className="flex flex-wrap gap-2">
              {brief.metrics.map((metric, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{metric}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
