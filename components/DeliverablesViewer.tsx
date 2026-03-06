'use client';

import { Globe, Facebook, Tv, Film, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { Deliverables, CreativeBrief, Avatar } from '@/lib/types';

interface DeliverablesViewerProps {
  deliverables: Deliverables;
  brief?: CreativeBrief;
  businessName?: string;
}

// Helper to convert any deliverable content to a displayable string
function formatDeliverableContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    // Handle array of campaign objects
    return content
      .map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return formatCampaignObject(item as Record<string, unknown>, index + 1);
        }
        return String(item);
      })
      .join('\n\n');
  }

  if (typeof content === 'object' && content !== null) {
    // Handle single object
    return formatCampaignObject(content as Record<string, unknown>, 1);
  }

  return String(content);
}

// Format a campaign object into readable text
function formatCampaignObject(obj: Record<string, unknown>, index: number): string {
  const lines: string[] = [];

  // Check if it has campaign-like structure
  if ('campaignName' in obj || 'objective' in obj) {
    lines.push(`--- Campaign ${index} ---`);
    if (obj.campaignName) lines.push(`Campaign Name: ${obj.campaignName}`);
    if (obj.objective) lines.push(`Objective: ${obj.objective}`);
    if (obj.targetAvatar) lines.push(`Target Avatar: ${obj.targetAvatar}`);
    if (obj.primaryText) lines.push(`Primary Text: ${obj.primaryText}`);
    if (obj.headline) lines.push(`Headline: ${obj.headline}`);
    if (obj.description) lines.push(`Description: ${obj.description}`);
    if (obj.visualDirection) lines.push(`Visual Direction: ${obj.visualDirection}`);
    return lines.join('\n');
  }

  // Check if it has TV commercial structure
  if ('openingHook' in obj || 'voiceover' in obj) {
    const formatValue = (val: unknown): string => {
      if (typeof val === 'object' && val !== null) {
        return Object.entries(val)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join('\n');
      }
      return String(val);
    };

    if (obj.openingHook) lines.push(`Opening Hook:\n${formatValue(obj.openingHook)}`);
    if (obj.problemEstablishment)
      lines.push(`Problem:\n${formatValue(obj.problemEstablishment)}`);
    if (obj.brandIntroduction)
      lines.push(`Brand Introduction:\n${formatValue(obj.brandIntroduction)}`);
    if (obj.proofMoment) lines.push(`Proof Moment:\n${formatValue(obj.proofMoment)}`);
    if (obj.transformation) lines.push(`Transformation:\n${formatValue(obj.transformation)}`);
    if (obj.ctaResolution) lines.push(`CTA:\n${formatValue(obj.ctaResolution)}`);
    if (obj.voiceover) lines.push(`\nVoiceover:\n${formatValue(obj.voiceover)}`);
    if (obj.visualDirections)
      lines.push(`\nVisual Directions:\n${formatValue(obj.visualDirections)}`);
    return lines.join('\n\n');
  }

  // Check if it has video8s structure
  if ('recognition' in obj || 'proofInContext' in obj || 'beliefLock' in obj) {
    const formatSection = (section: Record<string, unknown>, name: string): string => {
      const sectionLines: string[] = [`--- ${name} ---`];
      if (section.duration) sectionLines.push(`Duration: ${section.duration}`);
      if (section.purpose) sectionLines.push(`Purpose: ${section.purpose}`);
      if (section.visualDirection)
        sectionLines.push(`Visual Direction: ${section.visualDirection}`);
      if (section.voiceoverOrText)
        sectionLines.push(`Voiceover/Text: ${section.voiceoverOrText}`);
      return sectionLines.join('\n');
    };

    if (obj.recognition && typeof obj.recognition === 'object') {
      lines.push(
        formatSection(obj.recognition as Record<string, unknown>, 'Recognition (0-2s)'),
      );
    }
    if (obj.proofInContext && typeof obj.proofInContext === 'object') {
      lines.push(
        formatSection(obj.proofInContext as Record<string, unknown>, 'Proof in Context (2-6s)'),
      );
    }
    if (obj.beliefLock && typeof obj.beliefLock === 'object') {
      lines.push(
        formatSection(obj.beliefLock as Record<string, unknown>, 'Belief Lock (6-8s)'),
      );
    }
    return lines.join('\n\n');
  }

  // Generic object formatting
  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    lines.push(
      `${formattedKey}: ${typeof value === 'object' ? JSON.stringify(value) : value}`,
    );
  }

  return lines.join('\n');
}

