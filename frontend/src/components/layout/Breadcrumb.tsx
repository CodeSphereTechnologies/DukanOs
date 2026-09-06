import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-[#71717A] overflow-hidden whitespace-nowrap">
      <Link to="/" className="hover:text-black flex items-center gap-1 shrink-0">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formattedName = name
          .split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-[#A1A1AA] shrink-0" />
            {isLast ? (
              <span className="font-semibold text-black truncate max-w-[140px] sm:max-w-none">{formattedName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-black truncate max-w-[90px] sm:max-w-none hidden xs:inline sm:inline">
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
