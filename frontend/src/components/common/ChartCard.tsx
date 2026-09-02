import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';

export interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  action,
  children,
}) => {
  return (
    <Card>
      <CardHeader title={title} description={description} action={action} />
      <CardContent>{children}</CardContent>
    </Card>
  );
};
