import { BrowserRouter } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PWABanner from "@/components/PWABanner";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export default function MobileLayout({ children, hideNav }: MobileLayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      <PWABanner />
      <div className="pt-2">{children}</div>
      {!hideNav && <div className="h-20" />}
      {!hideNav && <BottomNav />}
    </div>
  );
}

export function AppWithRouter({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
