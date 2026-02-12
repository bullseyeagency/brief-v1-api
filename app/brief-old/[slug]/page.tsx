'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CreativeBrief, Deliverables } from '@/lib/types';
import BriefViewer from '@/components/BriefViewer';
import DeliverablesViewer from '@/components/DeliverablesViewer';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error === 'not-found') {
    notFound();
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Progress Header */}
            <div className="flex items-center gap-4 mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {briefData.current_task || 'Processing...'}
                </h2>
                <p className="text-sm text-gray-500">Processing {briefData.source_url}</p>
              </div>
              <span className="text-2xl font-bold text-primary">{briefData.progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500 ease-out"
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
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Task Log</span>
              </div>
              <div className="bg-gray-900 p-4 h-48 overflow-auto font-mono text-sm">
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
            <p className="text-center text-sm text-gray-500 mt-4">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Generation Failed</h1>
            <p className="text-gray-700 mb-4">{briefData.error_message || 'An error occurred while generating the brief.'}</p>
            <a href="/" className="text-blue-600 hover:underline">
              Try creating a new brief
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show completed brief
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Creative Brief
          </h1>
          <p className="text-gray-600">
            Generated from{' '}
            <a
              href={briefData.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {briefData.source_url}
            </a>
          </p>
          <div className="mt-2 flex gap-4 text-sm text-gray-500">
            <span>
              Provider: <span className="font-medium">{briefData.provider}</span>
            </span>
            <span>
              Model: <span className="font-medium">{briefData.model}</span>
            </span>
            <span>
              Generated:{' '}
              <span className="font-medium">
                {new Date(briefData.created_at).toLocaleDateString()}
              </span>
            </span>
            {briefData.generation_time_ms && (
              <span>
                Time:{' '}
                <span className="font-medium">
                  {(briefData.generation_time_ms / 1000).toFixed(1)}s
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Brief Content */}
        {briefData.brief && briefData.deliverables && (
          <div className="space-y-8">
            <BriefViewer
              brief={briefData.brief}
              businessName={briefData.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
            />
            <DeliverablesViewer deliverables={briefData.deliverables} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a href="/" className="text-blue-600 hover:underline">
              Brief v1 API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
