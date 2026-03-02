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
  const [magazineProgress, setMagazineProgress] = useState<{
    cover?: string;
    brandTruth?: string;
    marketContext?: string;
    problem?: string;
    transformation?: string;
    proofPillars?: string;
    offer?: string;
    messaging?: string;
    creativeDirection?: string;
    backCover?: string;
  }>({});
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  useEffect(() => {
    async function fetchBrief() {
      try {
        const { data, error } = await supabase
          .from('v1_generated_briefs')
          .select('id, brief, source_url, images')
          .eq('public_slug', slug)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Brief not found');

        setBriefData(data);

        // Load existing images if they exist
        if (data.images) {
          const images = data.images as any;
          if (images.avatars) {
            setAvatarProgress({
              primary: images.avatars[0],
              secondary: images.avatars[1],
              tertiary: images.avatars[2],
            });
          }
          if (images.cover || images.pages) {
            setMagazineProgress({
              cover: images.cover,
              brandTruth: images.pages?.brandTruth,
              marketContext: images.pages?.marketContext,
              problem: images.pages?.problem,
              transformation: images.pages?.transformation,
              proofPillars: images.pages?.proofPillars,
              offer: images.pages?.offer,
              messaging: images.pages?.messaging,
              creativeDirection: images.pages?.creativeDirection,
              backCover: images.backCover,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching brief:', err);
        setError(err instanceof Error ? err.message : 'Failed to load brief');
      } finally {
        setLoading(false);
      }
    }

    fetchBrief();
  }, [slug]);

  async function generateAvatars() {
    if (!briefData || generatingAvatars || hasStartedGeneration) {
      console.log('Skipping generation - already in progress or completed');
      return;
    }

    setHasStartedGeneration(true);
    setGeneratingAvatars(true);
    setError('');

    try {
      // Read user's model preference from settings
      let imageModel = 'gemini-2.5-flash-image';
      try {
        const savedSettings = localStorage.getItem('creative_brief_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          imageModel = parsed.image?.model || 'gemini-2.5-flash-image';
        }
      } catch (e) {
        console.warn('Failed to read settings, using default flash model');
      }

      console.log(`Generating all 13 magazine images using model: ${imageModel}`);

      const response = await fetch('/api/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefId: briefData.id,
          model: imageModel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate images');
      }

      const result = await response.json();

      if (result.images) {
        const { avatars, cover, pages, backCover } = result.images;

        setAvatarProgress({
          primary: avatars[0],
          secondary: avatars[1],
          tertiary: avatars[2],
        });

        setMagazineProgress({
          cover,
          brandTruth: pages.brandTruth,
          marketContext: pages.marketContext,
          problem: pages.problem,
          transformation: pages.transformation,
          proofPillars: pages.proofPillars,
          offer: pages.offer,
          messaging: pages.messaging,
          creativeDirection: pages.creativeDirection,
          backCover,
        });

        console.log('✓ All 13 images generated');
      }

      console.log('All avatars generated successfully');
    } catch (err) {
      console.error('Avatar generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatars');
      setHasStartedGeneration(false); // Allow retry on error
    } finally {
      setGeneratingAvatars(false);
    }
  }

  async function debugSingleImage() {
    if (!briefData || debugLoading) return;
    setDebugLoading(true);
    setDebugResult(null);
    try {
      const res = await fetch('/api/debug-nano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId: briefData.id }),
      });
      const json = await res.json();
      setDebugResult(json);
      console.log('[DebugNano] Full result:', json);
    } catch (err) {
      setDebugResult({ error: String(err) });
    } finally {
      setDebugLoading(false);
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
    <>
      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={modalImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

          {/* DEBUG: single image test */}
          <div className="border border-yellow-400 bg-yellow-50 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-bold text-yellow-800 mb-2">DEBUG — Test 1 Image (Primary Avatar)</h2>
            <button
              onClick={debugSingleImage}
              disabled={debugLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 text-sm"
            >
              {debugLoading ? 'Sending to NanoBanana...' : 'Fire 1 Image Request'}
            </button>
            {debugResult && (
              <div className="mt-4 space-y-3">
                {debugResult.debug && (
                  <div>
                    <p className="text-xs font-semibold text-yellow-800">Request sent:</p>
                    <pre className="text-xs bg-white border border-yellow-200 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(debugResult.request, null, 2)}
                    </pre>
                    <p className="text-xs text-yellow-700 mt-1">
                      Prompt ({debugResult.debug.promptLength} chars) · Model: {debugResult.debug.model} · Time: {debugResult.debug.elapsedMs}ms
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-yellow-800">
                    NanoBanana response (HTTP {debugResult.response?.status}):
                  </p>
                  <pre className="text-xs bg-white border border-yellow-200 rounded p-2 overflow-auto max-h-60 whitespace-pre-wrap">
                    {debugResult.response?.rawBody || JSON.stringify(debugResult, null, 2)}
                  </pre>
                </div>
                {debugResult.response?.parsed?.data?.url && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1">Image URL returned:</p>
                    <img src={debugResult.response.parsed.data.url} alt="debug" className="max-h-48 rounded border" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Avatar Generation</h2>

            {!hasStartedGeneration && (
              <button
                onClick={generateAvatars}
                disabled={generatingAvatars || !briefData}
                className="mb-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Avatars (Manual)
              </button>
            )}

            {generatingAvatars && (
              <div className="mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin inline mr-2" />
                <span className="text-gray-600">Generating all 13 magazine images (~2 min)...</span>
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
                  <img
                    src={avatarProgress.primary}
                    alt="Primary"
                    className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(avatarProgress.primary!)}
                  />
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
                  <img
                    src={avatarProgress.secondary}
                    alt="Secondary"
                    className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(avatarProgress.secondary!)}
                  />
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

              {/* Tertiary Avatar */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">Tertiary Avatar</h3>
                  <p className="text-sm text-gray-500">{briefData.brief.avatars[2]?.name || 'Customer'}</p>
                </div>
                {avatarProgress.tertiary ? (
                  <img
                    src={avatarProgress.tertiary}
                    alt="Tertiary"
                    className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(avatarProgress.tertiary!)}
                  />
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
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Magazine Pages */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Magazine Pages</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Cover */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Cover</h3>
                {magazineProgress.cover ? (
                  <>
                    <img
                      src={magazineProgress.cover}
                      alt="Cover"
                      className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80 mb-2"
                      onClick={() => setModalImage(magazineProgress.cover!)}
                    />
                    <button
                      onClick={() => alert('Regenerate cover - coming soon')}
                      className="w-full text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Regenerate
                    </button>
                  </>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Brand Truth */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Brand Truth</h3>
                {magazineProgress.brandTruth ? (
                  <img
                    src={magazineProgress.brandTruth}
                    alt="Brand Truth"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.brandTruth!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Market Context */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Market Context</h3>
                {magazineProgress.marketContext ? (
                  <img
                    src={magazineProgress.marketContext}
                    alt="Market Context"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.marketContext!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Problem */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Problem</h3>
                {magazineProgress.problem ? (
                  <img
                    src={magazineProgress.problem}
                    alt="Problem"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.problem!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Transformation */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Transformation</h3>
                {magazineProgress.transformation ? (
                  <img
                    src={magazineProgress.transformation}
                    alt="Transformation"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.transformation!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Proof Pillars */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Proof Pillars</h3>
                {magazineProgress.proofPillars ? (
                  <img
                    src={magazineProgress.proofPillars}
                    alt="Proof Pillars"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.proofPillars!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Offer */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Offer</h3>
                {magazineProgress.offer ? (
                  <img
                    src={magazineProgress.offer}
                    alt="Offer"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.offer!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Messaging */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Messaging</h3>
                {magazineProgress.messaging ? (
                  <img
                    src={magazineProgress.messaging}
                    alt="Messaging"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.messaging!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Creative Direction */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Creative Direction</h3>
                {magazineProgress.creativeDirection ? (
                  <img
                    src={magazineProgress.creativeDirection}
                    alt="Creative Direction"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.creativeDirection!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>

              {/* Back Cover */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">Back Cover</h3>
                {magazineProgress.backCover ? (
                  <img
                    src={magazineProgress.backCover}
                    alt="Back Cover"
                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setModalImage(magazineProgress.backCover!)}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    {generatingAvatars ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
