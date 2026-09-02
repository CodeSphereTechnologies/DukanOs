import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';

export interface RecentTableProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const RecentTable: React.FC<RecentTableProps> = ({ title, action, children }) => {
  return (
    <Card>
      <CardHeader title={title} action={action} />
      <CardContent className="p-0 overflow-x-auto">{children}</CardContent>
    </Card>
  );
};
