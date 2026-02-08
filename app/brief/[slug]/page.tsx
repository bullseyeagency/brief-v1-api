import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { V1GeneratedBrief } from '@/lib/supabase';
import { CreativeBrief, Deliverables } from '@/lib/types';
import BriefViewer from '@/components/BriefViewer';
import DeliverablesViewer from '@/components/DeliverablesViewer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBrief(slug: string): Promise<V1GeneratedBrief | null> {
  const { data, error } = await supabase
    .from('v1_generated_briefs')
    .select('*')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single();

  if (error) {
    console.error('Error fetching brief:', error);
    return null;
  }

  return data;
}

export default async function BriefPage({ params }: PageProps) {
  const { slug } = await params;
  const briefData = await getBrief(slug);

  if (!briefData) {
    notFound();
  }

  const brief = briefData.brief as CreativeBrief;
  const deliverables = briefData.deliverables as Deliverables;

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
        <div className="space-y-8">
          <BriefViewer brief={brief} />
          <DeliverablesViewer deliverables={deliverables} />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a
              href="/"
              className="text-blue-600 hover:underline"
            >
              Brief v1 API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
