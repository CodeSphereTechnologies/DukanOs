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

  // Global Keyboard Shortcut: Ctrl+B or Cmd+B to toggle sidebar / drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          setCollapsed((prev) => !prev);
        } else {
          setMobileOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          className="fixed inset-0 bg-black/40 z-50 md:hidden backdrop-blur-xs transition-opacity duration-300 print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl bg-white flex flex-col print:hidden rounded-r-2xl overflow-hidden',
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
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out pb-16 md:pb-0 print:pl-0',
          collapsed ? 'md:pl-[68px]' : 'md:pl-64'
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

