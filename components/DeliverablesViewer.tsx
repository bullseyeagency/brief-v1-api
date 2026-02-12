'use client';

import { Globe, Facebook, Tv, Film, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Deliverables } from '@/lib/types';

interface DeliverablesViewerProps {
  deliverables: Deliverables;
}

// Helper to convert any deliverable content to a displayable string
function formatDeliverableContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    // Handle array of campaign objects
    return content.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return formatCampaignObject(item as Record<string, unknown>, index + 1);
      }
      return String(item);
    }).join('\n\n');
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
        return Object.entries(val).map(([k, v]) => `  ${k}: ${v}`).join('\n');
      }
      return String(val);
    };

    if (obj.openingHook) lines.push(`Opening Hook:\n${formatValue(obj.openingHook)}`);
    if (obj.problemEstablishment) lines.push(`Problem:\n${formatValue(obj.problemEstablishment)}`);
    if (obj.brandIntroduction) lines.push(`Brand Introduction:\n${formatValue(obj.brandIntroduction)}`);
    if (obj.proofMoment) lines.push(`Proof Moment:\n${formatValue(obj.proofMoment)}`);
    if (obj.transformation) lines.push(`Transformation:\n${formatValue(obj.transformation)}`);
    if (obj.ctaResolution) lines.push(`CTA:\n${formatValue(obj.ctaResolution)}`);
    if (obj.voiceover) lines.push(`\nVoiceover:\n${formatValue(obj.voiceover)}`);
    if (obj.visualDirections) lines.push(`\nVisual Directions:\n${formatValue(obj.visualDirections)}`);
    return lines.join('\n\n');
  }

  // Check if it has video8s structure
  if ('recognition' in obj || 'proofInContext' in obj || 'beliefLock' in obj) {
    const formatSection = (section: Record<string, unknown>, name: string): string => {
      const sectionLines: string[] = [`--- ${name} ---`];
      if (section.duration) sectionLines.push(`Duration: ${section.duration}`);
      if (section.purpose) sectionLines.push(`Purpose: ${section.purpose}`);
      if (section.visualDirection) sectionLines.push(`Visual Direction: ${section.visualDirection}`);
      if (section.voiceoverOrText) sectionLines.push(`Voiceover/Text: ${section.voiceoverOrText}`);
      return sectionLines.join('\n');
    };

    if (obj.recognition && typeof obj.recognition === 'object') {
      lines.push(formatSection(obj.recognition as Record<string, unknown>, 'Recognition (0-2s)'));
    }
    if (obj.proofInContext && typeof obj.proofInContext === 'object') {
      lines.push(formatSection(obj.proofInContext as Record<string, unknown>, 'Proof in Context (2-6s)'));
    }
    if (obj.beliefLock && typeof obj.beliefLock === 'object') {
      lines.push(formatSection(obj.beliefLock as Record<string, unknown>, 'Belief Lock (6-8s)'));
    }
    return lines.join('\n\n');
  }

  // Generic object formatting
  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    lines.push(`${formattedKey}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  }

  return lines.join('\n');
}

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

export default function DeliverablesViewer({ deliverables }: DeliverablesViewerProps) {
  // Determine if this is a new-format brief (has video8s) or legacy (has tvCommercial30s)
  const hasVideo8s = deliverables.video8s !== undefined;
  const hasTvCommercial = deliverables.tvCommercial30s !== undefined;

  return (
    <div className="space-y-6">
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

      {/* Show video8s for new format */}
      {hasVideo8s && (
        <DeliverableCard
          title="8-Second Video"
          icon={<Film className="w-5 h-5 text-purple-600" />}
          content={deliverables.video8s}
        />
      )}

      {/* Show TV commercial for legacy format */}
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
