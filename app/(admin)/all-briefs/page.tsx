'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { V1GeneratedBrief } from '@/lib/supabase';
import { FileText, ExternalLink, Loader2, Trash2, Sparkles, Archive, Users, Map, Image, Film, RefreshCw } from 'lucide-react';

export default function BriefsListPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<V1GeneratedBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<{ briefId: string; type: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unsent' | 'sent'>('all');

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

  const handleRegen = async (briefId: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRegenerating({ briefId, type });
    setError('');
    try {
      const response = await fetch('/api/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to regenerate');
      setBriefs(prev => prev.map(b => b.id === briefId ? { ...b, images: data.images } : b));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setRegenerating(null);
    }
  };

  const filteredBriefs = briefs.filter(b => {
    const sentAt = (b as any).sent_at;
    if (activeTab === 'sent') return !!sentAt;
    if (activeTab === 'unsent') return !sentAt;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            Creative Briefs
          </h1>
          <p className="text-gray-600 mb-2">
            All generated creative briefs from brief-v1-api
          </p>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {(['all', 'unsent', 'sent'] as const).map((tab) => {
              const count = tab === 'all' ? briefs.length
                : tab === 'sent' ? briefs.filter(b => !!(b as any).sent_at).length
                : briefs.filter(b => !(b as any).sent_at).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab} <span className="ml-1 text-xs text-gray-400">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBriefs.length === 0 && (
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
        {filteredBriefs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source URL
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBriefs.map((brief) => (
                    <tr
                      key={brief.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/brief-report/${brief.public_slug}`)}
                    >
                      <td className="px-2 py-1.5 text-xs">
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
                      <td className="px-2 py-1.5 text-xs">
                        <span
                          className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                            (brief as any).metadata?.type
                          )}`}
                        >
                          {getTypeName((brief as any).metadata?.type)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-900">
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">{brief.model}</span>
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-900">
                        {formatDate(brief.created_at)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs">
                        <div className="flex items-center justify-end gap-3">
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
                            <span className="text-[10px] font-medium leading-none">Visual</span>
                          </a>
                          {/* Original */}
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/brief-report/${brief.public_slug}`); }}
                            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                            title="View original brief"
                          >
                            <Archive className="w-4 h-4" />
                            <span className="text-[10px] font-medium leading-none">Report</span>
                          </button>

                          {/* Divider */}
                          <div className="w-px h-8 bg-gray-200" />

                          {/* Regen Avatars */}
                          <button
                            onClick={(e) => handleRegen(brief.id, 'avatars', e)}
                            disabled={!!regenerating}
                            className="flex flex-col items-center gap-1 text-amber-600 hover:text-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Regenerate avatars"
                          >
                            {regenerating?.briefId === brief.id && regenerating.type === 'avatars'
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Users className="w-4 h-4" />}
                            <span className="text-[10px] font-medium leading-none">Avatars</span>
                          </button>
                          {/* Regen Journey */}
                          <button
                            onClick={(e) => handleRegen(brief.id, 'journey', e)}
                            disabled={!!regenerating}
                            className="flex flex-col items-center gap-1 text-amber-600 hover:text-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Regenerate journey pages"
                          >
                            {regenerating?.briefId === brief.id && regenerating.type === 'journey'
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Map className="w-4 h-4" />}
                            <span className="text-[10px] font-medium leading-none">Journey</span>
                          </button>
                          {/* Regen FB */}
                          <button
                            onClick={(e) => handleRegen(brief.id, 'facebook', e)}
                            disabled={!!regenerating}
                            className="flex flex-col items-center gap-1 text-amber-600 hover:text-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Regenerate Facebook ads"
                          >
                            {regenerating?.briefId === brief.id && regenerating.type === 'facebook'
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Image className="w-4 h-4" />}
                            <span className="text-[10px] font-medium leading-none">META</span>
                          </button>
                          {/* Regen TV */}
                          <button
                            onClick={(e) => handleRegen(brief.id, 'tv', e)}
                            disabled={!!regenerating}
                            className="flex flex-col items-center gap-1 text-amber-600 hover:text-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Regenerate storyboard frames"
                          >
                            {regenerating?.briefId === brief.id && regenerating.type === 'tv'
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Film className="w-4 h-4" />}
                            <span className="text-[10px] font-medium leading-none">TV</span>
                          </button>
                          {/* All Images */}
                          <button
                            onClick={(e) => handleRegen(brief.id, 'all', e)}
                            disabled={!!regenerating}
                            className="flex flex-col items-center gap-1 text-emerald-600 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Regenerate all 13 images"
                          >
                            {regenerating?.briefId === brief.id && regenerating.type === 'all'
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <RefreshCw className="w-4 h-4" />}
                            <span className="text-[10px] font-medium leading-none">All</span>
                          </button>

                          {/* Divider */}
                          <div className="w-px h-8 bg-gray-200" />

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(brief.public_slug, e)}
                            disabled={deletingId === brief.public_slug}
                            className="flex flex-col items-center gap-1 text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Delete brief"
                          >
                            {deletingId === brief.public_slug
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
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
        {filteredBriefs.length > 0 && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Showing {filteredBriefs.length} of {briefs.length} {briefs.length === 1 ? 'brief' : 'briefs'}
          </div>
        )}
      </div>
    </div>
  );
}
