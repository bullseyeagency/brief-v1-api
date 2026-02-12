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

  const [generatingAvatars, setGeneratingAvatars] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState<{
    primary?: string;
    secondary?: string;
    tertiary?: string;
  }>({});

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

        // Auto-start avatar generation
        generateAvatars(data);
      } catch (err) {
        console.error('Error fetching brief:', err);
        setError(err instanceof Error ? err.message : 'Failed to load brief');
      } finally {
        setLoading(false);
      }
    }

    fetchBrief();
  }, [slug]);

  async function generateAvatars(data: BriefData) {
    setGeneratingAvatars(true);
    setError('');

    try {
      const businessName = data.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

      // Generate each avatar sequentially
      for (let i = 0; i < 3; i++) {
        const avatar = data.brief.avatars[i];
        const type = avatar.type;

        console.log(`Generating ${type} avatar...`);

        const response = await fetch('/api/generate-avatar-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            avatar,
            businessName,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate avatar');
        }

        const result = await response.json();

        setAvatarProgress(prev => ({
          ...prev,
          [type]: result.imageUrl
        }));

        console.log(`✓ ${type} avatar generated: ${result.imageUrl}`);
      }

      console.log('All avatars generated successfully');
    } catch (err) {
      console.error('Avatar generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatars');
    } finally {
      setGeneratingAvatars(false);
    }
  }

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
            <h2 className="text-xl font-semibold mb-4">Avatar Generation</h2>

            {generatingAvatars && (
              <div className="mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin inline mr-2" />
                <span className="text-gray-600">Generating avatars...</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Primary Avatar */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">Primary Avatar</h3>
                  <p className="text-sm text-gray-500">{briefData.brief.avatars[0]?.name || 'Customer'}</p>
                </div>
                {avatarProgress.primary ? (
                  <img src={avatarProgress.primary} alt="Primary" className="w-24 h-24 object-cover rounded" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Secondary Avatar */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">Secondary Avatar</h3>
                  <p className="text-sm text-gray-500">{briefData.brief.avatars[1]?.name || 'Customer'}</p>
                </div>
                {avatarProgress.secondary ? (
                  <img src={avatarProgress.secondary} alt="Secondary" className="w-24 h-24 object-cover rounded" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars && avatarProgress.primary ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tertiary Avatar */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">Tertiary Avatar</h3>
                  <p className="text-sm text-gray-500">{briefData.brief.avatars[2]?.name || 'Customer'}</p>
                </div>
                {avatarProgress.tertiary ? (
                  <img src={avatarProgress.tertiary} alt="Tertiary" className="w-24 h-24 object-cover rounded" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars && avatarProgress.primary && avatarProgress.secondary ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
