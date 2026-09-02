import React from 'react';
import { Card } from '../ui/Card';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  className,
}) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-5 cursor-pointer hover:border-black transition-all hover:shadow-md group flex items-center justify-between',
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 bg-[#FAFAF8] rounded-xl text-black border border-[#E4E4E7] group-hover:bg-black group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#18181B] font-display group-hover:text-black">
            {title}
          </h4>
          <p className="text-xs text-[#71717A] mt-0.5">{description}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-black group-hover:translate-x-1 transition-all shrink-0 ml-2" />
    </Card>
  );
};
