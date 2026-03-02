import Sidebar from '@/components/Sidebar';
import DebugConsole from '@/components/DebugConsole';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="pl-56 pb-16">
        {children}
      </div>
      <DebugConsole />
    </>
  );
}
