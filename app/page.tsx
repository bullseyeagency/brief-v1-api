'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { AIProvider, PROVIDER_CONFIGS, CreativeBrief, CrawlResult, Deliverables } from '@/lib/types';
import { saveBriefOutput } from '@/lib/store';
import { buildSystemPrompt, buildGenerationPrompt, buildDeliverablesPrompt } from '@/lib/prompts';

type AppState = 'input' | 'processing' | 'error';

interface TaskLog {
  time: string;
  message: string;
}

const TASKS = [
  { id: 'init', label: 'Initializing', progress: 5 },
  { id: 'crawl-start', label: 'Starting website crawl', progress: 10 },
  { id: 'crawl-fetch', label: 'Fetching pages', progress: 20 },
  { id: 'crawl-complete', label: 'Crawl complete', progress: 30 },
  { id: 'prompt-prep', label: 'Preparing AI prompts', progress: 35 },
  { id: 'ai-brief-start', label: 'Sending to AI for brief generation', progress: 40 },
  { id: 'ai-brief-processing', label: 'AI is generating creative brief', progress: 55 },
  { id: 'ai-brief-complete', label: 'Brief generation complete', progress: 70 },
  { id: 'ai-deliverables-start', label: 'Generating deliverables', progress: 75 },
  { id: 'ai-deliverables-processing', label: 'AI is generating deliverables', progress: 85 },
  { id: 'ai-deliverables-complete', label: 'Deliverables complete', progress: 95 },
  { id: 'complete', label: 'Complete! Redirecting...', progress: 100 },
];

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [model, setModel] = useState(PROVIDER_CONFIGS.claude.defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [state, setState] = useState<AppState>('input');
  const [error, setError] = useState('');

  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log container
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { time, message }]);
  };

  const updateProgress = (taskId: string) => {
    const task = TASKS.find(t => t.id === taskId);
    if (task) {
      setProgress(task.progress);
      setCurrentTask(task.label);
      addLog(task.label);
    }
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(PROVIDER_CONFIGS[newProvider].defaultModel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLogs([]);
    setProgress(0);

    if (!url) {
      setError('Please enter a URL');
      return;
    }
    if (!apiKey) {
      setError('Please enter your API key');
      return;
    }

    try {
      setState('processing');
      updateProgress('init');

      // Step 1: Crawl
      updateProgress('crawl-start');
      await new Promise(r => setTimeout(r, 300)); // Small delay for UX
      updateProgress('crawl-fetch');

      const crawlResponse = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!crawlResponse.ok) {
        const err = await crawlResponse.json();
        throw new Error(err.error || 'Failed to crawl website');
      }

      const crawlResult: CrawlResult = await crawlResponse.json();
      addLog(`Found ${crawlResult.pages.length} pages to analyze`);
      updateProgress('crawl-complete');

      // Step 2: Prepare prompts
      updateProgress('prompt-prep');
      const systemPrompt = buildSystemPrompt();
      const generationPrompt = buildGenerationPrompt(crawlResult);
      addLog(`System prompt: ${systemPrompt.length} characters`);
      addLog(`Generation prompt: ${generationPrompt.length} characters`);

      // Step 3: Generate brief
      updateProgress('ai-brief-start');
      await new Promise(r => setTimeout(r, 200));
      updateProgress('ai-brief-processing');

      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crawlResult,
          provider,
          model,
          apiKey,
        }),
      });

      if (!generateResponse.ok) {
        const err = await generateResponse.json();
        throw new Error(err.error || 'Failed to generate brief');
      }

      const generateData = await generateResponse.json();
      const brief: CreativeBrief = generateData.brief;
      const deliverables: Deliverables = generateData.deliverables;

      updateProgress('ai-brief-complete');
      addLog(`Brief generated with ${brief.avatars.length} avatars and ${brief.proofPillars.length} proof pillars`);

      // Note: Deliverables are generated in the same API call
      updateProgress('ai-deliverables-start');
      await new Promise(r => setTimeout(r, 200));
      updateProgress('ai-deliverables-processing');
      await new Promise(r => setTimeout(r, 300));
      updateProgress('ai-deliverables-complete');
      addLog('Deliverables package ready');

      // Build deliverables prompt for debug console
      const deliverablesPrompt = buildDeliverablesPrompt(JSON.stringify(brief, null, 2));

      // Save to localStorage for the results page
      saveBriefOutput({
        url,
        crawlResult,
        brief,
        deliverables,
        provider: generateData.provider,
        model: generateData.model,
        generatedAt: new Date().toISOString(),
        logs: logs.map(l => `[${l.time}] ${l.message}`).concat([
          `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Complete! Redirecting...`
        ]),
        prompts: {
          systemPrompt,
          generationPrompt,
          deliverablesPrompt,
        },
      });

      updateProgress('complete');

      // Redirect to results page
      setTimeout(() => {
        router.push('/brand-output');
      }, 500);

    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
      addLog(`ERROR: ${err instanceof Error ? err.message : 'An error occurred'}`);
    }
  };

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Creative Brief Generator</h1>
          <p className="text-gray-600 text-lg">
            Transform any website into a complete creative brief using the Mercenary Creative System
          </p>
          <p className="text-xs text-gray-400 mt-2">v1.01</p>
        </div>

        {/* Input Form */}
        {(state === 'input' || state === 'error') && (
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
              {/* URL Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Provider Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderChange(p)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        provider === p
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{PROVIDER_CONFIGS[p].name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {PROVIDER_CONFIGS[provider].models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${PROVIDER_CONFIGS[provider].name} API key`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is sent directly to {PROVIDER_CONFIGS[provider].name} and is not stored.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Creative Brief
              </button>
            </form>
          </div>
        )}

        {/* Processing State with Progress */}
        {state === 'processing' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Progress Header */}
              <div className="flex items-center gap-4 mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{currentTask}</h2>
                  <p className="text-sm text-gray-500">Processing {url}</p>
                </div>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
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
                <div
                  ref={logContainerRef}
                  className="bg-gray-900 p-4 h-48 overflow-auto font-mono text-sm"
                >
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 text-green-400">
                      <span className="text-gray-500">[{log.time}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <span className="text-gray-500">Starting...</span>
                  )}
                </div>
              </div>

              {/* Estimated Time */}
              <p className="text-center text-sm text-gray-500 mt-4">
                Estimated time remaining: {progress < 30 ? '~45 seconds' : progress < 70 ? '~30 seconds' : '~10 seconds'}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
