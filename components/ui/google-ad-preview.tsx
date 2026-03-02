'use client';

import { cn } from '@/lib/utils';

interface GoogleAdPreviewProps {
  headline: string;
  headline2?: string;
  headline3?: string;
  description: string;
  displayUrl: string;
  path1?: string;
  path2?: string;
  targetLabel?: string;
  className?: string;
}

export function GoogleAdPreview({
  headline,
  headline2,
  headline3,
  description,
  displayUrl,
  path1,
  path2,
  targetLabel,
  className,
}: GoogleAdPreviewProps) {
  const fullUrl = [displayUrl, path1, path2].filter(Boolean).join('/');
  const headlines = [headline, headline2, headline3].filter(Boolean);

  return (
    <div className={cn(
      'relative w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4',
      className
    )}>
      {/* Platform badge */}
      <div className="absolute top-4 right-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Google Search
        </span>
      </div>

      {/* Search result card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        {/* URL row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Google G-style favicon dot */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-yellow-400 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-800 font-medium leading-tight truncate">{displayUrl}</span>
            <span className="text-[10px] text-gray-500 leading-tight truncate">
              {['Ad', fullUrl].join(' · ')}
            </span>
          </div>
        </div>

        {/* Headlines */}
        <h3 className="text-[#1a0dab] text-base font-normal leading-snug mb-1 hover:underline cursor-pointer">
          {headlines.join(' | ')}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Sitelinks row (static decorative) */}
      <div className="flex gap-3">
        {['Learn More', 'Get Started', 'Contact Us'].map((link) => (
          <span key={link} className="text-xs text-[#1a0dab] hover:underline cursor-pointer whitespace-nowrap">
            {link}
          </span>
        ))}
      </div>

      {/* Target badge */}
      {targetLabel && (
        <div className="pt-1 border-t border-gray-100">
          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            {targetLabel} Audience
          </span>
        </div>
      )}
    </div>
  );
}
