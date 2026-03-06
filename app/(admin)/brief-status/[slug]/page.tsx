'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';

interface PageProps {
  params: { slug: string };
}

interface BriefStatus {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  current_task: string;
  logs: string[];
  source_url: string;
  error_message?: string;
}

type StepStatus = 'pending' | 'in-progress' | 'done' | 'failed';

interface Step {
  key: string;
  label: string;
  description: string;
  /** Inclusive lower bound of the progress range for this stage. */
  rangeStart: number;
  /** Inclusive upper bound of the progress range for this stage. */
  rangeEnd: number;
}

const STEPS: Step[] = [
  {
    key: 'crawling',
    label: 'Crawling website',
    description: 'Fetching sitemap, selecting pages, scraping content',
    rangeStart: 0,
    rangeEnd: 29,
  },
  {
    key: 'preparing',
    label: 'Preparing content',
    description: 'Cleaning data, building AI prompts',
    rangeStart: 30,
    rangeEnd: 44,
  },
  {
    key: 'brief',
    label: 'Generating brief',
    description: 'AI call #1 — creative brief, avatars, brand strategy',
    rangeStart: 45,
    rangeEnd: 69,
  },
  {
    key: 'deliverables',
    label: 'Generating deliverables',
    description: 'AI call #2 — website summary, Facebook campaigns, storyboard',
    rangeStart: 70,
    rangeEnd: 82,
  },
  {
    key: 'avatars',
    label: 'Generating avatars',
    description: 'Creating 3 character images',
    rangeStart: 83,
    rangeEnd: 89,
  },
  {
    key: 'section-images',
    label: 'Generating section images',
    description: 'Section images using avatars as reference',
    rangeStart: 90,
    rangeEnd: 94,
  },
  {
    key: 'saving-images',
    label: 'Saving images',
    description: 'Uploading to permanent storage',
    rangeStart: 95,
    rangeEnd: 98,
  },
  {
    key: 'finalising',
    label: 'Finalising',
    description: 'Calculating costs, editorial summary',
    rangeStart: 99,
    rangeEnd: 99,
  },
  {
    key: 'complete',
    label: 'Complete',
    description: 'Done',
    rangeStart: 100,
    rangeEnd: 100,
  },
];

/**
 * Derive each step's status from overall progress and generation status.
 * A step is:
 *   - 'done'       when progress is past its rangeEnd
 *   - 'in-progress' when progress falls within its range (rangeStart–rangeEnd)
 *   - 'failed'     when it is the active step and status === 'failed'
 *   - 'pending'    otherwise
 */
function deriveStepStatuses(
  progress: number,
  status: BriefStatus['status']
): StepStatus[] {
  return STEPS.map((step) => {
    if (status === 'completed') return 'done';

    const isDone = progress > step.rangeEnd;
    const isCurrent = progress >= step.rangeStart && progress <= step.rangeEnd;

    if (isDone) return 'done';
    if (isCurrent) return status === 'failed' ? 'failed' : 'in-progress';
    return 'pending';
  });
}

function StepIndicator({ stepStatus }: { stepStatus: StepStatus }) {
  if (stepStatus === 'done') {
    return <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
  }
  if (stepStatus === 'in-progress') {
    return <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />;
  }
  if (stepStatus === 'failed') {
    return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
  }
  return <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />;
}

function stepLabelColor(stepStatus: StepStatus): string {
  if (stepStatus === 'done') return 'text-slate-200';
  if (stepStatus === 'in-progress') return 'text-white';
  if (stepStatus === 'failed') return 'text-red-400';
  return 'text-slate-500';
}

function stepDescriptionColor(stepStatus: StepStatus): string {
  if (stepStatus === 'done') return 'text-slate-500';
  if (stepStatus === 'in-progress') return 'text-slate-400';
  if (stepStatus === 'failed') return 'text-red-400/70';
  return 'text-slate-600';
}

/**
 * /brief-status/[slug]
 * Live status page that polls /api/brief/[slug]/status every 3 seconds.
 */
