import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { CreativeBrief, Deliverables, FacebookCampaign, Video8s } from '@/lib/types';

// Helvetica is built-in to @react-pdf/renderer — no registration needed

const colors = {
  black: '#1a1a1a',
  body: '#333333',
  gray: '#666666',
  lightGray: '#999999',
  border: '#e0e0e0',
  bg: '#f8f8f8',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.body,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
    lineHeight: 1.5,
  },

  // Cover page
  coverPage: {
    fontFamily: 'Helvetica',
    paddingTop: 80,
    paddingBottom: 80,
    paddingLeft: 60,
    paddingRight: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.black,
    marginBottom: 16,
  },
  coverSubtitle: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 8,
  },
  coverMeta: {
    fontSize: 10,
    color: colors.lightGray,
    marginBottom: 4,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.black,
    paddingBottom: 6,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  },

  // Sub-sections (e.g. avatar cards, proof pillars)
  subSection: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: colors.bg,
    borderRadius: 3,
  },
  subSectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.black,
    marginBottom: 8,
  },

  // Labels and body text
  label: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 10,
    color: colors.body,
    lineHeight: 1.5,
    marginBottom: 10,
  },

  // List items
  listItem: {
    fontSize: 10,
    color: colors.body,
    lineHeight: 1.5,
    marginBottom: 4,
    flexDirection: 'row',
  },
  bullet: {
    width: 14,
    fontSize: 10,
    color: colors.gray,
  },
  listItemText: {
    flex: 1,
    fontSize: 10,
    color: colors.body,
    lineHeight: 1.5,
  },

  // Row layout for label+value pairs
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  rowLabel: {
    width: 120,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 1,
  },
  rowValue: {
    flex: 1,
    fontSize: 10,
    color: colors.body,
    lineHeight: 1.5,
  },
});

// Helper: render a label + body text block
function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.bodyText}>{value}</Text>
    </View>
  );
}

