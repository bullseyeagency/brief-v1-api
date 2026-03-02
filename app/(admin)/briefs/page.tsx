'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { V1GeneratedBrief } from '@/lib/supabase';
import { FileText, ExternalLink, Loader2, Trash2, ImagePlus, Sparkles, Archive } from 'lucide-react';

export default function BriefsListPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<V1GeneratedBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBriefs() {
      try {
        const { data, error } = await supabase
          .from('v1_generated_briefs')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setBriefs(data || []);
      } catch (err) {
        console.error('Error fetching briefs:', err);
        setError('Failed to load briefs');
      } finally {
        setLoading(false);
      }
    }

    fetchBriefs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'claude':
        return 'bg-purple-100 text-purple-800';
      case 'gemini':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case 'local':
        return 'bg-orange-100 text-orange-800';
      case 'shopify':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string | undefined) => {
    if (!type) return 'Default';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleDelete = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this brief? This action cannot be undone.')) {
      return;
    }

    setDeletingId(slug);

    try {
      const response = await fetch(`/api/brief/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete brief');
      }

      // Remove from local state
      setBriefs(prev => prev.filter(b => b.public_slug !== slug));
    } catch (err) {
      console.error('Error deleting brief:', err);
      setError('Failed to delete brief');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerateImages = async (briefId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Generate magazine images for this brief? This will create 13 images (3 avatars + cover + 8 pages + back cover) and may take 2-3 minutes.')) {
      return;
    }

    setRegeneratingId(briefId);
    setError('');

    try {
      const response = await fetch('/api/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate images');
      }

      const data = await response.json();
      console.log('Images regenerated:', data);

      // Update brief in local state with new images
      setBriefs(prev => prev.map(b =>
        b.id === briefId ? { ...b, images: data.images } : b
      ));

      alert(`Success! Generated 13 magazine images in ${(data.generationTimeMs / 1000).toFixed(1)}s. View them in the booklet format.`);
    } catch (err) {
      console.error('Error regenerating images:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate images');
      alert('Failed to regenerate images. Check console for details.');
    } finally {
      setRegeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Creative Briefs
          </h1>
          <p className="text-gray-600">
            All generated creative briefs from brief-v1-api
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && briefs.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No briefs yet
            </h2>
            <p className="text-gray-600 mb-6">
              Generate your first creative brief to see it here
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Brief
            </button>
          </div>
        )}

        {/* Briefs Table */}
        {briefs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {briefs.map((brief) => (
                    <tr
                      key={brief.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/creative-strategy-brief/${brief.public_slug}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="max-w-xs truncate">
                            <a
                              href={brief.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {brief.source_url}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                            (brief as any).metadata?.type
                          )}`}
                        >
                          {getTypeName((brief as any).metadata?.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(
                            brief.provider
                          )}`}
                        >
                          {brief.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {brief.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(brief.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-4">
                          {/* Final */}
                          <a
                            href={`/creative-strategy-brief/${brief.public_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex flex-col items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="View final brief"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-medium leading-none">Final</span>
                          </a>
                          {/* Original */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/brief/${brief.public_slug}`);
                            }}
                            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                            title="View original brief"
                          >
                            <Archive className="w-4 h-4" />
                            <span className="text-[10px] font-medium leading-none">Original</span>
                          </button>
                          {/* Images */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/brief/${brief.public_slug}/images`);
                            }}
                            className="flex flex-col items-center gap-1 text-emerald-600 hover:text-emerald-800 transition-colors"
                            title="Manage images"
                          >
                            <ImagePlus className="w-4 h-4" />
                            <span className="text-[10px] font-medium leading-none">Images</span>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(brief.public_slug, e)}
                            disabled={deletingId === brief.public_slug}
                            className="flex flex-col items-center gap-1 text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Delete brief"
                          >
                            {deletingId === brief.public_slug ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span className="text-[10px] font-medium leading-none">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        {briefs.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {briefs.length} {briefs.length === 1 ? 'brief' : 'briefs'}
          </div>
        )}
      </div>
    </div>
  );
}
