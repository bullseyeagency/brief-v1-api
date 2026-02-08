import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import DebugConsole from '@/components/DebugConsole';

export const metadata: Metadata = {
  title: 'Creative Brief | URL to Brief Generator',
  description: 'Generate complete creative briefs from any website URL using the Mercenary Creative System.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="pl-56 pb-16">
          {children}
        </div>
        <DebugConsole />
      </body>
    </html>
  );
}