// Helper: render a label + inline row
function RowField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// Helper: render a bullet list
function BulletList({ label, items }: { label: string; items?: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          <Text style={styles.bullet}>{'  •'}</Text>
          <Text style={styles.listItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

interface BriefPDFProps {
  brief: CreativeBrief;
  deliverables: Deliverables;
  sourceUrl: string;
  provider: string;
  model: string;
  createdAt: string;
}

/**
 * React PDF document component for a Creative Brief.
 * Uses @react-pdf/renderer built-in Helvetica font — no external fonts needed.
 */
export default function BriefPDF({
  brief,
  deliverables,
  sourceUrl,
  provider,
  model,
  createdAt,
}: BriefPDFProps) {
  const generatedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Document title="Creative Brief" author="Brief v1 API">
      {/* ── Cover Page ── */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <Text style={styles.coverTitle}>Creative Brief</Text>
        <Text style={styles.coverSubtitle}>{sourceUrl}</Text>
        <Text style={styles.coverMeta}>Generated: {generatedDate}</Text>
        <Text style={styles.coverMeta}>
          Provider: {provider}  |  Model: {model}
        </Text>
      </Page>

      {/* ── Main Content Page(s) ── */}
      <Page size="A4" style={styles.page}>

        {/* Section 1: Brand Truth & Promise */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>1. Brand Truth &amp; Promise</Text>
          <Field label="Brand Truth" value={brief.brandTruth} />
          <Field label="Brand Promise" value={brief.brandPromise} />
          <Field label="Unique Truth" value={brief.uniqueTruth} />
        </View>

        {/* Section 2: Market Context */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>2. Market Context</Text>
          <Field label="Market Context" value={brief.marketContext} />
          <Field label="Competitive Landscape" value={brief.competitiveLandscape} />
          <Field label="Market Tension" value={brief.marketTension} />
        </View>

        {/* Section 3: Audience Avatars */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>3. Audience Avatars</Text>
          {(brief.avatars ?? []).map((avatar, i) => (
            <View key={i} style={styles.subSection}>
              <Text style={styles.subSectionTitle}>
                {avatar.name} — {avatar.type ? avatar.type.charAt(0).toUpperCase() + avatar.type.slice(1) : ''} Avatar
                {avatar.age ? `, Age ${avatar.age}` : ''}
              </Text>
              <RowField label="Background" value={avatar.background} />
              <RowField label="Current State" value={avatar.currentState} />
              <RowField label="Desire" value={avatar.desire} />
              <RowField label="Conflict" value={avatar.conflict} />
              <RowField label="Transformation" value={avatar.transformation} />
              <RowField label="Moral Arc" value={avatar.moralArc} />
              {avatar.featureBenefits && avatar.featureBenefits.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.label}>Feature Benefits</Text>
                  {avatar.featureBenefits.map((fb, j) => (
                    <View key={j} style={{ marginBottom: 6 }}>
                      <Text style={[styles.bodyText, { marginBottom: 2 }]}>
                        Feature: {fb.feature}
                      </Text>
                      <Text style={[styles.bodyText, { marginBottom: 2 }]}>
                        Benefit: {fb.benefit}
                      </Text>
                      <Text style={[styles.bodyText, { marginBottom: 0 }]}>
                        WIIFM: {fb.wiifm}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Section 4: Human Problem */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>4. Human Problem</Text>
          <Field label="Human Problem" value={brief.humanProblem} />
          <Field label="Emotional Tension" value={brief.emotionalTension} />
        </View>

        {/* Section 5: Transformation */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>5. Transformation</Text>
          <Field label="Transformation" value={brief.transformation} />
          <Field label="Before State" value={brief.beforeState} />
          <Field label="After State" value={brief.afterState} />
        </View>

        {/* Section 6: Proof Pillars */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>6. Proof Pillars</Text>
          {(brief.proofPillars ?? []).map((pillar, i) => (
            <View key={i} style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Pillar {i + 1}</Text>
              <RowField label="Claim" value={pillar.claim} />
              <RowField label="Evidence Type" value={pillar.evidenceType} />
              <RowField label="Evidence" value={pillar.evidence} />
              <RowField label="Usage Guidance" value={pillar.usageGuidance} />
            </View>
          ))}
        </View>

        {/* Section 7: Offer & CTA */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>7. Offer &amp; Call to Action</Text>
          <Field label="Offer" value={brief.offer} />
          <Field label="Conversion Path" value={brief.conversionPath} />
          <Field label="Call to Action" value={brief.callToAction} />
        </View>

        {/* Section 8: Messaging & Tone */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>8. Messaging &amp; Tone</Text>
          <BulletList label="Messaging Rules" items={brief.messagingRules} />
          <BulletList label="Tone Guidelines" items={brief.toneGuidelines} />
          <BulletList label="Forbidden Phrases" items={brief.forbiddenPhrases} />
        </View>

        {/* Section 9: Creative Direction */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>9. Creative Direction</Text>
          <Field label="Creative Directions" value={brief.creativeDirections} />
          <Field label="Visual Style" value={brief.visualStyle} />
          <Field label="Narrative Approach" value={brief.narrativeApproach} />
        </View>

        {/* Section 10: Testing Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>10. Testing Plan</Text>
          <Field label="Testing Plan" value={brief.testingPlan} />
          <BulletList label="Hypotheses" items={brief.hypotheses} />
          <BulletList label="Metrics" items={brief.metrics} />
        </View>

        {/* Section 11: Deliverables */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>11. Deliverables</Text>

          <Field label="Website Summary" value={deliverables.websiteSummary} />

          {/* Facebook Campaigns */}
          {Array.isArray(deliverables.facebookCampaigns) && deliverables.facebookCampaigns.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Facebook Campaigns</Text>
              {(deliverables.facebookCampaigns as FacebookCampaign[]).map((campaign, i) => (
                <View key={i} style={styles.subSection}>
                  <Text style={styles.subSectionTitle}>{campaign.campaignName || `Campaign ${i + 1}`}</Text>
                  <RowField label="Objective" value={campaign.objective} />
                  <RowField label="Target Avatar" value={campaign.targetAvatar} />
                  <RowField label="Headline" value={campaign.headline} />
                  <RowField label="Primary Text" value={campaign.primaryText} />
                  <RowField label="Description" value={campaign.description} />
                  <RowField label="Visual Direction" value={campaign.visualDirection} />
                </View>
              ))}
            </View>
          )}

          {/* Legacy: facebookCampaigns as string */}
          {typeof deliverables.facebookCampaigns === 'string' && deliverables.facebookCampaigns && (
            <Field label="Facebook Campaigns" value={deliverables.facebookCampaigns as string} />
          )}

          {/* Video 8s */}
          {deliverables.video8s && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>8-Second Video</Text>
              {(['recognition', 'proofInContext', 'beliefLock'] as const).map((sectionKey) => {
                const videoSection = (deliverables.video8s as Video8s)[sectionKey];
                if (!videoSection) return null;
                const sectionLabels: Record<string, string> = {
                  recognition: 'Recognition',
                  proofInContext: 'Proof in Context',
                  beliefLock: 'Belief Lock',
                };
                return (
                  <View key={sectionKey} style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>{sectionLabels[sectionKey]}</Text>
                    <RowField label="Duration" value={videoSection.duration} />
                    <RowField label="Purpose" value={videoSection.purpose} />
                    <RowField label="Visual Direction" value={videoSection.visualDirection} />
                    <RowField label="Voiceover / Text" value={videoSection.voiceoverOrText} />
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </Page>
    </Document>
  );
}
