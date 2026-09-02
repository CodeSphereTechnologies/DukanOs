import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, className }) => {
  return (
    <Card className={cn('p-4 text-center', className)}>
      <div className="text-xs text-[#71717A] font-medium">{label}</div>
      <div className="text-lg font-bold text-[#18181B] mt-1 font-display">{value}</div>
      {subtext && <div className="text-[11px] text-[#A1A1AA] mt-0.5">{subtext}</div>}
    </Card>
  );
};