// ---- Avatar components for Customer Personas section ----

function AvatarCard({
  avatar,
  businessName,
  generatedImage,
  isLoading,
  onGenerateImage,
}: {
  avatar: Avatar;
  businessName: string;
  generatedImage?: string;
  isLoading: boolean;
  onGenerateImage: () => void;
}) {
  // businessName is forwarded via onGenerateImage closure; kept in props for clarity
  void businessName;

  const typeLabels: Record<Avatar['type'], string> = {
    primary: 'Primary Hero Avatar',
    secondary: 'Secondary Mirror Avatar',
    tertiary: 'Tertiary Aspirational Avatar',
  };

  const typeColors: Record<Avatar['type'], string> = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
    tertiary: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <div className="mb-4">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
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
          <h4 className="text-lg font-semibold text-gray-900 mt-2">
            {avatar.name}, {avatar.age}
          </h4>
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
                  <span className="font-medium">{fb.feature}</span> &rarr; {fb.benefit} &rarr;{' '}
                  <em>{fb.wiifm}</em>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100">
          <span className="font-medium text-gray-700">Cinematic Image Prompt:</span>
          <p className="text-gray-600 italic bg-gray-50 p-2 rounded mt-1">
            {avatar.cinematicImagePrompt}
          </p>
        </div>
      </div>
    </div>
  );
}

function AvatarsSection({
  brief,
  businessName,
}: {
  brief: CreativeBrief;
  businessName: string;
}) {
  const [avatarImages, setAvatarImages] = useState<Record<number, string>>({});
  const [avatarLoading, setAvatarLoading] = useState<Record<number, boolean>>({});

  const getImageModel = (): string => {
    try {
      const savedSettings = localStorage.getItem('creative_brief_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings) as { imageModel?: { model?: string } };
        return settings.imageModel?.model ?? 'gemini-3-pro-image-preview';
      }
    } catch (error) {
      console.error('Error reading settings:', error);
    }
    return 'gemini-3-pro-image-preview';
  };

  const handleGenerateAvatarImage = async (avatar: Avatar, index: number): Promise<void> => {
    try {
      setAvatarLoading((prev) => ({ ...prev, [index]: true }));
      const model = getImageModel();
      const response = await fetch('/api/generate-avatar-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar, businessName, model }),
      });
      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? 'Failed to generate image');
      }
      const data = (await response.json()) as { imageUrl: string };
      setAvatarImages((prev) => ({ ...prev, [index]: data.imageUrl }));
    } catch (error) {
      console.error('Error generating avatar image:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setAvatarLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Customer Personas (Avatars)</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {brief.avatars.map((avatar, i) => (
            <AvatarCard
              key={i}
              avatar={avatar}
              businessName={businessName}
              generatedImage={avatarImages[i]}
              isLoading={avatarLoading[i] ?? false}
              onGenerateImage={() => handleGenerateAvatarImage(avatar, i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Deliverable card ----

function DeliverableCard({
  title,
  icon,
  content,
}: {
  title: string;
  icon: React.ReactNode;
  content: unknown;
}) {
  const [copied, setCopied] = useState(false);
  const formattedContent = formatDeliverableContent(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-6">
        <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
          {formattedContent}
        </div>
      </div>
    </div>
  );
}

// ---- Main export ----

export default function DeliverablesViewer({
  deliverables,
  brief,
  businessName = 'Business',
}: DeliverablesViewerProps) {
  const hasVideo8s = deliverables.video8s !== undefined;
  const hasTvCommercial = deliverables.tvCommercial30s !== undefined;

  return (
    <div className="space-y-6">
      {brief && brief.avatars && brief.avatars.length > 0 && (
        <AvatarsSection brief={brief} businessName={businessName} />
      )}

      <DeliverableCard
        title="Website Summary"
        icon={<Globe className="w-5 h-5 text-blue-600" />}
        content={deliverables.websiteSummary}
      />

      <DeliverableCard
        title="Facebook Campaigns"
        icon={<Facebook className="w-5 h-5 text-blue-700" />}
        content={deliverables.facebookCampaigns}
      />

      {hasVideo8s && (
        <DeliverableCard
          title="8-Second Video"
          icon={<Film className="w-5 h-5 text-purple-600" />}
          content={deliverables.video8s}
        />
      )}

      {hasTvCommercial && !hasVideo8s && (
        <DeliverableCard
          title="30-Second TV Commercial"
          icon={<Tv className="w-5 h-5 text-purple-600" />}
          content={deliverables.tvCommercial30s}
        />
      )}
    </div>
  );
}