export default function BriefStatusPage({ params }: PageProps) {
  const { slug } = params;
  const router = useRouter();

  const [briefStatus, setBriefStatus] = useState<BriefStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [skipRedirect, setSkipRedirect] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll log to bottom whenever logs change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [briefStatus?.logs]);

  // Initial load — fetch full brief record for source_url
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetch(`/api/brief/${slug}`);
        if (!res.ok) {
          setLoadError(res.status === 404 ? 'Brief not found.' : 'Failed to load brief.');
          return;
        }
        const data = await res.json();
        setBriefStatus({
          status: data.status,
          progress: data.progress ?? 0,
          current_task: data.current_task ?? 'Initializing...',
          logs: data.logs ?? [],
          source_url: data.source_url ?? '',
          error_message: data.error_message,
        });
      } catch {
        setLoadError('Failed to connect to server.');
      }
    }
    loadInitial();
  }, [slug]);

  // Poll /api/brief/[slug]/status every 3 seconds while processing
  useEffect(() => {
    if (!briefStatus || briefStatus.status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/brief/${slug}/status`);
        if (!res.ok) return;
        const data = await res.json();

        setBriefStatus((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
            progress: data.progress ?? prev.progress,
            current_task: data.currentTask ?? prev.current_task,
            logs: data.logs ?? prev.logs,
            error_message: data.errorMessage,
          };
        });
      } catch {
        // Silently ignore transient network errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [slug, briefStatus?.status]);

  // Auto-redirect 3 seconds after completion
  useEffect(() => {
    if (briefStatus?.status !== 'completed' || skipRedirect) return;

    setRedirectCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setRedirectCountdown((n) => Math.max(0, n - 1));
    }, 1000);

    redirectTimerRef.current = setTimeout(() => {
      if (!skipRedirect) {
        router.push(`/brief/${slug}`);
      }
    }, 3000);

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [briefStatus?.status, skipRedirect, slug, router]);

  // Cancel redirect when skip is toggled
  useEffect(() => {
    if (skipRedirect) {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [skipRedirect]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Unable to Load Brief</h1>
          <p className="text-slate-400 mb-6">{loadError}</p>
          <a
            href="/"
            className="inline-block bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Start Over
          </a>
        </div>
      </div>
    );
  }

  if (!briefStatus) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  const stepStatuses = deriveStepStatuses(briefStatus.progress, briefStatus.status);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Brief Generation</p>
          <h1 className="text-2xl font-semibold text-white truncate">
            {briefStatus.source_url || 'Processing...'}
          </h1>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">{briefStatus.current_task}</span>
            <span className="text-sm font-medium text-slate-300">{briefStatus.progress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                briefStatus.status === 'failed'
                  ? 'bg-red-500'
                  : briefStatus.status === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${briefStatus.progress}%` }}
            />
          </div>
        </div>

        {/* Step timeline */}
        <div className="mb-8 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Steps</span>
          </div>
          <ul className="divide-y divide-slate-700/50">
            {STEPS.map((step, i) => {
              const s = stepStatuses[i];
              const isActive = s === 'in-progress';
              return (
                <li key={step.key} className="flex items-start gap-3 px-4 py-3">
                  <StepIndicator stepStatus={s} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold leading-snug ${stepLabelColor(s)}`}>
                      {step.label}
                    </p>
                    <p className={`text-xs leading-snug mt-0.5 ${stepDescriptionColor(s)}`}>
                      {step.description}
                    </p>
                    {isActive && briefStatus.current_task && (
                      <p className="text-xs text-blue-400 mt-1 leading-snug">
                        {briefStatus.current_task}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Task log */}
        <div className="mb-8 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Task Log</span>
            {briefStatus.status === 'processing' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            )}
          </div>
          <div
            ref={logContainerRef}
            className="bg-slate-950 p-4 h-48 overflow-auto font-mono text-xs leading-relaxed"
          >
            {briefStatus.logs.length === 0 ? (
              <span className="text-slate-600">Waiting for logs...</span>
            ) : (
              briefStatus.logs.map((line, i) => (
                <div key={i} className="text-emerald-400 whitespace-pre-wrap">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed state */}
        {briefStatus.status === 'completed' && (
          <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <h2 className="text-lg font-semibold text-white">Brief Ready</h2>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <a
                href={`/brief/${slug}`}
                className="bg-white text-slate-900 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                View Brief
              </a>
              <a
                href={`/brief-report/${slug}`}
                className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                View Report
              </a>
            </div>
            {!skipRedirect && (
              <p className="text-xs text-slate-500">
                Redirecting to brief in {redirectCountdown}s...{' '}
                <button
                  onClick={() => setSkipRedirect(true)}
                  className="text-slate-400 underline hover:text-white transition-colors"
                >
                  Skip
                </button>
              </p>
            )}
          </div>
        )}

        {/* Failed state */}
        {briefStatus.status === 'failed' && (
          <div className="bg-slate-800 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <h2 className="text-lg font-semibold text-white">Generation Failed</h2>
            </div>
            {briefStatus.error_message && (
              <p className="text-sm text-slate-400 mb-4">{briefStatus.error_message}</p>
            )}
            <a
              href="/"
              className="inline-block bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Try Again
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
