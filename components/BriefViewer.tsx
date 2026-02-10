'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Shield, Target, Lightbulb, Heart, MessageSquare, Palette, FlaskConical } from 'lucide-react';
import { CreativeBrief, Avatar, ProofPillar } from '@/lib/types';

interface BriefViewerProps {
  brief: CreativeBrief;
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

function AvatarCard({ avatar }: { avatar: Avatar }) {
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

        <div className="pt-3 border-t border-gray-100">
          <span className="font-medium text-gray-700">Cinematic Image Prompt:</span>
          <p className="text-gray-600 italic bg-gray-50 p-2 rounded mt-1">{avatar.cinematicImagePrompt}</p>
        </div>
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

export default function BriefViewer({ brief }: BriefViewerProps) {
  return (
    <div className="space-y-4">
      {/* Brand Truth */}
      <Section title="Brand Truth & Promise" icon={<Target className="w-5 h-5 text-primary" />} defaultOpen>
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
      </Section>

      {/* Market Context */}
      <Section title="Market Context" icon={<Lightbulb className="w-5 h-5 text-primary" />}>
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
      </Section>

      {/* Avatars */}
      <Section title="Avatars (3)" icon={<User className="w-5 h-5 text-primary" />} defaultOpen>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {brief.avatars.map((avatar, i) => (
            <AvatarCard key={i} avatar={avatar} />
          ))}
        </div>
      </Section>

      {/* Problem & Tension */}
      <Section title="Problem & Tension" icon={<Heart className="w-5 h-5 text-primary" />}>
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
      </Section>

      {/* Transformation */}
      <Section title="Transformation" icon={<Lightbulb className="w-5 h-5 text-primary" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-1">Before State</h4>
              <p className="text-red-900">{brief.beforeState}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">After State</h4>
              <p className="text-green-900">{brief.afterState}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Transformation Journey</h4>
            <p className="text-gray-900">{brief.transformation}</p>
          </div>
        </div>
      </Section>

      {/* Proof Pillars */}
      <Section title="Proof Pillars (5)" icon={<Shield className="w-5 h-5 text-primary" />} defaultOpen>
        <div className="space-y-4">
          {brief.proofPillars.map((pillar, i) => (
            <ProofPillarCard key={i} pillar={pillar} index={i} />
          ))}
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
