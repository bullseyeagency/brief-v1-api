'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, FileText, Settings, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { loadBriefOutput, BriefOutput } from '@/lib/store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [hasOutput, setHasOutput] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  useEffect(() => {
    const output = loadBriefOutput();
    if (output) {
      setHasOutput(true);
      setLastUrl(output.url);
    }
  }, [pathname]);

  const mainNavItems: NavItem[] = [
    {
      href: '/',
      label: 'New Brief',
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      href: '/brand-output',
      label: 'Brand Output',
      icon: <FileText className="w-5 h-5" />,
      disabled: !hasOutput,
    },
    {
      href: '/briefs',
      label: 'All Briefs',
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Creative Brief</h1>
            <p className="text-[10px] text-gray-400">v1.01</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isDisabled = item.disabled;

            if (isDisabled) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 cursor-not-allowed"
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-gray-700" />

        {/* Bottom Nav */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Last Generated */}
      {hasOutput && lastUrl && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Last Generated</p>
          <p className="text-xs text-gray-400 truncate" title={lastUrl}>
            {lastUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-[10px] text-gray-500">Mercenary Creative System</p>
        <p className="text-[10px] text-gray-600">Bullseye Agency</p>
      </div>
    </aside>
  );
}
