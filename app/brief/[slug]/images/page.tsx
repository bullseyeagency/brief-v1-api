'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CreativeBrief } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface BriefData {
  id: string;
  brief: CreativeBrief;
  source_url: string;
}

export default function BriefImagesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBrief() {
      try {
        const { data, error } = await supabase
          .from('v1_generated_briefs')
          .select('id, brief, source_url')
          .eq('public_slug', slug)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Brief not found');

        setBriefData(data);
      } catch (err) {
        console.error('Error fetching brief:', err);
        setError(err instanceof Error ? err.message : 'Failed to load brief');
      } finally {
        setLoading(false);
      }
    }

    fetchBrief();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !briefData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Brief not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Generate Magazine Images
          </h1>

          <div className="mb-6">
            <p className="text-gray-600">
              <strong>Brief:</strong> {briefData.source_url}
            </p>
            <p className="text-gray-600">
              <strong>Brief ID:</strong> {briefData.id}
            </p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Image Generation</h2>
            <p className="text-gray-500">Ready to generate images...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
