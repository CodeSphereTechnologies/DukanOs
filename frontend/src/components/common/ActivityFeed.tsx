import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatDate } from '../../lib/formatters';

export interface ActivityItem {
  id: string | number;
  user: string;
  action: string;
  timestamp: string;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, title = 'Audit & Activity Stream' }) => {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent className="p-0 divide-y divide-[#E4E4E7]/60">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#FAFAF8]">
            <div>
              <span className="font-semibold text-[#18181B]">{item.user}</span>{' '}
              <span className="text-[#52525B]">{item.action}</span>
            </div>
            <span className="text-[#71717A] shrink-0 ml-3">{formatDate(item.timestamp, true)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
