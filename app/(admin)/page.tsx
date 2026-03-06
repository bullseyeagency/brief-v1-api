'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

type AppState = 'input' | 'processing' | 'error';
type BriefType = 'shopify' | 'local' | 'default';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [briefType, setBriefType] = useState<BriefType>('default');
  const [state, setState] = useState<AppState>('input');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    try {
      setState('processing');

      // Call the API to create brief
      const response = await fetch('/api/create-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, metadata: { type: briefType } }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create brief');
      }

      const data = await response.json();

      if (data.success && data.publicUrl) {
        // Extract slug from publicUrl (URL pattern is /creative-strategy-brief/<slug>)
        const slug = data.slug || data.publicUrl.split('/').pop();

        // Redirect to the status page
        router.push(`/brief-status/${slug}`);
      } else {
        throw new Error('Failed to get brief URL');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate brief');
      setState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-blue-600" />
            <h1 className="text-5xl font-bold text-gray-900">Creative Brief Generator</h1>
          </div>
          <p className="text-xl text-gray-600">
            Transform any website into a complete creative brief using AI
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by the Mercenary Creative System
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {state === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  id="type"
                  value={briefType}
                  onChange={(e) => setBriefType(e.target.value as BriefType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white"
                >
                  <option value="default">Default</option>
                  <option value="shopify">Shopify / Ecommerce</option>
                  <option value="local">Local / Service Business</option>
                </select>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <Sparkles className="w-5 h-5" />
                Generate Creative Brief
              </button>

              <p className="text-sm text-gray-500 text-center">
                The brief will be generated using server-side AI and saved to the database.
                <br />
                You'll be redirected to the processing page.
              </p>
            </form>
          )}

          {state === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Creating Brief...
              </h3>
              <p className="text-gray-600">
                Setting up brief generation. You'll be redirected to the processing page momentarily.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generation Failed
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => {
                  setState('input');
                  setError('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-blue-600 font-semibold mb-2">Step 1</div>
            <h3 className="font-semibold text-gray-900 mb-2">Website Crawl</h3>
            <p className="text-sm text-gray-600">
              We analyze your website content, structure, and messaging
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-blue-600 font-semibold mb-2">Step 2</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Generation</h3>
            <p className="text-sm text-gray-600">
              Our AI creates a complete creative brief following the Mercenary framework
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-blue-600 font-semibold mb-2">Step 3</div>
            <h3 className="font-semibold text-gray-900 mb-2">Deliverables</h3>
            <p className="text-sm text-gray-600">
              Get campaign ideas, ad copy, and creative direction ready to use
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
