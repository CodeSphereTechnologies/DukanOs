import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  className,
  onClick,
}) => {
  return (
    <Card
      className={cn('p-5 flex flex-col justify-between', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-[#71717A] tracking-tight">{title}</span>
          <div className="text-2xl font-bold text-[#18181B] mt-1.5 font-display tracking-tight">
            {value}
          </div>
        </div>
        {icon && <div className="p-2 bg-[#FAFAF8] rounded-xl text-[#71717A] border border-[#E4E4E7]">{icon}</div>}
      </div>

      {change && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[#E4E4E7]/50 text-xs">
          <Badge
            variant={change.trend === 'up' ? 'mint' : change.trend === 'down' ? 'destructive' : 'neutral'}
            size="sm"
            className="gap-1 font-semibold"
          >
            {change.trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {change.trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {change.trend === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{change.value}</span>
          </Badge>
          {change.label && <span className="text-[#71717A] text-[11px]">{change.label}</span>}
        </div>
      )}
    </Card>
  );
};
