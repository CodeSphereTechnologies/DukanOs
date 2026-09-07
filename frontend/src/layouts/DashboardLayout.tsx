import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MobileNavigation } from '../components/layout/MobileNavigation';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LoadingState } from '../components/ui/LoadingState';
import { cn } from '../lib/utils';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Automatically close mobile sidebar whenever navigating to any route
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close on Escape key and prevent background body scrolling when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  if (!user) {
    return <LoadingState fullPage message="Authenticating session..." />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Desktop Fixed Sidebar (Only rendered/visible on >= 768px screens) */}
      <div className="hidden md:block fixed top-0 left-0 bottom-0 z-40 print:hidden">
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-xs transition-opacity duration-200 print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer (Hidden & translated off-screen when closed) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-64 z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl bg-white flex flex-col print:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none invisible'
        )}
      >
        <Sidebar
          user={user}
          collapsed={false}
          onToggleCollapse={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
          isMobile
        />
      </div>

      {/* Main Content Area - offset by fixed sidebar width on desktop */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out pb-16 md:pb-0 print:pl-0',
          collapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        <Header onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};

