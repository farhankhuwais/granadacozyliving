import { BrowserRouter } from "react-router-dom";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export default function MobileLayout({ children, hideNav }: MobileLayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-black">
      {children}
      {!hideNav && <div className="h-20" />}
      {!hideNav && <BottomNav />}
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-black bg-opacity-95">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        <span className="text-[10px] text-gray-500">Navigasi</span>
      </div>
    </nav>
  );
}

export function AppWithRouter({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
