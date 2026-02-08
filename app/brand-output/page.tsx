'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { loadBriefOutput, BriefOutput } from '@/lib/store';
import BriefViewer from '@/components/BriefViewer';
import DeliverablesViewer from '@/components/DeliverablesViewer';

// Helper to convert any deliverable content to string for downloads
function formatForDownload(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return `--- Item ${index + 1} ---\n` + Object.entries(item)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n');
      }
      return String(item);
    }).join('\n\n');
  }
  if (typeof content === 'object' && content !== null) {
    return Object.entries(content)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join('\n');
  }
  return String(content);
}

export default function BrandOutputPage() {
  const router = useRouter();
  const [output, setOutput] = useState<BriefOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'brief' | 'deliverables' | 'debug'>('brief');
  const [showPrompts, setShowPrompts] = useState<{ system: boolean; generation: boolean; deliverables: boolean }>({
    system: false,
    generation: false,
    deliverables: false,
  });

  useEffect(() => {
    const data = loadBriefOutput();
    if (data) {
      setOutput(data);
    }
    setLoading(false);
  }, []);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBrief = () => {
    if (!output) return;
    const content = JSON.stringify(output.brief, null, 2);
    downloadFile(content, 'creative-brief.json');
  };

  const downloadDeliverables = () => {
    if (!output) return;
    const content = `WEBSITE SUMMARY\n${'='.repeat(50)}\n${formatForDownload(output.deliverables.websiteSummary)}\n\n\nFACEBOOK CAMPAIGNS\n${'='.repeat(50)}\n${formatForDownload(output.deliverables.facebookCampaigns)}\n\n\n30-SECOND TV COMMERCIAL\n${'='.repeat(50)}\n${formatForDownload(output.deliverables.tvCommercial30s)}`;
    downloadFile(content, 'deliverables.txt');
  };

  const downloadAll = () => {
    if (!output) return;
    const content = `CREATIVE BRIEF OUTPUT
Generated: ${output.generatedAt}
URL: ${output.url}
Provider: ${output.provider}
Model: ${output.model}

${'='.repeat(60)}
CREATIVE BRIEF
${'='.repeat(60)}

${JSON.stringify(output.brief, null, 2)}

${'='.repeat(60)}
DELIVERABLES
${'='.repeat(60)}

WEBSITE SUMMARY
${'-'.repeat(40)}
${formatForDownload(output.deliverables.websiteSummary)}

FACEBOOK CAMPAIGNS
${'-'.repeat(40)}
${formatForDownload(output.deliverables.facebookCampaigns)}

30-SECOND TV COMMERCIAL
${'-'.repeat(40)}
${formatForDownload(output.deliverables.tvCommercial30s)}
`;
    downloadFile(content, 'creative-brief-complete.txt');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">No brief data found. Please generate a brief first.</p>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Brand Output</h1>
              <p className="text-sm text-gray-500">{output.url}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {output.provider} / {output.model}
              </span>
              <button
                onClick={downloadAll}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Download className="w-4 h-4" />
                Download All
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('brief')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'brief'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Creative Brief
            </button>
            <button
              onClick={() => setActiveTab('deliverables')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'deliverables'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Deliverables
            </button>
            <button
              onClick={() => setActiveTab('debug')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'debug'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              Debug Console
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'brief' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={downloadBrief}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <FileText className="w-4 h-4" />
                Download Brief JSON
              </button>
            </div>
            <BriefViewer brief={output.brief} />
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <button
                onClick={downloadDeliverables}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                Download All Deliverables
              </button>
            </div>
            <DeliverablesViewer deliverables={output.deliverables} />
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generation Info</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Provider:</span>
                  <p className="font-medium">{output.provider}</p>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <p className="font-medium">{output.model}</p>
                </div>
                <div>
                  <span className="text-gray-500">Generated:</span>
                  <p className="font-medium">{new Date(output.generatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">URL:</span>
                  <p className="font-medium truncate">{output.url}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Log</h2>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 max-h-60 overflow-auto">
                {output.logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-500">[{String(i + 1).padStart(2, '0')}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Prompts Sent</h2>

              {/* System Prompt */}
              <div className="mb-4">
                <button
                  onClick={() => setShowPrompts({ ...showPrompts, system: !showPrompts.system })}
                  className="flex items-center gap-2 w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  {showPrompts.system ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium">System Prompt</span>
                  <span className="text-xs text-gray-500 ml-auto">{output.prompts.systemPrompt.length} chars</span>
                </button>
                {showPrompts.system && (
                  <div className="mt-2 bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 max-h-96 overflow-auto whitespace-pre-wrap">
                    {output.prompts.systemPrompt}
                  </div>
                )}
              </div>

              {/* Generation Prompt */}
              <div className="mb-4">
                <button
                  onClick={() => setShowPrompts({ ...showPrompts, generation: !showPrompts.generation })}
                  className="flex items-center gap-2 w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  {showPrompts.generation ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium">Brief Generation Prompt</span>
                  <span className="text-xs text-gray-500 ml-auto">{output.prompts.generationPrompt.length} chars</span>
                </button>
                {showPrompts.generation && (
                  <div className="mt-2 bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 max-h-96 overflow-auto whitespace-pre-wrap">
                    {output.prompts.generationPrompt}
                  </div>
                )}
              </div>

              {/* Deliverables Prompt */}
              <div>
                <button
                  onClick={() => setShowPrompts({ ...showPrompts, deliverables: !showPrompts.deliverables })}
                  className="flex items-center gap-2 w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  {showPrompts.deliverables ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium">Deliverables Prompt</span>
                  <span className="text-xs text-gray-500 ml-auto">{output.prompts.deliverablesPrompt.length} chars</span>
                </button>
                {showPrompts.deliverables && (
                  <div className="mt-2 bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 max-h-96 overflow-auto whitespace-pre-wrap">
                    {output.prompts.deliverablesPrompt}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
