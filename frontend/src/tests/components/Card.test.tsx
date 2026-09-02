import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/common/StatCard';

describe('Card and StatCard Components', () => {
  it('renders Card with header and content', () => {
    render(
      <Card>
        <CardHeader title="Store Metrics" description="Performance overview" />
        <CardContent>Content Area</CardContent>
      </Card>
    );

    expect(screen.getByText('Store Metrics')).toBeInTheDocument();
    expect(screen.getByText('Performance overview')).toBeInTheDocument();
    expect(screen.getByText('Content Area')).toBeInTheDocument();
  });

  it('renders StatCard with value and growth trend badge in mint', () => {
    render(
      <StatCard
        title="Today's Sales"
        value="PKR 68,450"
        change={{ value: '+14.2%', trend: 'up', label: 'vs yesterday' }}
      />
    );

    expect(screen.getByText("Today's Sales")).toBeInTheDocument();
    expect(screen.getByText('PKR 68,450')).toBeInTheDocument();
    expect(screen.getByText('+14.2%')).toBeInTheDocument();
    expect(screen.getByText('vs yesterday')).toBeInTheDocument();
  });
});
